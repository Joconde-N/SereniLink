from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models.assessment import Assessment
from app.schemas.assessment import AssessmentCreate,AssessmentOut
from datetime import datetime, timedelta


router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.post("/", response_model=AssessmentOut, status_code=201)
def create_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    item = Assessment(
        user_id = current_user.id,
        mood = payload.mood,
        stress = payload.stress,
        sleep = payload.sleep,
        notes = payload.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/me", response_model=list[AssessmentOut])
def list_my_assessments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )

@router.get("/me/summary")
def my_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    avg = db.query(
        func.avg(Assessment.mood),
        func.avg(Assessment.stress),
        func.avg(Assessment.sleep),
        func.count(Assessment.id),
    ).filter(Assessment.user_id == current_user.id).first()

    since = datetime.utcnow() - timedelta(days=7)
    avg7 = db.query(
        func.avg(Assessment.mood),
        func.avg(Assessment.stress),
        func.avg(Assessment.sleep),
        func.count(Assessment.id),
    ).filter(Assessment.user_id == current_user.id,
             Assessment.created_at >= since
    ).first()

    def to_float(x):
        return float(x) if x is not None else None
    
    return {
        "overall": {
            "avg_mood": to_float(avg[0]),
            "avg_stress": to_float(avg[1]),
            "avg_sleep": to_float(avg[2]),
            "total_checkins": int(avg[3]),
        },
        "last_7_days": {
            "avg_mood": to_float(avg7[0]),
            "avg_stress": to_float(avg7[1]),
            "avg_sleep": to_float(avg7[2]),
            "checkins": int(avg7[3]),    
        }
    }