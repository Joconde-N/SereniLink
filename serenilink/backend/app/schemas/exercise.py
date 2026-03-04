from datetime import datetime
from pydantic import BaseModel, Field


class ExerciseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    type: str = Field(min_length=2, max_length=50)
    instructions: str = Field(min_length=10, max_length=3000)
    is_active: bool = True


class ExerciseOut(BaseModel):
    id: int
    title: str
    type: str
    instructions: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True