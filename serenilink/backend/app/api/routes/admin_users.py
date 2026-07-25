from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.core.audit import log_action

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/")
def list_users(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [
        {
            "id": u.id,
            "nickname": u.nickname,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/{user_id}/promote")
def promote_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role.")
    user.role = "admin"
    db.commit()
    log_action(db, "USER_PROMOTED", user=admin, resource="user", resource_id=user_id, detail=f"Promoted {user.nickname} to admin")
    return {"message": "User promoted to admin", "role": user.role}


@router.patch("/{user_id}/demote")
def demote_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role.")
    user.role = "user"
    db.commit()
    log_action(db, "USER_DEMOTED", user=admin, resource="user", resource_id=user_id, detail=f"Demoted {user.nickname} to user")
    return {"message": "User demoted to user", "role": user.role}


@router.patch("/{user_id}/toggle-active")
def toggle_active(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account.")
    user.is_active = not user.is_active
    db.commit()
    log_action(db, "USER_TOGGLE_ACTIVE", user=admin, resource="user", resource_id=user_id, detail=f"Set {user.nickname} active={user.is_active}")
    return {"message": "Status updated", "is_active": user.is_active}