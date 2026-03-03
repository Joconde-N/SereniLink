from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model= UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
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
def login(
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

