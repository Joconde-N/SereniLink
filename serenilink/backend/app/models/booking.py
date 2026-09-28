from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.datetime import UTCDateTime, utc_now


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("uq_bookings_active_slot", "slot_id", unique=True,
              postgresql_where=text("status IN ('PENDING', 'APPROVED')"),
              sqlite_where=text("status IN ('PENDING', 'APPROVED')")),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    counselor_id: Mapped[int] = mapped_column(Integer, ForeignKey("counselors.id"), index=True, nullable=False)

    slot_id: Mapped[int] = mapped_column(Integer, ForeignKey("availability_slots.id"), index=True, nullable=False)

    scheduled_for: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(300), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)

    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
