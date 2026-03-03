from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_admin
from app.models.booking import Booking
from app.models.chat import ChatMessage
from app.schemas.chat import ChatCreate, ChatOut
from app.models.counselor import Counselor

router = APIRouter(prefix="/chat", tags=["Chat"])

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
    return msg

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
    
