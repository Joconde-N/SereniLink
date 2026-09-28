from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from collections import defaultdict
import asyncio

from app.api.deps import get_db, get_current_user, require_admin
from app.core.config import settings
from app.core.security import token_matches_password
from app.db.session import SessionLocal
from app.models.booking import Booking
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatOut
from app.models.counselor import Counselor
from app.models.notification import Notification

router = APIRouter(prefix="/chat", tags=["Chat"])

# In-memory room map: booking_id -> {websocket: token for revalidation}
# Beginner-friendly (works for one server process)
chat_rooms: dict[int, dict[WebSocket, str]] = defaultdict(dict)


def _user_from_token(db: Session, token: str) -> User | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        subject = payload.get("sub")
        if not subject:
            return None
        user = db.query(User).filter(User.id == int(subject)).first()
        return user if (user and user.is_active and not user.must_change_password
                        and token_matches_password(payload, user.password_hash)) else None
    except (JWTError, ValueError, TypeError):
        return None


def _can_access_booking(db: Session, booking: Booking, user: User, *, write: bool = False) -> bool:
    allowed_statuses = {"APPROVED"} if write else {"APPROVED", "COMPLETED"}
    if not user.is_active or booking.status not in allowed_statuses:
        return False
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
    for ws, token in list(chat_rooms.get(booking_id, {}).items()):
        try:
            # Recheck recipients too: a disabled account must not keep receiving
            # private messages through a socket opened before it was disabled.
            with SessionLocal() as db:
                user = _user_from_token(db, token)
                booking = db.query(Booking).filter(Booking.id == booking_id).first()
                allowed = user and booking and _can_access_booking(db, booking, user)
            if not allowed:
                await ws.close(code=4403)
                dead.append(ws)
                continue
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        chat_rooms[booking_id].pop(ws, None)


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
    if not _can_access_booking(db, booking, current_user, write=True):
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

    try:
        with SessionLocal() as db:
            user = _user_from_token(db, token)
            if not user:
                await websocket.close(code=4401)
                return
            booking = db.query(Booking).filter(Booking.id == booking_id).first()
            if not booking or not _can_access_booking(db, booking, user):
                await websocket.close(code=4403)
                return
            history = (
                db.query(ChatMessage)
                .filter(ChatMessage.booking_id == booking_id)
                .order_by(ChatMessage.created_at.asc())
                .limit(100)
                .all()
            )
            messages = [_message_dict(m) for m in history]
        chat_rooms[booking_id][websocket] = token
        await websocket.send_json({"type": "history", "messages": messages})

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=30)
            except asyncio.TimeoutError:
                data = None

            # A fresh transaction sees deactivation, cancellation, and token
            # expiry during an existing connection, including idle connections.
            with SessionLocal() as db:
                user = _user_from_token(db, token)
                booking = db.query(Booking).filter(Booking.id == booking_id).first()
                if not user:
                    await websocket.close(code=4401)
                    return
                if not booking or not _can_access_booking(db, booking, user):
                    await websocket.close(code=4403)
                    return
                if data is None:
                    continue
                if not _can_access_booking(db, booking, user, write=True):
                    await websocket.send_json({"type": "error", "message": "Completed sessions are read-only."})
                    continue
                text = data.get("message") if isinstance(data, dict) else None
                if not isinstance(text, str) or not text.strip() or len(text.strip()) > 1000:
                    await websocket.send_json({"type": "error", "message": "Message must contain 1 to 1000 characters."})
                    continue
                msg = ChatMessage(booking_id=booking_id, sender_id=user.id, message=text.strip())
                db.add(msg)
                counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
                recipient_id = counselor.user_id if booking.user_id == user.id else booking.user_id
                db.add(Notification(
                    user_id=recipient_id,
                    title="New Message",
                    message=f"{user.nickname or 'Someone'} sent you a message in booking #{booking_id}.",
                ))
                db.commit()
                db.refresh(msg)
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
        room = chat_rooms.get(booking_id)
        if room is not None:
            room.pop(websocket, None)
            if not room:
                chat_rooms.pop(booking_id, None)


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

    if not _can_access_booking(db, booking, current_user):
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
