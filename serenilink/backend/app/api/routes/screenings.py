from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.screening import Screening
from app.schemas.screening import ScreeningCreate, ScreeningOut

router = APIRouter(prefix="/screenings", tags=["Screenings"])

QUESTIONS = {"PHQ9": 9, "GAD7": 7}


def calculate_severity(type: str, score: int) -> str:
    if type == "PHQ9":
        if score <= 4:  return "Minimal"
        if score <= 9:  return "Mild"
        if score <= 14: return "Moderate"
        if score <= 19: return "Moderately Severe"
        return "Severe"
    else:
        if score <= 4:  return "Minimal"
        if score <= 9:  return "Mild"
        if score <= 14: return "Moderate"
        return "Severe"


@router.post("/", response_model=ScreeningOut, status_code=201)
def submit_screening(
    payload: ScreeningCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    expected = QUESTIONS.get(payload.type)
    if not expected:
        raise HTTPException(status_code=400, detail="type must be PHQ9 or GAD7")
    if len(payload.answers) != expected:
        raise HTTPException(status_code=400, detail=f"{payload.type} requires exactly {expected} answers")
    if any(a not in (0, 1, 2, 3) for a in payload.answers):
        raise HTTPException(status_code=400, detail="Each answer must be 0, 1, 2, or 3")

    total = sum(payload.answers)
    severity = calculate_severity(payload.type, total)

    item = Screening(
        user_id=current_user.id,
        type=payload.type,
        answers=payload.answers,
        total_score=total,
        severity=severity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/me", response_model=list[ScreeningOut])
def my_screenings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Screening)
        .filter(Screening.user_id == current_user.id)
        .order_by(Screening.created_at.desc())
        .all()
    )


@router.get("/me/latest")
def my_latest_screenings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = {}
    for t in ("PHQ9", "GAD7"):
        item = (
            db.query(Screening)
            .filter(Screening.user_id == current_user.id, Screening.type == t)
            .order_by(Screening.created_at.desc())
            .first()
        )
        result[t] = {
            "score": item.total_score,
            "severity": item.severity,
            "date": item.created_at,
        } if item else None
    return result
