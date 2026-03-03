from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

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

    return {
        "last_7_days": last_7,
        "last_30_days": last_30,
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
