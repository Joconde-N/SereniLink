from datetime import datetime
from pydantic import BaseModel, Field

class AssessmentCreate(BaseModel):
    mood: int = Field(ge=1, le=10, description="Mood score from 1 to 10")
    stress: int = Field(ge=1, le=10, description="Stress level from 1 to 10")
    sleep: int = Field(ge=1, le=10, description="Sleep quality from 1 to 10")

    notes: str | None = Field(default=None, max_length=500)

class AssessmentOut(BaseModel):
    id: int
    mood: int
    stress: int
    sleep: int
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True
