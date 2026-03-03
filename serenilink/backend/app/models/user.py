from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class User(Base):
    __tablename__="users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nickname: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(String(20), default="user")  # user | counselor(doc) | admin
