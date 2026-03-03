from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    mood: Mapped[int] = mapped_column(Integer, nullable=False)
    stress: Mapped[int] = mapped_column(Integer, nullable=False)
    sleep: Mapped[int] = mapped_column(Integer, nullable=False)

    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
