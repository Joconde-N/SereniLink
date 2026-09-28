from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class MoodCheckinCreate(BaseModel):
    mood: Literal["HAPPY", "SAD", "ANXIOUS", "CALM", "STRESSED", "ANGRY", "TIRED", "OKAY"]
    mood_score: int = Field(ge=1, le=10)
    stress: int = Field(ge=1, le=10)
    sleep: int = Field(ge=1, le=10)
    notes: str | None = Field(default=None, max_length=500)


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
