from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExerciseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    type: str = Field(min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=300)
    instructions: str = Field(min_length=10)
    duration_sec: Optional[int] = None
    is_active: bool = True


class ExerciseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=150)
    type: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=300)
    instructions: Optional[str] = Field(default=None, min_length=10)
    duration_sec: Optional[int] = None
    is_active: Optional[bool] = None


class ExerciseOut(BaseModel):
    id: int
    title: str
    type: str
    description: Optional[str]
    instructions: str
    duration_sec: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
