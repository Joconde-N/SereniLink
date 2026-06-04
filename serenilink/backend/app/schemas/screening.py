from datetime import datetime
from pydantic import BaseModel, Field
from typing import List


class ScreeningCreate(BaseModel):
    type: str = Field(pattern="^(PHQ9|GAD7)$")
    answers: List[int]  # validated in route


class ScreeningOut(BaseModel):
    id: int
    user_id: int
    type: str
    answers: List[int]
    total_score: int
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True
