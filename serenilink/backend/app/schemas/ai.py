from pydantic import BaseModel, Field

class AIChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class AIChatOut(BaseModel):
    reply: str
    risk_level: str