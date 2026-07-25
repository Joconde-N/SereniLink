from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from collections import defaultdict

from app.api.deps import get_db, get_current_user, require_admin
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.booking import Booking
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatOut
from app.models.counselor import Counselor
from app.models.notification import Notification

router = APIRouter(prefix="/chat", tags=["Chat"])

# Simple in-memory room map: booking_id -> set of websockets
# Beginner-friendly (works for one server process)
chat_rooms: dict[int, set[WebSocket]] = defaultdict(set)


def _user_from_token(db: Session, token: str) -> User | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        subject = payload.get("sub")
        if not subject:
            return None
        return db.query(User).filter(User.id == int(subject)).first()
    except (JWTError, ValueError):
        return None


def _can_access_booking(db: Session, booking: Booking, user: User) -> bool:
    counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
    if not counselor:
        return False
    return booking.user_id == user.id or counselor.user_id == user.id


def _message_dict(msg: ChatMessage) -> dict:
    return {
        "id": msg.id,
        "booking_id": msg.booking_id,
        "sender_id": msg.sender_id,
        "message": msg.message,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


async def _broadcast(booking_id: int, data: dict):
    dead = []
    for ws in list(chat_rooms[booking_id]):
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        chat_rooms[booking_id].discard(ws)


@router.post("/", response_model=ChatOut, status_code=201)
def send_message(
    payload: ChatCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")

    is_booking_owner = (booking.user_id == current_user.id)
    is_booked_counselor = (counselor.user_id == current_user.id)

    if not (is_booking_owner or is_booked_counselor):
        raise HTTPException(status_code=403, detail="Not allowed to chat in this booking")

    msg = ChatMessage(
        booking_id=payload.booking_id,
        sender_id=current_user.id,
        message=payload.message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    recipient_id = counselor.user_id if is_booking_owner else booking.user_id
    sender_label = current_user.nickname or "Someone"
    notif = Notification(
        user_id=recipient_id,
        title="New Message",
        message=f"{sender_label} sent you a message in booking #{payload.booking_id}.",
    )
    db.add(notif)
    db.commit()

    return msg


@router.websocket("/ws/{booking_id}")
async def chat_websocket(websocket: WebSocket, booking_id: int):
    """
    Real-time booking chat.
    Connect with: ws://host/chat/ws/{booking_id}?token=JWT
    Send JSON: { "message": "hello" }
    Receive JSON: chat message object
    """
    await websocket.accept()
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return

    db = SessionLocal()
    try:
        user = _user_from_token(db, token)
        if not user:
            await websocket.close(code=4401)
            return

        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking or not _can_access_booking(db, booking, user):
            await websocket.close(code=4403)
            return

        counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
        chat_rooms[booking_id].add(websocket)

        # Send recent history once on connect
        history = (
            db.query(ChatMessage)
            .filter(ChatMessage.booking_id == booking_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(100)
            .all()
        )
        await websocket.send_json({
            "type": "history",
            "messages": [_message_dict(m) for m in history],
        })

        while True:
            data = await websocket.receive_json()
            text = (data.get("message") or "").strip()
            if not text:
                continue

            msg = ChatMessage(
                booking_id=booking_id,
                sender_id=user.id,
                message=text,
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            # Notify the other party
            if counselor:
                recipient_id = counselor.user_id if booking.user_id == user.id else booking.user_id
                notif = Notification(
                    user_id=recipient_id,
                    title="New Message",
                    message=f"{user.nickname or 'Someone'} sent you a message in booking #{booking_id}.",
                )
                db.add(notif)
                db.commit()

            payload = {"type": "message", **_message_dict(msg)}
            await _broadcast(booking_id, payload)

    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        chat_rooms[booking_id].discard(websocket)
        db.close()


@router.get("/booking/{booking_id}", response_model=list[ChatOut])
def get_booking_messages(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")

    is_booking_owner = (booking.user_id == current_user.id)
    is_booked_counselor = (counselor.user_id == current_user.id)

    if not (is_booking_owner or is_booked_counselor):
        raise HTTPException(status_code=403, detail="Not allowed to view these messages")

    return (
        db.query(ChatMessage)
        .filter(ChatMessage.booking_id == booking_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/all", response_model=list[ChatOut])
def admin_all_messages(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    return (
        db.query(ChatMessage)
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
