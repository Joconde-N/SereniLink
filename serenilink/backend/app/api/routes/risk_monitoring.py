from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.screening import Screening
from app.models.mood import MoodEntry
from app.models.booking import Booking
from app.models.counselor import Counselor

router = APIRouter(prefix="/risk-monitoring", tags=["Risk Monitoring"])

NEGATIVE_MOODS = {"SAD", "ANXIOUS", "STRESSED", "ANGRY", "TIRED"}

WELLNESS_RESOURCES = {
    "Low": [
        "Practice daily mindfulness — even 5 minutes of deep breathing helps.",
        "Explore our wellness exercises to build healthy habits.",
        "Read our mental health articles for tips on maintaining wellbeing.",
    ],
    "Moderate": [
        "Consider scheduling a counselor consultation to talk through your feelings.",
        "Try our guided relaxation exercises available in the Exercises section.",
        "Journaling your thoughts daily can help process emotions.",
        "Reach out to a trusted friend or family member for support.",
    ],
    "High": [
        "We strongly encourage you to book a session with a counselor.",
        "If you are in crisis, please contact emergency services immediately.",
        "Rwanda Emergency: 112 (National) | 114 (Medical/Ambulance)",
        "You are not alone — professional support is available and effective.",
    ],
}


def _calculate_support_level(phq9_score, gad7_score, negative_mood_ratio):
    """
    Combines PHQ-9, GAD-7, and recent mood data into a support level.
    This is NOT a clinical diagnosis — it is a wellness support indicator.
    """
    score = 0

    # PHQ-9 contribution
    if phq9_score is not None:
        if phq9_score >= 15:
            score += 3
        elif phq9_score >= 10:
            score += 2
        elif phq9_score >= 5:
            score += 1

    # GAD-7 contribution
    if gad7_score is not None:
        if gad7_score >= 15:
            score += 3
        elif gad7_score >= 10:
            score += 2
        elif gad7_score >= 5:
            score += 1

    # Mood contribution
    if negative_mood_ratio >= 0.7:
        score += 2
    elif negative_mood_ratio >= 0.4:
        score += 1

    if score >= 5:
        return "High"
    elif score >= 2:
        return "Moderate"
    return "Low"


def _build_risk_data(db: Session, user_id: int):
    # Latest PHQ-9
    phq9 = (
        db.query(Screening)
        .filter(Screening.user_id == user_id, Screening.type == "PHQ9")
        .order_by(Screening.created_at.desc())
        .first()
    )
    # Latest GAD-7
    gad7 = (
        db.query(Screening)
        .filter(Screening.user_id == user_id, Screening.type == "GAD7")
        .order_by(Screening.created_at.desc())
        .first()
    )

    # Mood entries last 14 days
    since = datetime.utcnow() - timedelta(days=14)
    moods = (
        db.query(MoodEntry.mood)
        .filter(MoodEntry.user_id == user_id, MoodEntry.created_at >= since)
        .all()
    )
    total_moods = len(moods)
    negative_count = sum(1 for (m,) in moods if m in NEGATIVE_MOODS)
    negative_ratio = (negative_count / total_moods) if total_moods > 0 else 0.0

    phq9_score = phq9.total_score if phq9 else None
    gad7_score = gad7.total_score if gad7 else None

    support_level = _calculate_support_level(phq9_score, gad7_score, negative_ratio)

    return {
        "support_level": support_level,
        "phq9": {
            "score": phq9_score,
            "severity": phq9.severity if phq9 else None,
            "date": phq9.created_at.isoformat() if phq9 else None,
        },
        "gad7": {
            "score": gad7_score,
            "severity": gad7.severity if gad7 else None,
            "date": gad7.created_at.isoformat() if gad7 else None,
        },
        "mood_summary": {
            "total_entries_14d": total_moods,
            "negative_ratio": round(negative_ratio, 2),
        },
        "recommendations": WELLNESS_RESOURCES[support_level],
        "disclaimer": "This support level is a wellness indicator only and does not constitute a medical diagnosis or clinical assessment.",
    }


@router.get("/me")
def my_risk_level(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return _build_risk_data(db, current_user.id)


@router.get("/user/{user_id}")
def user_risk_level_for_counselor(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Counselors can only view risk data for users who have an approved booking with them."""
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot access individual user health data.")

    counselor = db.query(Counselor).filter(
        Counselor.user_id == current_user.id,
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED",
    ).first()
    if not counselor:
        raise HTTPException(status_code=403, detail="Counselor access required.")

    # Verify this user has a booking with this counselor
    booking = db.query(Booking).filter(
        Booking.user_id == user_id,
        Booking.counselor_id == counselor.id,
        Booking.status.in_(["APPROVED", "COMPLETED"]),
    ).first()
    if not booking:
        raise HTTPException(status_code=403, detail="No approved booking found with this user.")

    return _build_risk_data(db, user_id)


@router.get("/admin/anonymous-stats")
def admin_anonymous_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Admin-only: anonymous aggregate distribution of support levels."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    from app.models.user import User
    users = db.query(User).filter(User.role == "user", User.is_active == True).all()

    distribution = {"Low": 0, "Moderate": 0, "High": 0}
    total_with_data = 0

    for u in users:
        phq9 = (
            db.query(Screening)
            .filter(Screening.user_id == u.id, Screening.type == "PHQ9")
            .order_by(Screening.created_at.desc())
            .first()
        )
        gad7 = (
            db.query(Screening)
            .filter(Screening.user_id == u.id, Screening.type == "GAD7")
            .order_by(Screening.created_at.desc())
            .first()
        )
        if not phq9 and not gad7:
            continue

        since = datetime.utcnow() - timedelta(days=14)
        moods = db.query(MoodEntry.mood).filter(
            MoodEntry.user_id == u.id, MoodEntry.created_at >= since
        ).all()
        total_moods = len(moods)
        negative_count = sum(1 for (m,) in moods if m in NEGATIVE_MOODS)
        negative_ratio = (negative_count / total_moods) if total_moods > 0 else 0.0

        level = _calculate_support_level(
            phq9.total_score if phq9 else None,
            gad7.total_score if gad7 else None,
            negative_ratio,
        )
        distribution[level] += 1
        total_with_data += 1

    # Screening completion stats
    total_users = len(users)
    phq9_completed = db.query(Screening).filter(Screening.type == "PHQ9").distinct(Screening.user_id).count()
    gad7_completed = db.query(Screening).filter(Screening.type == "GAD7").distinct(Screening.user_id).count()

    return {
        "support_level_distribution": distribution,
        "total_users_with_data": total_with_data,
        "screening_completion": {
            "total_users": total_users,
            "phq9_completed": phq9_completed,
            "gad7_completed": gad7_completed,
            "phq9_rate": round(phq9_completed / total_users * 100, 1) if total_users else 0,
            "gad7_rate": round(gad7_completed / total_users * 100, 1) if total_users else 0,
        },
    }
