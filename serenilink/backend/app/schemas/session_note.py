from datetime import datetime
from pydantic import BaseModel


class SessionNoteUpsert(BaseModel):
    note_text: str
    is_shared_with_user: bool = False


class SessionNoteOut(BaseModel):
    id: int
    booking_id: int
    counselor_id: int
    note_text: str
    is_shared_with_user: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
