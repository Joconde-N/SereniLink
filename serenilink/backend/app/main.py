from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.health import router as health_router
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

from app.db.session import engine
from app.models import User, Content, Assessment, Counselor, CounselorApplication, Booking, Progress, ChatMessage, AvailabilitySlot, AIConversation, AIMessage, MoodEntry, Exercise, Notification
from app.db.base import Base

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
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

Base.metadata.create_all(bind=engine)