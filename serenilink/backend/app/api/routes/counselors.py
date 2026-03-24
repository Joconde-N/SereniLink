from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.counselor import Counselor
from app.models.user import User
from app.schemas.counselor import CounselorPublicOut, CounselorAdminOut, CounselorProfileUpdate

router = APIRouter(prefix="/counselors", tags=["Counselors"])


@router.get("/me", response_model=CounselorAdminOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counselor = db.query(Counselor).filter(Counselor.user_id == current_user.id).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor profile not found")
    return counselor


@router.patch("/me", response_model=CounselorAdminOut)
def update_my_profile(
    payload: CounselorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counselor = db.query(Counselor).filter(Counselor.user_id == current_user.id).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(counselor, field, value)

    db.commit()
    db.refresh(counselor)
    return counselor


@router.get("/", response_model=list[CounselorPublicOut])
def list_counselors(
    db: Session = Depends(get_db),
    specialization: str | None = None,
    skip: int = 0,
    limit: int = Query(default=10, le=50),
):
    q = db.query(Counselor).filter(
        Counselor.is_active == True,
        Counselor.application_status == "APPROVED"
    )
    if specialization:
        q = q.filter(Counselor.specialization.ilike(f"%{specialization}%"))
    return q.offset(skip).limit(limit).all()
