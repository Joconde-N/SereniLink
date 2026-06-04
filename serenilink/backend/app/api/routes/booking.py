from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, require_admin
from app.models.booking import Booking
from app.models.counselor import Counselor
from app.models.availability import AvailabilitySlot
from app.models.notification import Notification
from app.schemas.booking import (
    BookingCreate,
    BookingUpdateStatus,
    BookingOut,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

ALLOWED_STATUSES = {"PENDING", "APPROVED", "DECLINED", "COMPLETED", "CANCELLED"}
COUNSELOR_ALLOWED = {"APPROVED", "DECLINED", "COMPLETED", "CANCELLED"}


def expire_stale_bookings(db: Session):
    """Auto-expire bookings whose scheduled time has passed."""
    now = datetime.utcnow()

    # PENDING bookings that passed their slot — mark DECLINED and free the slot
    stale_pending = db.query(Booking).filter(
        Booking.status == "PENDING",
        Booking.scheduled_for <= now
    ).all()
    for b in stale_pending:
        b.status = "DECLINED"
        b.updated_at = now
        slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == b.slot_id).first()
        if slot:
            slot.status = "AVAILABLE"
            slot.updated_at = now
        create_notification(
            db, b.user_id,
            "Booking Expired",
            "Your booking request expired as the session time passed without a response."
        )

    # APPROVED bookings that passed their slot — mark COMPLETED
    stale_approved = db.query(Booking).filter(
        Booking.status == "APPROVED",
        Booking.scheduled_for <= now
    ).all()
    for b in stale_approved:
        b.status = "COMPLETED"
        b.updated_at = now

    if stale_pending or stale_approved:
        db.commit()


def create_notification(db: Session, user_id: int, title: str, message: str):
    note = Notification(user_id=user_id, title=title, message=message, is_read=False)
    db.add(note)
    db.commit()


def _get_counselor_profile_for_user(db: Session, user_id: int) -> Counselor:
    counselor = db.query(Counselor).filter(
        Counselor.user_id == user_id,
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED",
    ).first()
    if not counselor:
        raise HTTPException(status_code=403, detail="Counselor access required")
    return counselor


def _booking_access_check(db: Session, booking: Booking, current_user) -> tuple[bool, bool, bool]:
    is_owner = booking.user_id == current_user.id

    counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
    is_booked_counselor = (counselor is not None and counselor.user_id == current_user.id)

    is_admin = getattr(current_user, "role", "") == "admin"
    return is_owner, is_booked_counselor, is_admin


@router.post("/", response_model=BookingOut, status_code=201)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = db.query(Counselor).filter(
        Counselor.id == payload.counselor_id,
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED"
    ).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found or inactive")

    slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.id == payload.slot_id,
        AvailabilitySlot.counselor_id == counselor.id,
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found for this counselor")

    if slot.status != "AVAILABLE":
        raise HTTPException(status_code=409, detail="This slot is not available")

    if slot.start_time <= datetime.utcnow():
        raise HTTPException(status_code=409, detail="Slot must be in the future")

    item = Booking(
        user_id=current_user.id,
        counselor_id=counselor.id,
        slot_id=slot.id,
        scheduled_for=slot.start_time,
        reason=payload.reason,
        status="PENDING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    slot.status = "BOOKED"
    slot.updated_at = datetime.utcnow()

    db.add(item)
    db.commit()
    db.refresh(item)

    # Notify counselor of new request
    create_notification(
        db,
        counselor.user_id,
        "New Booking Request",
        "You have a new booking request pending approval."
    )

    return item


@router.get("/me", response_model=list[BookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=10, le=50),
):
    expire_stale_bookings(db)
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
def update_booking_status_admin(
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
        raise HTTPException(status_code=409, detail=f"Invalid status. Allowed: {sorted(list(ALLOWED_STATUSES))}")

    if new_status in ("APPROVED", "COMPLETED") and item.scheduled_for <= datetime.utcnow():
        raise HTTPException(status_code=409, detail="Cannot set APPROVED/COMPLETED for past bookings")

    item.status = new_status
    item.updated_at = datetime.utcnow()

    # Free slot if admin cancels/declines
    if new_status in ("CANCELLED", "DECLINED"):
        slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == item.slot_id).first()
        if slot:
            slot.status = "AVAILABLE"
            slot.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    create_notification(
        db,
        item.user_id,
        "Booking Status Updated",
        f"Your booking status is now: {new_status}"
    )

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

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    if item.status not in ("PENDING", "APPROVED"):
        raise HTTPException(status_code=409, detail="Only PENDING or APPROVED bookings can be cancelled")

    item.status = "CANCELLED"
    item.updated_at = datetime.utcnow()

    slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == item.slot_id).first()
    if slot:
        slot.status = "AVAILABLE"
        slot.updated_at = datetime.utcnow()

    db.commit()

    # notify counselor
    counselor = db.query(Counselor).filter(Counselor.id == item.counselor_id).first()
    if counselor:
        create_notification(
            db,
            counselor.user_id,
            "Booking Cancelled",
            "A user cancelled a booking that was scheduled with you."
        )

    return None


# =========================
# Counselor booking views
# =========================

@router.get("/counselor/me", response_model=list[BookingOut])
def counselor_my_bookings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    status: str | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=200),
):
    counselor = _get_counselor_profile_for_user(db, current_user.id)
    expire_stale_bookings(db)

    q = db.query(Booking).filter(Booking.counselor_id == counselor.id)
    if status:
        q = q.filter(Booking.status == status.upper())

    return q.order_by(Booking.scheduled_for.asc()).offset(skip).limit(limit).all()


@router.get("/counselor/me/stats")
def counselor_my_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_counselor_profile_for_user(db, current_user.id)

    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = today_start + timedelta(days=1)

    total = db.query(Booking).filter(Booking.counselor_id == counselor.id).count()
    pending = db.query(Booking).filter(Booking.counselor_id == counselor.id, Booking.status == "PENDING").count()
    today = db.query(Booking).filter(
        Booking.counselor_id == counselor.id,
        Booking.scheduled_for >= today_start,
        Booking.scheduled_for < today_end,
        Booking.status.in_(["PENDING", "APPROVED"])
    ).count()
    upcoming = db.query(Booking).filter(
        Booking.counselor_id == counselor.id,
        Booking.scheduled_for >= now,
        Booking.status == "APPROVED"
    ).count()

    return {
        "total_bookings": total,
        "pending_requests": pending,
        "today_sessions": today,
        "upcoming_approved": upcoming,
    }


@router.patch("/{booking_id}/counselor-status", response_model=BookingOut)
def counselor_update_booking_status(
    booking_id: int,
    payload: BookingUpdateStatus,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_counselor_profile_for_user(db, current_user.id)

    item = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.counselor_id == counselor.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = payload.status.upper()
    if new_status not in COUNSELOR_ALLOWED:
        raise HTTPException(status_code=409, detail=f"Invalid status. Allowed: {sorted(list(COUNSELOR_ALLOWED))}")

    if item.status in ("CANCELLED", "DECLINED", "COMPLETED"):
        raise HTTPException(status_code=409, detail=f"Cannot change status from {item.status}")

    if new_status == "APPROVED" and item.scheduled_for <= datetime.utcnow():
        raise HTTPException(status_code=409, detail="Cannot approve a past booking")

    if new_status == "COMPLETED":
        if item.status != "APPROVED":
            raise HTTPException(status_code=409, detail="Only APPROVED bookings can be COMPLETED")
        if item.scheduled_for > datetime.utcnow():
            raise HTTPException(status_code=409, detail="Cannot complete a booking that is in the future")

    if new_status in ("CANCELLED", "DECLINED"):
        slot = db.query(AvailabilitySlot).filter(AvailabilitySlot.id == item.slot_id).first()
        if slot:
            slot.status = "AVAILABLE"
            slot.updated_at = datetime.utcnow()

    item.status = new_status
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    # notify user
    if new_status == "APPROVED":
        create_notification(db, item.user_id, "Booking Approved", "Your booking was approved. You can now view contact details.")
    elif new_status == "DECLINED":
        create_notification(db, item.user_id, "Booking Declined", "Your booking request was declined. You can choose another slot.")
    elif new_status == "CANCELLED":
        create_notification(db, item.user_id, "Booking Cancelled", "Your booking was cancelled by the counselor.")
    elif new_status == "COMPLETED":
        create_notification(db, item.user_id, "Session Completed", "Your session was marked as completed.")

    return item


# =========================
# Contact details after approval
# =========================

@router.get("/{booking_id}/contact")
def booking_contact_details(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_owner, is_booked_counselor, is_admin = _booking_access_check(db, booking, current_user)
    if not (is_owner or is_booked_counselor or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed")

    if booking.status != "APPROVED":
        raise HTTPException(status_code=409, detail="Contact details are available only after APPROVED booking")

    counselor = db.query(Counselor).filter(Counselor.id == booking.counselor_id).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")

    phone = counselor.phone_number if counselor.show_phone_after_booking else None
    office = counselor.office_address if counselor.show_office_after_booking else None

    return {
        "booking_id": booking.id,
        "counselor_id": counselor.id,
        "counselor_name": counselor.full_name,
        "phone_number": phone,
        "office_address": office,
        "general_location": counselor.general_location,
    }