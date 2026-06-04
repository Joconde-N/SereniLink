from datetime import datetime
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class SessionNote(Base):
    __tablename__ = "session_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), unique=True, index=True, nullable=False)
    counselor_id: Mapped[int] = mapped_column(Integer, ForeignKey("counselors.id"), index=True, nullable=False)
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_shared_with_user: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
