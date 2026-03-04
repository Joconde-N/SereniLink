from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    conversation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ai_conversations.id"), index=True, nullable=False
    )

    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" or "assistant"
    content: Mapped[str] = mapped_column(String(4000), nullable=False)

    risk_level: Mapped[str] = mapped_column(String(20), default="LOW", index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)