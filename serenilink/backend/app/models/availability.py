from datetime import datetime
from sqlalchemy import Integer, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    counselor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("counselors.id"), index=True, nullable=False
    )

    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # AVAILABLE / BOOKED
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE", index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)