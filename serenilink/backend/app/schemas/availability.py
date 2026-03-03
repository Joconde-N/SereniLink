from datetime import datetime
from pydantic import BaseModel, Field


class AvailabilityCreate(BaseModel):
    start_time: datetime
    end_time: datetime


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