from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), index=True, nullable= False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    
