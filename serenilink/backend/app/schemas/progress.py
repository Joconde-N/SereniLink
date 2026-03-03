from datetime import datetime
from pydantic import BaseModel, Field


class ProgressCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    note: str | None = Field(default=None, max_length=500)


class ProgressOut(BaseModel):
    id: int
    user_id: int
    title: str
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True