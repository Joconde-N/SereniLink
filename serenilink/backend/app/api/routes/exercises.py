from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin, get_current_user
from app.models.exercise import Exercise
from app.models.exercise_log import ExerciseLog
from app.models.user import User
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseOut
from app.core.audit import log_action

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("/", response_model=list[ExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    type: str | None = None,
    skip: int = 0,
    limit: int = Query(default=100, le=200),
):
    q = db.query(Exercise).filter(Exercise.is_active == True)
    if type:
        q = q.filter(Exercise.type.ilike(type))
    return q.order_by(Exercise.created_at.asc()).offset(skip).limit(limit).all()


@router.get("/admin/all", response_model=list[ExerciseOut])
def list_all_exercises(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(Exercise).order_by(Exercise.created_at.asc()).all()


@router.get("/completed/today")
def get_completed_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    logs = db.query(ExerciseLog).filter(
        ExerciseLog.user_id == current_user.id,
        ExerciseLog.completed_on == today,
    ).all()
    return {"completed_ids": [log.exercise_id for log in logs]}


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
    log_action(db, "EXERCISE_CREATED", user=_admin, resource="exercise", resource_id=item.id, detail=f"Created exercise: {item.title}")
    return item
def update_exercise(exercise_id: int, payload: ExerciseUpdate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    item = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Exercise not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    log_action(db, "EXERCISE_UPDATED", user=_admin, resource="exercise", resource_id=item.id, detail=f"Updated exercise: {item.title}")
    return item
def toggle_exercise(exercise_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    item = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Exercise not found")
    item.is_active = not item.is_active
    db.commit()
    db.refresh(item)
    log_action(db, "EXERCISE_TOGGLED", user=_admin, resource="exercise", resource_id=item.id, detail=f"Set exercise '{item.title}' active={item.is_active}")
    return item
def complete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    existing = db.query(ExerciseLog).filter(
        ExerciseLog.user_id == current_user.id,
        ExerciseLog.exercise_id == exercise_id,
        ExerciseLog.completed_on == today,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"completed": False}
    log = ExerciseLog(user_id=current_user.id, exercise_id=exercise_id, completed_on=today)
    db.add(log)
    db.commit()
    return {"completed": True}
