from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.screening import Screening
from app.models.booking import Booking
from app.models.counselor import Counselor
from app.models.user import User
from app.schemas.screening import ScreeningCreate, ScreeningOut
from app.core.audit import log_action

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
    log_action(db, "ASSESSMENT_COMPLETED", user=current_user, resource="screening", resource_id=item.id, detail=f"{payload.type} completed, score={total}, severity={severity}")
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


def _get_approved_counselor(db: Session, user_id: int) -> Counselor:
    counselor = db.query(Counselor).filter(
        Counselor.user_id == user_id,
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED",
    ).first()
    if not counselor:
        raise HTTPException(status_code=403, detail="Counselor access required.")
    return counselor


def _get_assigned_user_ids(db: Session, counselor_id: int) -> set[int]:
    rows = (
        db.query(Booking.user_id)
        .filter(
            Booking.counselor_id == counselor_id,
            Booking.status.in_(["APPROVED", "COMPLETED"]),
        )
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


@router.get("/counselor/clients")
def counselor_client_screenings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    counselor = _get_approved_counselor(db, current_user.id)
    user_ids = _get_assigned_user_ids(db, counselor.id)
    if not user_ids:
        return []

    users = db.query(User).filter(User.id.in_(user_ids)).all()
    nickname_map = {u.id: u.nickname for u in users}

    latest_bookings = {}
    for uid in user_ids:
        booking = (
            db.query(Booking)
            .filter(
                Booking.counselor_id == counselor.id,
                Booking.user_id == uid,
                Booking.status.in_(["APPROVED", "COMPLETED"]),
            )
            .order_by(Booking.scheduled_for.desc())
            .first()
        )
        if booking:
            latest_bookings[uid] = booking.id

    result = []
    for uid in sorted(user_ids):
        screenings = (
            db.query(Screening)
            .filter(Screening.user_id == uid)
            .order_by(Screening.created_at.desc())
            .all()
        )
        result.append({
            "user_id": uid,
            "user_nickname": nickname_map.get(uid, f"User #{uid}"),
            "latest_booking_id": latest_bookings.get(uid),
            "screenings": [ScreeningOut.model_validate(s).model_dump() for s in screenings],
        })

    return sorted(result, key=lambda x: x["user_nickname"].lower())
