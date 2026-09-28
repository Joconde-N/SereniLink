from datetime import datetime
from pydantic import BaseModel, AwareDatetime, field_validator
from datetime import timezone


class AvailabilityCreate(BaseModel):
    start_time: AwareDatetime
    end_time: AwareDatetime

    @field_validator("start_time", "end_time")
    @classmethod
    def normalize_utc(cls, value):
        return value.astimezone(timezone.utc)


class AvailabilityOut(BaseModel):
    id: int
    counselor_id: int
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
