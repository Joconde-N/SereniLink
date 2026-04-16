import secrets
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.core.email import send_password_reset_email
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token

router = APIRouter(prefix="/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=UserOut, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    p = payload.password
    if len(p) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", p):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"[0-9]", p):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", p):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

    existing = db.query(User).filter(User.nickname == payload.nickname).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nickname already exist, please choose another one.")
    
    if payload.email:
        email_exists = db.query(User).filter(User.email == payload.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="The email provided is already registered.")
        
    user = User(
        nickname=payload.nickname,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # the OAuth2PasswordRequestForm expects username(nickname) and password

    user = db.query(User).filter(User.nickname == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    new_password: str


class UpdateProfileRequest(BaseModel):
    email: str | None = None


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")
        current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.commit()

    send_password_reset_email(user.email, token)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == payload.token).first()
    if not user or user.password_reset_expires is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    expires = user.password_reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"message": "Password reset successfully."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Password updated successfully."}

