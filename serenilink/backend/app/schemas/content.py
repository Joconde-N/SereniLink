from datetime import datetime
from pydantic import BaseModel, Field

class ContentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    summary: str | None = Field(default=None, max_length=400)
    body: str = Field(min_length=10)

    category: str = Field(min_length=2, max_length=60)
    tags: str | None = Field(default=None, max_length=200)

    is_published: bool = True

class ContentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    summary: str | None = Field(default=None, max_length=400)
    body: str | None = Field(default=None, min_length=10)

    category: str | None = Field(default=None, min_length=2, max_length=60)
    tags: str | None = Field(default=None, max_length=200)

    is_published: bool | None = None

class ContentOut(BaseModel):
    id: int
    title: str
    summary: str | None
    body: str
    category: str
    tags: str | None
    is_published: bool
    created_at: datetime
    updated_at: datetime

class Config:
    from_attributes = True
    
