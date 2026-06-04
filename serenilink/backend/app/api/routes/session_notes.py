from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.session_note import SessionNote
from app.models.booking import Booking
from app.models.counselor import Counselor
from app.schemas.session_note import SessionNoteUpsert, SessionNoteOut

router = APIRouter(prefix="/notes", tags=["Session Notes"])


def _get_counselor(db: Session, user_id: int) -> Counselor:
    counselor = db.query(Counselor).filter(
        Counselor.user_id == user_id,
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED",
    ).first()
    if not counselor:
        raise HTTPException(status_code=403, detail="Counselor access required")
    return counselor


@router.put("/booking/{booking_id}", response_model=SessionNoteOut)
def upsert_note(
    booking_id: int,
    payload: SessionNoteUpsert,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_counselor(db, current_user.id)

    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.counselor_id == counselor.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    note = db.query(SessionNote).filter(SessionNote.booking_id == booking_id).first()
    if note:
        note.note_text = payload.note_text
        note.is_shared_with_user = payload.is_shared_with_user
        note.updated_at = datetime.utcnow()
    else:
        note = SessionNote(
            booking_id=booking_id,
            counselor_id=counselor.id,
            note_text=payload.note_text,
            is_shared_with_user=payload.is_shared_with_user,
        )
        db.add(note)

    db.commit()
    db.refresh(note)
    return note


@router.get("/booking/{booking_id}", response_model=SessionNoteOut)
def get_note_counselor(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_counselor(db, current_user.id)
    note = db.query(SessionNote).filter(
        SessionNote.booking_id == booking_id,
        SessionNote.counselor_id == counselor.id,
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="No note for this booking")
    return note


@router.get("/booking/{booking_id}/user", response_model=SessionNoteOut)
def get_note_user(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    note = db.query(SessionNote).filter(
        SessionNote.booking_id == booking_id,
        SessionNote.is_shared_with_user == True,
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="No shared note for this booking")
    return note
