from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationMarkRead

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/me", response_model=list[NotificationOut])
def my_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    unread_only: bool = False,
    skip: int = 0,
    limit: int = Query(default=30, le=200),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    payload: NotificationMarkRead,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")

    item.is_read = payload.is_read
    db.commit()
    db.refresh(item)
    return item