import secrets
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.rate_limit import limiter

from app.api.deps import get_db, get_current_user, get_authenticated_user
from app.core.security import hash_password, verify_password, create_access_token, validate_password
from app.core.email import send_password_reset_email
from app.core.audit import log_action
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserOut, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    validate_password(payload.password)

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
    log_action(db, "USER_REGISTERED", user=user, resource="user", resource_id=user.id, detail=f"New user registered: {user.nickname}", ip_address=request.client.host if request.client else None)
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

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")

    token = create_access_token(subject=str(user.id), password_hash=user.password_hash)
    log_action(db, "USER_LOGIN", user=user, resource="auth", detail=f"User logged in: {user.nickname}", ip_address=request.client.host if request.client else None)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_authenticated_user)):
    return current_user


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    email: EmailStr | None = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_is_none(cls, value):
        if isinstance(value, str):
            return value.strip() or None
        return value


@router.patch("/me", response_model=UserOut)
def update_profile(
    request: Request,
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if "email" not in payload.model_fields_set:
        return current_user
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")
    if current_user.email != payload.email:
        current_user.email = payload.email
        current_user.password_reset_token = None
        current_user.password_reset_expires = None
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already in use.") from None
    db.refresh(current_user)
    log_action(db, "PROFILE_UPDATED", user=current_user, resource="user", resource_id=current_user.id, detail="Email updated", ip_address=request.client.host if request.client else None)
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
    # The existing reset-expiry column stores naive UTC timestamps.
    user.password_reset_expires = datetime.utcnow() + timedelta(minutes=30)
    db.commit()

    send_password_reset_email(user.email, token)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("10/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == payload.token).with_for_update().first()
    if not user or user.password_reset_expires is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    expires = user.password_reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    validate_password(payload.new_password)

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.must_change_password = False
    db.commit()
    return {"message": "Password reset successfully."}


@router.post("/change-password")
@limiter.limit("10/minute")
def change_password(
    request: Request,
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    # Lock and refresh so concurrent changes cannot reuse stale credentials.
    current_user = db.query(User).filter(User.id == current_user.id).populate_existing().with_for_update().one()
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    validate_password(payload.new_password)
    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Choose a password different from your current password.")
    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    current_user.password_reset_token = None
    current_user.password_reset_expires = None
    db.commit()
    return {"message": "Password updated successfully.", "token_type": "bearer",
            "access_token": create_access_token(str(current_user.id), current_user.password_hash)}

