from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Counselor(Base):
    __tablename__ = "counselors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Link counselor profile to a login user account
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"),
        unique=True, nullable=False, index=True
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)

    specialization: Mapped[str] = mapped_column(String(150), nullable=False)

    # NEW: profile + contact + location
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # public-safe location (e.g., "Kigali - Kicukiro")
    general_location: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # full address (only after booking is approved, if counselor allows)
    office_address: Mapped[str | None] = mapped_column(String(250), nullable=True)

    offers_online: Mapped[bool] = mapped_column(Boolean, default=True)
    offers_in_person: Mapped[bool] = mapped_column(Boolean, default=False)

    # privacy toggles
    show_phone_after_booking: Mapped[bool] = mapped_column(Boolean, default=True)
    show_office_after_booking: Mapped[bool] = mapped_column(Boolean, default=True)

    # Application workflow
    application_status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)  # active only after approval

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)