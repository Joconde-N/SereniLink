from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CounselorApplication(Base):
    __tablename__ = "counselor_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Contact / identity — used to create the account on approval
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Professional
    title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    specialization: Mapped[str] = mapped_column(String(150), nullable=False)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    counseling_approach: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Qualifications
    highest_certification: Mapped[str | None] = mapped_column(String(200), nullable=True)
    issuing_institution: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Location
    general_location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    office_address: Mapped[str | None] = mapped_column(String(250), nullable=True)

    # Session preferences
    offers_online: Mapped[bool] = mapped_column(Boolean, default=True)
    offers_in_person: Mapped[bool] = mapped_column(Boolean, default=False)
    languages_offered: Mapped[str | None] = mapped_column(String(200), nullable=True)
    preferred_session_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_duration: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Workflow
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
