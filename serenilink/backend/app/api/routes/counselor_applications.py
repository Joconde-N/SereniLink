import secrets
import string
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.counselor_application import CounselorApplication
from app.models.counselor import Counselor
from app.models.user import User
from app.schemas.counselor_application import CounselorApplicationOut
from app.core.audit import log_action

router = APIRouter(prefix="/counselor-applications", tags=["Counselor Applications"])

UPLOAD_DIR = Path("uploads/applications")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_CERT_TYPES  = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE       = 5 * 1024 * 1024  # 5 MB


def _save_file(file: UploadFile, subfolder: str) -> str:
    dest = UPLOAD_DIR / subfolder
    dest.mkdir(parents=True, exist_ok=True)
    ext      = Path(file.filename).suffix
    filename = f"{secrets.token_hex(12)}{ext}"
    path     = dest / filename
    content  = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is 5MB.")
    with path.open("wb") as f:
        f.write(content)
    file.file.seek(0)
    return f"/uploads/applications/{subfolder}/{filename}"


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _generate_nickname(full_name: str, db: Session) -> str:
    base     = full_name.strip().lower().replace(" ", "_")[:30]
    nickname = base
    counter  = 1
    while db.query(User).filter(User.nickname == nickname).first():
        nickname = f"{base}_{counter}"
        counter += 1
    return nickname


@router.post("/", response_model=CounselorApplicationOut, status_code=201)
async def submit_application(
    full_name:              str           = Form(...),
    email:                  str           = Form(...),
    phone_number:           Optional[str] = Form(None),
    title:                  Optional[str] = Form(None),
    specialization:         str           = Form(...),
    bio:                    Optional[str] = Form(None),
    years_of_experience:    Optional[int] = Form(None),
    counseling_approach:    Optional[str] = Form(None),
    highest_certification:  Optional[str] = Form(None),
    issuing_institution:    Optional[str] = Form(None),
    general_location:       Optional[str] = Form(None),
    office_address:         Optional[str] = Form(None),
    offers_online:          bool          = Form(True),
    offers_in_person:       bool          = Form(False),
    languages_offered:      Optional[str] = Form(None),
    preferred_session_type: Optional[str] = Form(None),
    preferred_duration:     Optional[str] = Form(None),
    hourly_rate:            Optional[float] = Form(None),
    profile_image:          Optional[UploadFile] = File(None),
    certifications:         Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    existing = db.query(CounselorApplication).filter(
        CounselorApplication.email == email,
        CounselorApplication.status == "PENDING",
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="An application with this email is already pending.")

    # Profile image
    profile_image_url = None
    if profile_image and profile_image.filename:
        if profile_image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Profile image must be JPG, PNG, or WebP.")
        profile_image_url = _save_file(profile_image, "profiles")

    # Certifications (max 3)
    cert_urls: List[str] = []
    if certifications:
        valid_certs = [c for c in certifications if c and c.filename]
        if len(valid_certs) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 certification files allowed.")
        for cert in valid_certs:
            if cert.content_type not in ALLOWED_CERT_TYPES:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {cert.content_type}. Use PDF, JPG, or PNG.")
            cert_urls.append(_save_file(cert, "certifications"))

    item = CounselorApplication(
        full_name=full_name,
        email=email,
        phone_number=phone_number or None,
        title=title or None,
        specialization=specialization,
        bio=bio or None,
        years_of_experience=years_of_experience,
        counseling_approach=counseling_approach or None,
        highest_certification=highest_certification or None,
        issuing_institution=issuing_institution or None,
        general_location=general_location or None,
        office_address=office_address or None,
        offers_online=offers_online,
        offers_in_person=offers_in_person,
        languages_offered=languages_offered or None,
        preferred_session_type=preferred_session_type or None,
        preferred_duration=preferred_duration or None,
        hourly_rate=hourly_rate,
        profile_image_url=profile_image_url,
        certification_urls=cert_urls if cert_urls else None,
    )
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
    request: Request,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(CounselorApplication).filter(CounselorApplication.id == application_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
    if item.status != "PENDING":
        raise HTTPException(status_code=409, detail=f"Application is already {item.status}")

    from app.core.security import hash_password
    from app.core.email import send_counselor_credentials

    existing_user = db.query(User).filter(User.email == item.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="A user account with this email already exists.")

    temp_password = _generate_temp_password()
    nickname      = _generate_nickname(item.full_name, db)

    user = User(
        nickname=nickname,
        email=item.email,
        password_hash=hash_password(temp_password),
        role="counselor",
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.flush()

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
        years_of_experience=item.years_of_experience,
        counseling_approach=item.counseling_approach,
        highest_certification=item.highest_certification,
        issuing_institution=item.issuing_institution,
        languages_offered=item.languages_offered,
        preferred_session_type=item.preferred_session_type,
        preferred_duration=item.preferred_duration,
        hourly_rate=item.hourly_rate,
        profile_image_url=item.profile_image_url,
        application_status="APPROVED",
        is_active=True,
    )
    db.add(counselor)

    item.status      = "APPROVED"
    item.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    log_action(db, "COUNSELOR_APPROVED", user=_admin, resource="counselor_application", resource_id=application_id, detail=f"Approved application for {item.full_name}", ip_address=request.client.host if request.client else None)

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
    request: Request,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(CounselorApplication).filter(CounselorApplication.id == application_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
    if item.status != "PENDING":
        raise HTTPException(status_code=409, detail=f"Application is already {item.status}")

    item.status      = "REJECTED"
    item.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    log_action(db, "COUNSELOR_REJECTED", user=_admin, resource="counselor_application", resource_id=application_id, detail=f"Rejected application for {item.full_name}", ip_address=request.client.host if request.client else None)
    return item
