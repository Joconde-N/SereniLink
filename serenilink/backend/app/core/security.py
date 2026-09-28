from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
import hashlib
import hmac
import re
from fastapi import HTTPException

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    password = password.strip()
    return pwd_context.hash(password) #to turn plain password into a hashed string

def verify_password(password: str, password_hash: str) -> bool:
    password = password.strip()
    return pwd_context.verify(password, password_hash) #to verify if the provided password matches the stored hash

def validate_password(password: str):
    value = password.strip()
    if (len(value) < 8 or not re.search(r"[A-Z]", value)
            or not re.search(r"[0-9]", value)
            or not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", value)):
        raise HTTPException(status_code=400, detail="Password must contain at least 8 characters, an uppercase letter, a number, and a special character.")


def password_token_tag(password_hash: str) -> str:
    # Keyed digest avoids putting the password hash itself in a readable JWT.
    return hmac.new(settings.JWT_SECRET.encode(), password_hash.encode(), hashlib.sha256).hexdigest()


def token_matches_password(payload: dict, password_hash: str) -> bool:
    tag = payload.get("pwd")
    return isinstance(tag, str) and hmac.compare_digest(tag, password_token_tag(password_hash))


def create_access_token(subject: str, password_hash: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    
    payload = {
        "sub": subject, 
        "exp": expire,
        "pwd": password_token_tag(password_hash),
    }

    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt #to create a JWT access token with an expiration time and subject
