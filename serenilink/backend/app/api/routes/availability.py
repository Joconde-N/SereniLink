from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.counselor import Counselor
from app.models.availability import AvailabilitySlot
from app.schemas.availability import AvailabilityCreate, AvailabilityOut

router = APIRouter(prefix="/availability", tags=["Availability"])

def _get_my_counselor_profile(db: Session, user_id: int) -> Counselor:
    counselor = db.query(Counselor).filter(
        Counselor.user_id == user_id,
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED"
    ).first()
    if not counselor:
        raise HTTPException(status_code=403, detail="Only approved counselors can manage availability")
    return counselor

@router.post("/me", response_model=AvailabilityOut, status_code=201)
def create_slot(
    payload: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
): 
    counselor = _get_my_counselor_profile(db, current_user.id)

    start = payload.start_time.replace(tzinfo=None)
    end   = payload.end_time.replace(tzinfo=None)

    if end <= start:
        raise HTTPException(status_code=409, detail="end time must be after start time")
    if start <= datetime.utcnow():
        raise HTTPException(status_code=409, detail="start time must be in the future")

    overlap = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.counselor_id == counselor.id,
        AvailabilitySlot.status == "AVAILABLE",
        AvailabilitySlot.start_time < end,
        AvailabilitySlot.end_time > start,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="This slot overlaps an existing available slot")

    slot = AvailabilitySlot(
        counselor_id=counselor.id,
        start_time=start,
        end_time=end,
        status="AVAILABLE",
        updated_at=datetime.utcnow(),
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.get("/me", response_model=list[AvailabilityOut])
def list_my_slots(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    status: str | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
):
    counselor = _get_my_counselor_profile(db, current_user.id)

    q = db.query(AvailabilitySlot).filter(AvailabilitySlot.counselor_id == counselor.id)
    if status:
        q = q.filter(AvailabilitySlot.status == status.upper())

    return q.order_by(AvailabilitySlot.start_time.asc()).offset(skip).limit(limit).all()


@router.patch("/me/{slot_id}", response_model=AvailabilityOut)
def update_slot(
    slot_id: int,
    payload: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_my_counselor_profile(db, current_user.id)

    slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.id == slot_id,
        AvailabilitySlot.counselor_id == counselor.id,
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.status == "BOOKED":
        raise HTTPException(status_code=409, detail="Booked slot cannot be edited")
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=409, detail="end time must be after start time")

    overlap = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.counselor_id == counselor.id,
        AvailabilitySlot.status == "AVAILABLE",
        AvailabilitySlot.id != slot_id,
        AvailabilitySlot.start_time < payload.end_time,
        AvailabilitySlot.end_time > payload.start_time,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="This slot overlaps an existing available slot")

    slot.start_time = payload.start_time.replace(tzinfo=None)
    slot.end_time   = payload.end_time.replace(tzinfo=None)
    slot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/me/{slot_id}", status_code=204)
def delete_my_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_my_counselor_profile(db, current_user.id)

    slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.id == slot_id,
        AvailabilitySlot.counselor_id == counselor.id
    ).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status == "BOOKED":
        raise HTTPException(status_code=409, detail="Booked slot cannot be deleted")

    db.delete(slot)
    db.commit()
    return None


@router.get("/counselor/{counselor_id}", response_model=list[AvailabilityOut])
def list_counselor_available_slots(
    counselor_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = Query(default=20, le=100),
):
    # only future AVAILABLE slots
    now = datetime.utcnow()
    return (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.counselor_id == counselor_id,
            AvailabilitySlot.status == "AVAILABLE",
            AvailabilitySlot.start_time >= now,
        )
        .order_by(AvailabilitySlot.start_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )