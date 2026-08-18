from datetime import datetime
from pydantic import BaseModel, Field

class ChatCreate(BaseModel):
    booking_id: int
    message: str = Field(min_length=1, max_length=1000)

class ChatOut(BaseModel):
    id: int
    booking_id: int
    sender_id: int
    message: str
    created_at: datetime

    class Config:
        from_attributes = True