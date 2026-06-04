from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.ai_client import get_ai_client, get_ai_model

router = APIRouter(prefix="/ai", tags=["AI Support"])
limiter = Limiter(key_func=get_remote_address)

GUEST_HISTORY: dict[str, list[dict]] = {}
GUEST_COUNT: dict[str, int] = {}

MAX_GUEST_MESSAGES = 5


class GuestChatIn(BaseModel):
    guest_id: str = Field(min_length=6, max_length=100)
    message: str = Field(min_length=1, max_length=2000)


def detect_risk_level(text: str) -> str:
    t = text.lower()

    high_keywords = [
        "suicide",
        "kill myself",
        "self-harm",
        "self harm",
        "cut myself",
        "end my life",
        "i want to die",
        "i wish i was dead",
        "hurt myself",
    ]

    moderate_keywords = [
        "hopeless",
        "worthless",
        "i want to disappear",
        "i can't go on",
        "i feel empty",
        "nothing matters",
        "i feel like giving up",
        "i feel overwhelmed",
    ]

    for k in high_keywords:
        if k in t:
            return "HIGH"

    for k in moderate_keywords:
        if k in t:
            return "MODERATE"

    return "LOW"


@router.post("/guest-chat")
@limiter.limit("20/minute")
def guest_chat(request: Request, payload: GuestChatIn):
    gid = payload.guest_id.strip()

    used = GUEST_COUNT.get(gid, 0) + 1
    GUEST_COUNT[gid] = used

    if used > MAX_GUEST_MESSAGES:
        raise HTTPException(
            status_code=403,
            detail="Guest limit reached (5 messages). Please login to continue using AI support.",
        )

    risk = detect_risk_level(payload.message)

    history = GUEST_HISTORY.get(gid, [])
    history.append({"role": "user", "content": payload.message})
    history = history[-12:]

    if risk == "HIGH":
        safe_reply = (
            "I’m really sorry you’re feeling this way. You do not have to handle this alone. "
            "Please reach out to someone you trust right now, like a family member, friend, counselor, "
            "or someone nearby. If you feel unsafe or need urgent help in Rwanda, call 112 for national "
            "emergency support or 114 for medical emergency or ambulance services. "
            "You can also sign up or log in to book a counselor through SereniLink."
        )

        history.append({"role": "assistant", "content": safe_reply})
        GUEST_HISTORY[gid] = history[-12:]

        return {
            "guest_id": gid,
            "messages_used": used,
            "messages_left": max(0, MAX_GUEST_MESSAGES - used),
            "risk_level": "HIGH",
            "reply": safe_reply,
        }

    client = get_ai_client()
    model = get_ai_model()

    guest_system_prompt = {
        "role": "system",
        "content": (
            "You are SereniLink AI, a calm and supportive mental health assistant for guest users. "
            "Give short, clean, meaningful, and well-structured answers. "
            "Use a warm and natural tone, but do not be too long or dramatic. "
            "Keep most replies between 3 and 6 short sentences. "
            "Use bullet points only when they make the answer easier to read. "
            "Do not diagnose, do not act like a doctor, and do not give medical treatment. "
            "Offer simple coping tips, grounding techniques, or gentle encouragement when helpful. "
            "Because this is guest mode, avoid long follow-up conversations and gently suggest signing up "
            "or logging in if the user needs continued support. "
            "For emergencies in Rwanda, mention only 112 for national emergency support and 114 for medical "
            "emergency or ambulance services. "
            "Never mention 911 or non-Rwandan emergency numbers."
        ),
    }

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[guest_system_prompt] + history,
            temperature=0.6,
            max_tokens=180,
        )

        reply = completion.choices[0].message.content or (
            "I’m here with you. Could you share a little more about what you’re feeling?"
        )

    except Exception:
        reply = (
            "I’m sorry, the AI support service is temporarily unavailable. "
            "You can still use SereniLink to view resources, complete screenings, or book a counselor. "
            "If this is urgent in Rwanda, call 112 for emergency support or 114 for medical emergency services."
        )

    history.append({"role": "assistant", "content": reply})
    GUEST_HISTORY[gid] = history[-12:]

    return {
        "guest_id": gid,
        "messages_used": used,
        "messages_left": max(0, MAX_GUEST_MESSAGES - used),
        "risk_level": risk,
        "reply": reply,
    }