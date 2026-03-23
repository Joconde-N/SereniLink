import secrets
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.core.email import send_counselor_credentials
from app.core.security import hash_password
from app.models.counselor_application import CounselorApplication
from app.models.counselor import Counselor
from app.models.user import User
from app.schemas.counselor_application import CounselorApplicationCreate, CounselorApplicationOut

router = APIRouter(prefix="/counselor-applications", tags=["Counselor Applications"])


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _generate_nickname(full_name: str, db: Session) -> str:
    """Derive a unique nickname from full_name."""
    base = full_name.strip().lower().replace(" ", "_")[:30]
    nickname = base
    counter = 1
    while db.query(User).filter(User.nickname == nickname).first():
        nickname = f"{base}_{counter}"
        counter += 1
    return nickname


@router.post("/", response_model=CounselorApplicationOut, status_code=201)
def submit_application(
    payload: CounselorApplicationCreate,
    db: Session = Depends(get_db),
):
    # Prevent duplicate applications from same email
    existing = db.query(CounselorApplication).filter(
        CounselorApplication.email == payload.email,
        CounselorApplication.status == "PENDING",
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="An application with this email is already pending.")

    item = CounselorApplication(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[CounselorApplicationOut])
def list_applications(
    status: str | None = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = db.query(CounselorApplication)
    if status:
        q = q.filter(CounselorApplication.status == status.upper())
    return q.order_by(CounselorApplication.created_at.desc()).all()


@router.get("/{application_id}", response_model=CounselorApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(CounselorApplication).filter(CounselorApplication.id == application_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
    return item


@router.patch("/{application_id}/approve", response_model=CounselorApplicationOut)
def approve_application(
    application_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(CounselorApplication).filter(CounselorApplication.id == application_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
    if item.status != "PENDING":
        raise HTTPException(status_code=409, detail=f"Application is already {item.status}")

    # Check if a user account already exists for this email
    existing_user = db.query(User).filter(User.email == item.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="A user account with this email already exists.")

    # Generate credentials
    temp_password = _generate_temp_password()
    nickname = _generate_nickname(item.full_name, db)

    # Create user account
    user = User(
        nickname=nickname,
        email=item.email,
        password_hash=hash_password(temp_password),
        role="counselor",
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.flush()  # get user.id without committing

    # Create counselor profile from application data
    counselor = Counselor(
        user_id=user.id,
        full_name=item.full_name,
        title=item.title,
        bio=item.bio,
        specialization=item.specialization,
        phone_number=item.phone_number,
        general_location=item.general_location,
        office_address=item.office_address,
        offers_online=item.offers_online,
        offers_in_person=item.offers_in_person,
        show_phone_after_booking=True,
        show_office_after_booking=True,
        application_status="APPROVED",
        is_active=True,
    )
    db.add(counselor)

    # Mark application as approved
    item.status = "APPROVED"
    item.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    # Send credentials email (non-blocking — logs warning if SMTP not configured)
    send_counselor_credentials(
        to_email=item.email,
        full_name=item.full_name,
        nickname=nickname,
        temp_password=temp_password,
    )

    return item


@router.patch("/{application_id}/reject", response_model=CounselorApplicationOut)
def reject_application(
    application_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(CounselorApplication).filter(CounselorApplication.id == application_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
    if item.status != "PENDING":
        raise HTTPException(status_code=409, detail=f"Application is already {item.status}")

    item.status = "REJECTED"
    item.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item
