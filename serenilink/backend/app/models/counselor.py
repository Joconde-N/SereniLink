from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Counselor(Base):
    __tablename__ = "counselors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"),
        unique=True, nullable=False, index=True
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    specialization: Mapped[str] = mapped_column(String(150), nullable=False)

    profile_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    general_location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    office_address: Mapped[str | None] = mapped_column(String(250), nullable=True)

    offers_online: Mapped[bool] = mapped_column(Boolean, default=True)
    offers_in_person: Mapped[bool] = mapped_column(Boolean, default=False)
    show_phone_after_booking: Mapped[bool] = mapped_column(Boolean, default=True)
    show_office_after_booking: Mapped[bool] = mapped_column(Boolean, default=True)

    # Extra fields from application
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    counseling_approach: Mapped[str | None] = mapped_column(Text, nullable=True)
    highest_certification: Mapped[str | None] = mapped_column(String(200), nullable=True)
    issuing_institution: Mapped[str | None] = mapped_column(String(200), nullable=True)
    languages_offered: Mapped[str | None] = mapped_column(String(200), nullable=True)
    preferred_session_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_duration: Mapped[str | None] = mapped_column(String(20), nullable=True)

    application_status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)