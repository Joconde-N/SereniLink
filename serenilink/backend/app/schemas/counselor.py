from datetime import datetime
from pydantic import BaseModel, Field


class CounselorApplicationSubmit(BaseModel):
    full_name: str = Field(min_length=3, max_length=200)
    title: str | None = Field(default=None, max_length=150)
    bio: str | None = Field(default=None, max_length=500)
    specialization: str = Field(min_length=2, max_length=150)
    profile_image_url: str | None = None
    phone_number: str | None = Field(default=None, max_length=30)
    general_location: str | None = Field(default=None, max_length=120)
    office_address: str | None = Field(default=None, max_length=250)
    offers_online: bool = True
    offers_in_person: bool = False
    show_phone_after_booking: bool = True
    show_office_after_booking: bool = True
    hourly_rate: float | None = Field(default=None, ge=0)


# Public info shown BEFORE booking (safe)
class CounselorPublicOut(BaseModel):
    id: int
    full_name: str
    title: str | None
    bio: str | None
    specialization: str
    profile_image_url: str | None
    general_location: str | None
    offers_online: bool
    offers_in_person: bool
    is_active: bool
    years_of_experience: int | None
    languages_offered: str | None
    counseling_approach: str | None
    highest_certification: str | None
    issuing_institution: str | None
    hourly_rate: float | None

    class Config:
        from_attributes = True


# Admin / internal view
class CounselorAdminOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    title: str | None
    bio: str | None
    specialization: str
    profile_image_url: str | None
    phone_number: str | None
    general_location: str | None
    office_address: str | None
    offers_online: bool
    offers_in_person: bool
    show_phone_after_booking: bool
    show_office_after_booking: bool
    years_of_experience: int | None
    counseling_approach: str | None
    highest_certification: str | None
    issuing_institution: str | None
    languages_offered: str | None
    preferred_session_type: str | None
    preferred_duration: str | None
    hourly_rate: float | None
    application_status: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Counselor self-update
class CounselorProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)
    title: str | None = Field(default=None, max_length=150)
    bio: str | None = Field(default=None, max_length=500)
    specialization: str | None = Field(default=None, max_length=150)
    profile_image_url: str | None = None
    phone_number: str | None = Field(default=None, max_length=30)
    general_location: str | None = Field(default=None, max_length=120)
    office_address: str | None = Field(default=None, max_length=250)
    offers_online: bool | None = None
    offers_in_person: bool | None = None
    show_phone_after_booking: bool | None = None
    show_office_after_booking: bool | None = None
    years_of_experience: int | None = None
    counseling_approach: str | None = None
    highest_certification: str | None = Field(default=None, max_length=200)
    issuing_institution: str | None = Field(default=None, max_length=200)
    languages_offered: str | None = Field(default=None, max_length=200)
    preferred_session_type: str | None = Field(default=None, max_length=50)
    preferred_duration: str | None = Field(default=None, max_length=20)
    hourly_rate: float | None = Field(default=None, ge=0)
