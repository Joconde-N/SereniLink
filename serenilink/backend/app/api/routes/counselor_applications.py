from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_admin
from app.models.counselor import Counselor
from app.models.user import User
from app.schemas.counselor import CounselorApplicationSubmit, CounselorAdminOut

router = APIRouter(prefix="/counselor-applications", tags=["Counselor Applications"])


@router.post("/submit", response_model=CounselorAdminOut, status_code=201)
def submit_application(
    payload: CounselorApplicationSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # prevent duplicates: 1 user -> 1 counselor profile/application
    existing = db.query(Counselor).filter(Counselor.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already submitted an application")

    item = Counselor(
        user_id=current_user.id,
        application_status="PENDING",
        is_active=False,
        **payload.model_dump()
    )

    # mark the user as pending counselor
    current_user.role = "pending_counselor"

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/me", response_model=CounselorAdminOut)
def my_application(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = db.query(Counselor).filter(Counselor.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No application found")
    return item


@router.get("/pending", response_model=list[CounselorAdminOut])
def list_pending(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return db.query(Counselor).filter(Counselor.application_status == "PENDING").all()


@router.patch("/{counselor_id}/approve", response_model=CounselorAdminOut)
def approve_application(
    counselor_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")

    user = db.query(User).filter(User.id == item.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Linked user not found")

    item.application_status = "APPROVED"
    item.is_active = True
    user.role = "counselor"

    db.commit()
    db.refresh(item)
    return item


@router.patch("/{counselor_id}/reject", response_model=CounselorAdminOut)
def reject_application(
    counselor_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")

    user = db.query(User).filter(User.id == item.user_id).first()
    if user and user.role == "pending_counselor":
        user.role = "user"

    item.application_status = "REJECTED"
    item.is_active = False

    db.commit()
    db.refresh(item)
    return item