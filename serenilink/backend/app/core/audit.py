from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    user=None,
    resource: str = None,
    resource_id=None,
    detail: str = None,
    ip_address: str = None,
):
    entry = AuditLog(
        user_id=getattr(user, "id", None),
        user_nickname=getattr(user, "nickname", None),
        user_role=getattr(user, "role", None),
        action=action,
        resource=resource,
        resource_id=str(resource_id) if resource_id is not None else None,
        detail=detail,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
