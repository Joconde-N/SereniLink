from pydantic import BaseModel, EmailStr, Field, field_validator

class UserCreate(BaseModel):
    nickname: str = Field(min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str 

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class UserOut(BaseModel):
    id: int
    nickname: str
    email: EmailStr | None = None
    role: str

    class Config:
        from_attributes = True  #allows readinf from SQLAlchemy models


