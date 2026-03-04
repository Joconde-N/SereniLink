from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    counselor_id: Mapped[int] = mapped_column(Integer, ForeignKey("counselors.id"), index=True, nullable=False)

    slot_id: Mapped[int] = mapped_column(Integer, ForeignKey("availability_slots.id"), index=True, nullable=False)

    scheduled_for: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # requested session time
    reason: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # workflow status
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    
    payment_status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)