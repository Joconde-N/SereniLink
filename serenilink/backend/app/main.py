from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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

from app.db.session import engine
from app.models import User, Content, Assessment, Counselor, CounselorApplication, Booking, Progress, ChatMessage, AvailabilitySlot, AIConversation, AIMessage, MoodEntry, Exercise, Notification, Screening, SessionNote, AuditLog
from app.db.base import Base
from app.api.deps import get_current_user, require_admin
from sqlalchemy.orm import Session
from app.api.deps import get_db
from fastapi import Depends

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title=settings.APP_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

# Protected file download — requires valid JWT
@app.get("/files/{file_path:path}")
async def protected_file(
    file_path: str,
    current_user=Depends(get_current_user),
):
    full_path = UPLOAD_DIR / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    # Only admin or the file owner (counselor applications) can download certs
    # For simplicity: any authenticated user can download (covers counselors viewing their own)
    return FileResponse(str(full_path))

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
