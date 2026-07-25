from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.api.deps import get_db, require_admin
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("/")
def list_audit_logs(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    action: str | None = None,
    user_nickname: str | None = None,
    user_role: str | None = None,
    resource: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if user_nickname:
        q = q.filter(AuditLog.user_nickname.ilike(f"%{user_nickname}%"))
    if user_role:
        q = q.filter(AuditLog.user_role == user_role)
    if resource:
        q = q.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if date_from:
        try:
            q = q.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            q = q.filter(AuditLog.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "user_nickname": l.user_nickname,
                "user_role": l.user_role,
                "action": l.action,
                "resource": l.resource,
                "resource_id": l.resource_id,
                "detail": l.detail,
                "ip_address": l.ip_address,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
    }


@router.get("/export-csv")
def export_audit_logs_csv(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    action: str | None = None,
    user_nickname: str | None = None,
    user_role: str | None = None,
    resource: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if user_nickname:
        q = q.filter(AuditLog.user_nickname.ilike(f"%{user_nickname}%"))
    if user_role:
        q = q.filter(AuditLog.user_role == user_role)
    if resource:
        q = q.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if date_from:
        try:
            q = q.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            q = q.filter(AuditLog.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    logs = q.order_by(AuditLog.created_at.desc()).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "User ID", "Nickname", "Role", "Action", "Resource", "Resource ID", "Detail", "IP Address", "Timestamp"])
    for l in logs:
        writer.writerow([
            l.id, l.user_id, l.user_nickname, l.user_role,
            l.action, l.resource, l.resource_id, l.detail,
            l.ip_address, l.created_at.isoformat() if l.created_at else "",
        ])

    output.seek(0)
    filename = f"audit-logs-{datetime.utcnow().strftime('%Y-%m-%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
