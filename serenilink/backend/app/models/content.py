from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class Content(Base):
    __tablename__ = "contents"

    id: Mapped[int] =mapped_column(Integer, primary_key=True, index=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(String(400), nullable=True)
    body: Mapped[str] =mapped_column(Text, nullable=False)

    category: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    tags: Mapped[str] = mapped_column(String(200), nullable=True)

    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)