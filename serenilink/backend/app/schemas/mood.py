from datetime import datetime
from pydantic import BaseModel, Field


class MoodCreate(BaseModel):
    mood: str = Field(min_length=2, max_length=30)
    note: str | None = Field(default=None, max_length=500)


class MoodOut(BaseModel):
    id: int
    user_id: int
    mood: str
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True