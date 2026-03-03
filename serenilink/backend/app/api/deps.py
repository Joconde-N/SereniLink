from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.db.session import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Reads token, extracts user id, returns the user.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        subject: str | None = payload.get("sub")
        if not subject:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(subject)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        user_id = int(subject)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")

    return user

def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
        