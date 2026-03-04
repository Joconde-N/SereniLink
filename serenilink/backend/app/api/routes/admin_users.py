from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/")
def list_users(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [
        {"id": u.id, "nickname": getattr(u, "nickname", None), "email": getattr(u, "email", None), "role": u.role}
        for u in users
    ]


@router.patch("/{user_id}/promote")
def promote_user_to_admin(user_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "admin"
    db.commit()
    return {"message": "User promoted to admin", "user_id": user.id}