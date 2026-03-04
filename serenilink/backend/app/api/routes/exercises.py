from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseOut

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("/", response_model=list[ExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    type: str | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
):
    q = db.query(Exercise).filter(Exercise.is_active == True)
    if type:
        q = q.filter(Exercise.type.ilike(type))
    return q.order_by(Exercise.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    item = db.query(Exercise).filter(Exercise.id == exercise_id, Exercise.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return item


@router.post("/", response_model=ExerciseOut, status_code=201)
def create_exercise(payload: ExerciseCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    item = Exercise(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item