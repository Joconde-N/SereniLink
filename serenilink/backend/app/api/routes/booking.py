from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_admin
from app.models.booking import Booking
from app.models.counselor import Counselor
from app.schemas.booking import BookingCreate, BookingUpdateStatus, BookingOut

router = APIRouter(prefix="/bookings", tags=["Bookings"])

ALLOWED_STATUSES = {"PENDING", "APPROVED", "DECLINED", "COMPLETED", "CANCELLED"}


@router.post("/", response_model=BookingOut, status_code=201)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ensure counselor exists and is active
    counselor = db.query(Counselor).filter(
        Counselor.id == payload.counselor_id,
        Counselor.is_active == True
    ).first()

    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found or inactive")

    # basic validation: future datetime
    if payload.scheduled_for <= datetime.utcnow():
        raise HTTPException(status_code=409, detail="scheduled_for must be a future date/time")

    item = Booking(
        user_id=current_user.id,
        counselor_id=payload.counselor_id,
        scheduled_for=payload.scheduled_for,
        reason=payload.reason,
        status="PENDING"
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/me", response_model=list[BookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=10, le=50),
):
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/", response_model=list[BookingOut])
def list_all_bookings(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    status: str | None = None,
    skip: int = 0,
    limit: int = Query(default=10, le=50),
):
    q = db.query(Booking)

    if status:
        q = q.filter(Booking.status == status.upper())

    return q.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    payload: BookingUpdateStatus,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(Booking).filter(Booking.id == booking_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = payload.status.upper()
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid status. Allowed: {sorted(list(ALLOWED_STATUSES))}"
        )

    item.status = new_status
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{booking_id}", status_code=204)
def cancel_my_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = db.query(Booking).filter(Booking.id == booking_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Booking not found")

    # user can only cancel own booking
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    # only cancel pending/approved (you can adjust)
    if item.status not in ("PENDING", "APPROVED"):
        raise HTTPException(status_code=409, detail="Only PENDING or APPROVED bookings can be cancelled")

    item.status = "CANCELLED"
    item.updated_at = datetime.utcnow()
    db.commit()
    return None