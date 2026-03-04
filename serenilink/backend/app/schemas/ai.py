from datetime import datetime
from pydantic import BaseModel, Field


class AIChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: int | None = None


class AIChatOut(BaseModel):
    conversation_id: int
    reply: str
    risk_level: str


class AIConversationOut(BaseModel):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AIMessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True