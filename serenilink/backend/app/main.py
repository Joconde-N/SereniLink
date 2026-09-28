from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.core.rate_limit import install_rate_limiting

from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.content import router as content_router
from app.api.routes.assessment import router as assessment_router
from app.api.routes.counselors import router as counselors_router
from app.api.routes.booking import router as bookings_router
from app.api.routes.progress import router as progress_router
from app.api.routes.chat import router as chat_router
from app.api.routes.counselor_applications import router as counselor_applications_router
from app.api.routes.availability import router as availability_router
from app.api.routes.ai import router as ai_router
from app.api.routes.moods import router as moods_router
from app.api.routes.exercises import router as exercises_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.admin_users import router as admin_users_router
from app.api.routes.ai_guest import router as ai_guest_router
from app.api.routes.screenings import router as screenings_router
from app.api.routes.session_notes import router as session_notes_router
from app.api.routes.audit_logs import router as audit_logs_router
from app.api.routes.risk_monitoring import router as risk_monitoring_router
from app.api.routes.files import router as files_router

from app.db.session import engine
from app.models import User, Content, Assessment, Counselor, CounselorApplication, Booking, Progress, ChatMessage, AvailabilitySlot, AIConversation, AIMessage, MoodEntry, Exercise, Notification, Screening, SessionNote, AuditLog
from app.db.base import Base

app = FastAPI(title=settings.APP_NAME)
install_rate_limiting(app)

# CORS — reads allowed origins from env, falls back to localhost for dev
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads static dir
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.include_router(files_router)

app.include_router(auth_router)
app.include_router(content_router)
app.include_router(assessment_router)
app.include_router(counselors_router)
app.include_router(bookings_router)
app.include_router(progress_router)
app.include_router(chat_router)
app.include_router(counselor_applications_router)
app.include_router(availability_router)
app.include_router(ai_router)
app.include_router(moods_router)
app.include_router(exercises_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(admin_users_router)
app.include_router(ai_guest_router)
app.include_router(screenings_router)
app.include_router(session_notes_router)
app.include_router(audit_logs_router)
app.include_router(risk_monitoring_router)

Base.metadata.create_all(bind=engine)

# Do not serve ambiguous legacy timestamps while the data migration is pending.
if engine.dialect.name == "postgresql":
    from sqlalchemy import inspect

    inspector = inspect(engine)
    for table, fields in (("bookings", {"scheduled_for", "created_at", "updated_at"}),
                          ("availability_slots", {"start_time", "end_time", "created_at", "updated_at"})):
        for column in inspector.get_columns(table):
            if column["name"] in fields and not column["type"].timezone:
                raise RuntimeError("Booking timezone migration required before startup. See backend/BOOKING_MIGRATION.md.")
    if "uq_bookings_active_slot" not in {index["name"] for index in inspector.get_indexes("bookings")}:
        raise RuntimeError("Booking safety migration required before startup. See backend/BOOKING_MIGRATION.md.")
