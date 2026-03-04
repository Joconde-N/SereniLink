from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, require_admin
from app.models.assessment import Assessment
from app.models.booking import Booking
from app.models.counselor import Counselor
from app.models.content import Content
from app.models.progress import Progress
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/me")
def my_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    content_limit: int = Query(default=5, le=20),
):
    now = datetime.utcnow()
    since_7 = now - timedelta(days=7)

    # ----- Assessments -----
    total_assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .count()
    )

    last_assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .first()
    )

    last7_row = db.query(
        func.avg(Assessment.mood),
        func.avg(Assessment.stress),
        func.avg(Assessment.sleep),
        func.count(Assessment.id),
    ).filter(
        Assessment.user_id == current_user.id,
        Assessment.created_at >= since_7
    ).first()

    def to_float(x):
        return float(x) if x is not None else None

    last7 = {
        "avg_mood": to_float(last7_row[0]),
        "avg_stress": to_float(last7_row[1]),
        "avg_sleep": to_float(last7_row[2]),
        "checkins": int(last7_row[3]),
    }

    # ----- Bookings -----
    my_total_bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .count()
    )

    my_pending = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id, Booking.status == "PENDING")
        .count()
    )

    my_approved = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id, Booking.status == "APPROVED")
        .count()
    )

    my_upcoming = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.status == "APPROVED",
            Booking.scheduled_for >= now
        )
        .order_by(Booking.scheduled_for.asc())
        .all()
    )

    next_booking = my_upcoming[0] if len(my_upcoming) > 0 else None

    # ----- Progress / milestones -----
    milestones_count = (
        db.query(Progress)
        .filter(Progress.user_id == current_user.id)
        .count()
    )

    # ----- Content recommendations -----
    recommended_content = (
        db.query(Content)
        .filter(Content.is_published == True)
        .order_by(Content.created_at.desc())
        .limit(content_limit)
        .all()
    )

    daily_tip = recommended_content[0] if len(recommended_content) > 0 else None

    return {
        "user": {
            "id": current_user.id,
            "nickname": getattr(current_user, "nickname", None),
            "role": getattr(current_user, "role", "user"),
        },
        "assessments": {
            "total": my_total_bookings if False else total_assessments,  # keeps it explicit
            "last_checkin": None if not last_assessment else {
                "mood": last_assessment.mood,
                "stress": last_assessment.stress,
                "sleep": last_assessment.sleep,
                "notes": last_assessment.notes,
                "created_at": last_assessment.created_at,
            },
            "last_7_days": last7,
        },
        "bookings": {
            "total": my_total_bookings,
            "pending": my_pending,
            "approved": my_approved,
            "upcoming_approved_count": len(my_upcoming),
            "next_booking": None if not next_booking else {
                "booking_id": next_booking.id,
                "counselor_id": next_booking.counselor_id,
                "scheduled_for": next_booking.scheduled_for,
                "status": next_booking.status,
            }
        },
        "progress": {
            "milestones_count": milestones_count
        },
        "daily_tip": None if not daily_tip else {
            "id": daily_tip.id,
            "title": daily_tip.title,
            "summary": daily_tip.summary,
            "category": daily_tip.category,
        },
        "recommended_content": [
            {
                "id": c.id,
                "title": c.title,
                "summary": c.summary,
                "category": c.category,
                "created_at": c.created_at,
            }
            for c in recommended_content
        ]
    }


@router.get("/admin/insights")
def admin_insights(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    # totals
    total_users = db.query(User).count()
    total_counselors = db.query(Counselor).count()
    total_content = db.query(Content).count()
    published_content = db.query(Content).filter(Content.is_published == True).count()
    total_assessments = db.query(Assessment).count()
    total_bookings = db.query(Booking).count()

    # bookings by status
    statuses = ["PENDING", "APPROVED", "DECLINED", "CANCELLED", "COMPLETED"]
    bookings_by_status = {}
    for s in statuses:
        bookings_by_status[s] = db.query(Booking).filter(Booking.status == s).count()

    # top counselors by bookings (simple ranking)
    rows = (
        db.query(Booking.counselor_id, func.count(Booking.id))
        .group_by(Booking.counselor_id)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )

    top_counselors = []
    for counselor_id, cnt in rows:
        c = db.query(Counselor).filter(Counselor.id == counselor_id).first()
        top_counselors.append({
            "counselor_id": counselor_id,
            "name": None if not c else c.full_name,
            "specialization": None if not c else c.specialization,
            "bookings": int(cnt),
        })

    return {
        "totals": {
            "users": total_users,
            "counselors": total_counselors,
            "content": total_content,
            "published_content": published_content,
            "assessments": total_assessments,
            "bookings": total_bookings,
        },
        "bookings_by_status": bookings_by_status,
        "top_counselors_by_bookings": top_counselors,
    }