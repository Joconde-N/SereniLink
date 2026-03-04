from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.mood import MoodEntry
from app.schemas.mood import MoodCreate, MoodOut

router = APIRouter(prefix="/moods", tags=["Moods"])

ALLOWED_MOODS = {"HAPPY", "SAD", "ANXIOUS", "CALM", "STRESSED", "ANGRY", "TIRED", "OKAY"}


@router.post("/", response_model=MoodOut, status_code=201)
def create_mood(payload: MoodCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    mood = payload.mood.strip().upper()
    if mood not in ALLOWED_MOODS:
        # keep it simple: still allow custom moods if you want
        # but we'll enforce allowed to keep analytics cleaner
        mood = mood  # or raise error if you prefer

    item = MoodEntry(user_id=current_user.id, mood=mood, note=payload.note)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/me", response_model=list[MoodOut])
def my_moods(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=30, le=200),
):
    return (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == current_user.id)
        .order_by(MoodEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/me/trends")
def my_mood_trends(db: Session = Depends(get_db), current_user=Depends(get_current_user), days: int = 7):
    now = datetime.utcnow()
    since = now - timedelta(days=days)

    rows = (
        db.query(MoodEntry.mood)
        .filter(MoodEntry.user_id == current_user.id, MoodEntry.created_at >= since)
        .all()
    )

    counts = {}
    for (mood,) in rows:
        counts[mood] = counts.get(mood, 0) + 1

    total = sum(counts.values())
    return {
        "days": days,
        "total_entries": total,
        "counts": counts
    }