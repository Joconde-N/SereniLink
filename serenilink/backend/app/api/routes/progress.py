from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.api.deps import get_db, get_current_user
from app.models.progress import Progress
from app.models.assessment import Assessment
from app.schemas.progress import ProgressCreate, ProgressOut

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/", response_model=ProgressOut, status_code=201)
def add_milestone(
    payload: ProgressCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = Progress(
        user_id=current_user.id,
        title=payload.title,
        note=payload.note
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/me", response_model=list[ProgressOut])
def list_my_milestones(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Progress)
        .filter(Progress.user_id == current_user.id)
        .order_by(Progress.created_at.desc())
        .all()
    )


@router.get("/me/analytics")
def my_progress_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now = datetime.utcnow()

    def avg_since(days: int):
        since = now - timedelta(days=days)
        row = db.query(
            func.avg(Assessment.mood),
            func.avg(Assessment.stress),
            func.avg(Assessment.sleep),
            func.count(Assessment.id),
        ).filter(
            Assessment.user_id == current_user.id,
            Assessment.created_at >= since
        ).first()

        def to_float(x):
            return float(x) if x is not None else None

        return {
            "avg_mood": to_float(row[0]),
            "avg_stress": to_float(row[1]),
            "avg_sleep": to_float(row[2]),
            "checkins": int(row[3]),
        }

    last_7 = avg_since(7)
    last_30 = avg_since(30)

    def trend_from_diff(diff: float | None):
        if diff is None:
            return None
        if diff >= 0.5:
            return "IMPROVING"
        if diff <= -0.5:
            return "DECLINING"
        return "STABLE"

    mood_diff = None
    stress_diff = None
    sleep_diff = None

    if last_7["avg_mood"] is not None and last_30["avg_mood"] is not None:
        mood_diff = last_7["avg_mood"] - last_30["avg_mood"]

    if last_7["avg_stress"] is not None and last_30["avg_stress"] is not None:
        stress_diff = last_7["avg_stress"] - last_30["avg_stress"]

    if last_7["avg_sleep"] is not None and last_30["avg_sleep"] is not None:
        sleep_diff = last_7["avg_sleep"] - last_30["avg_sleep"]

    # streak: count consecutive days (going back from today) with at least one check-in
    streak = 0
    check_day = now.date()
    while True:
        count = db.query(func.count(Assessment.id)).filter(
            Assessment.user_id == current_user.id,
            func.date(Assessment.created_at) == check_day,
        ).scalar()
        if not count:
            break
        streak += 1
        check_day -= timedelta(days=1)

    return {
        "last_7_days": last_7,
        "last_30_days": last_30,
        "streak": streak,
        "diff": {
            "mood": mood_diff,
            "stress": stress_diff,
            "sleep": sleep_diff,
        },
        "trend": {
            "mood": trend_from_diff(mood_diff),
            "stress": trend_from_diff(stress_diff * -1 if stress_diff is not None else None),
            "sleep": trend_from_diff(sleep_diff),
        }
    }


@router.get("/me/daily")
def my_daily_analytics(
    days: int = Query(default=7, ge=7, le=30),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(
            cast(Assessment.created_at, Date).label("day"),
            func.avg(Assessment.mood).label("avg_mood"),
            func.avg(Assessment.stress).label("avg_stress"),
            func.avg(Assessment.sleep).label("avg_sleep"),
        )
        .filter(Assessment.user_id == current_user.id, Assessment.created_at >= since)
        .group_by(cast(Assessment.created_at, Date))
        .order_by(cast(Assessment.created_at, Date))
        .all()
    )
    return [
        {
            "date": str(r.day),
            "avg_mood": float(r.avg_mood) if r.avg_mood is not None else None,
            "avg_stress": float(r.avg_stress) if r.avg_stress is not None else None,
            "avg_sleep": float(r.avg_sleep) if r.avg_sleep is not None else None,
        }
        for r in rows
    ]
