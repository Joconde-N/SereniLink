from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    password = password.strip()
    return pwd_context.hash(password) #to turn plain password into a hashed string

def verify_password(password: str, password_hash: str) -> bool:
    password = password.strip()
    return pwd_context.verify(password, password_hash) #to verify if the provided password matches the stored hash

def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    
    payload = {
        "sub": subject, 
        "exp": expire
    }

    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt #to create a JWT access token with an expiration time and subject