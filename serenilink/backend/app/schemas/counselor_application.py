from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class CounselorApplicationCreate(BaseModel):
    full_name: str = Field(min_length=3, max_length=200)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=30)

    title: str | None = Field(default=None, max_length=150)
    specialization: str = Field(min_length=2, max_length=150)
    bio: str | None = Field(default=None, max_length=500)
    years_of_experience: int | None = None
    counseling_approach: str | None = None

    highest_certification: str | None = Field(default=None, max_length=200)
    issuing_institution: str | None = Field(default=None, max_length=200)

    general_location: str | None = Field(default=None, max_length=120)
    office_address: str | None = Field(default=None, max_length=250)

    offers_online: bool = True
    offers_in_person: bool = False
    languages_offered: str | None = Field(default=None, max_length=200)
    preferred_session_type: str | None = Field(default=None, max_length=50)
    preferred_duration: str | None = Field(default=None, max_length=20)


class CounselorApplicationOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str | None
    title: str | None
    specialization: str
    bio: str | None
    years_of_experience: int | None
    counseling_approach: str | None
    highest_certification: str | None
    issuing_institution: str | None
    general_location: str | None
    office_address: str | None
    offers_online: bool
    offers_in_person: bool
    languages_offered: str | None
    preferred_session_type: str | None
    preferred_duration: str | None
    profile_image_url: str | None
    certification_urls: Optional[List[str]]
    status: str
    created_at: datetime
    reviewed_at: datetime | None

    class Config:
        from_attributes = True
