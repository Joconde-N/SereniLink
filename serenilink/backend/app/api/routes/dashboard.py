from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, require_admin
from app.models.assessment import Assessment
from app.models.booking import Booking
from app.models.content import Content
from app.models.progress import Progress
from app.models.mood import MoodEntry
from app.models.user import User
from app.models.counselor import Counselor

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/me")
def my_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    content_limit: int = Query(default=5, le=20),
):
    now = datetime.utcnow()
    since_7 = now - timedelta(days=7)

    # Mood stats (last 7 days)
    moods = (
        db.query(MoodEntry.mood)
        .filter(MoodEntry.user_id == current_user.id, MoodEntry.created_at >= since_7)
        .all()
    )
    mood_counts = {}
    for (m,) in moods:
        mood_counts[m] = mood_counts.get(m, 0) + 1

    # Assessments last 7 days avg
    row = db.query(
        func.avg(Assessment.mood),
        func.avg(Assessment.stress),
        func.avg(Assessment.sleep),
        func.count(Assessment.id),
    ).filter(
        Assessment.user_id == current_user.id,
        Assessment.created_at >= since_7
    ).first()

    def to_float(x): return float(x) if x is not None else None

    # Booking summary
    total_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).count()
    pending = db.query(Booking).filter(Booking.user_id == current_user.id, Booking.status == "PENDING").count()
    approved = db.query(Booking).filter(Booking.user_id == current_user.id, Booking.status == "APPROVED").count()

    next_booking = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id, Booking.status == "APPROVED", Booking.scheduled_for >= now)
        .order_by(Booking.scheduled_for.asc())
        .first()
    )

    milestones = db.query(Progress).filter(Progress.user_id == current_user.id).count()

    recommended = (
        db.query(Content)
        .filter(Content.is_published == True)
        .order_by(Content.created_at.desc())
        .limit(content_limit)
        .all()
    )

    return {
        "user": {
            "id": current_user.id,
            "nickname": getattr(current_user, "nickname", None),
        },
        "moods_last_7_days": {
            "total": sum(mood_counts.values()),
            "counts": mood_counts
        },
        "assessments_last_7_days": {
            "avg_mood": to_float(row[0]),
            "avg_stress": to_float(row[1]),
            "avg_sleep": to_float(row[2]),
            "checkins": int(row[3]),
        },
        "bookings": {
            "total": total_bookings,
            "pending": pending,
            "approved": approved,
            "next_booking": None if not next_booking else {
                "id": next_booking.id,
                "scheduled_for": next_booking.scheduled_for,
                "status": next_booking.status,
                "payment_status": next_booking.payment_status,
            }
        },
        "progress": {
            "milestones_count": milestones
        },
        "recommended_content": [
            {
                "id": c.id,
                "title": c.title,
                "summary": c.summary,
                "category": c.category,
                "created_at": c.created_at
            } for c in recommended
        ]
    }


@router.get("/admin/insights")
def admin_insights(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    totals = {
        "users": db.query(User).count(),
        "counselors": db.query(Counselor).count(),
        "content": db.query(Content).count(),
        "published_content": db.query(Content).filter(Content.is_published == True).count(),
        "assessments": db.query(Assessment).count(),
        "bookings": db.query(Booking).count(),
        "mood_entries": db.query(MoodEntry).count(),
    }

    statuses = ["PENDING", "APPROVED", "DECLINED", "CANCELLED", "COMPLETED"]
    bookings_by_status = {s: db.query(Booking).filter(Booking.status == s).count() for s in statuses}

    payments = ["PENDING", "PAID", "WAIVED"]
    bookings_by_payment = {p: db.query(Booking).filter(Booking.payment_status == p).count() for p in payments}

    return {
        "totals": totals,
        "bookings_by_status": bookings_by_status,
        "bookings_by_payment_status": bookings_by_payment,
    }