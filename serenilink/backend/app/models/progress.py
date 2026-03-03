from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Progress(Base):
    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(120), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)