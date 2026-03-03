from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.counselor import Counselor
from app.schemas.counselor import CounselorPublicOut

router = APIRouter(prefix="/counselors", tags=["Counselors"])


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