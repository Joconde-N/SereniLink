from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.api.deps import get_db, require_admin
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

EXPORT_ROW_CAP = 5000


def _apply_filters(
    q,
    action: str | None,
    user_nickname: str | None,
    user_role: str | None,
    resource: str | None,
    date_from: str | None,
    date_to: str | None,
):
    """Shared filter logic for the list, CSV export, and PDF-data export endpoints."""
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
    return q


def _serialize(l: AuditLog) -> dict:
    return {
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
    q = _apply_filters(db.query(AuditLog), action, user_nickname, user_role, resource, date_from, date_to)

    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": [_serialize(l) for l in logs],
    }


@router.get("/export-json")
def export_audit_logs_json(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    action: str | None = None,
    user_nickname: str | None = None,
    user_role: str | None = None,
    resource: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
):
    """Full filtered result set (capped) as JSON — used by the frontend to build PDF reports."""
    q = _apply_filters(db.query(AuditLog), action, user_nickname, user_role, resource, date_from, date_to)

    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).limit(EXPORT_ROW_CAP).all()

    return {
        "total": total,
        "returned": len(logs),
        "capped": total > EXPORT_ROW_CAP,
        "logs": [_serialize(l) for l in logs],
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
    q = _apply_filters(db.query(AuditLog), action, user_nickname, user_role, resource, date_from, date_to)

    logs = q.order_by(AuditLog.created_at.desc()).limit(EXPORT_ROW_CAP).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Context header block
    writer.writerow([f"SereniLink Audit Log Export — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"])
    filter_parts = [
        f"Action: {action}" if action else None,
        f"Resource: {resource}" if resource else None,
        f"Role: {user_role}" if user_role else None,
        f"Nickname contains: {user_nickname}" if user_nickname else None,
        f"From: {date_from}" if date_from else None,
        f"To: {date_to}" if date_to else None,
    ]
    active = [p for p in filter_parts if p]
    writer.writerow([f"Filters: {' · '.join(active) if active else 'None (all entries)'}"])
    writer.writerow([f"Records exported: {len(logs)}"])
    writer.writerow([])

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
