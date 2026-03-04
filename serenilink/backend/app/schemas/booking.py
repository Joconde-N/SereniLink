from datetime import datetime
from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    counselor_id: int
    slot_id: int
    reason: str | None = Field(default=None, max_length=500)


class BookingUpdateStatus(BaseModel):
    status: str = Field(min_length=3, max_length=20)


class BookingUpdatePayment(BaseModel):
    payment_status: str = Field(min_length=3, max_length=20)  # PENDING/PAID/WAIVED


class BookingOut(BaseModel):
    id: int
    user_id: int
    counselor_id: int
    slot_id: int
    scheduled_for: datetime
    reason: str | None
    status: str
    payment_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True