from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.ai_client import get_ai_client, get_ai_model

router = APIRouter(prefix="/ai", tags=["AI Support"])
limiter = Limiter(key_func=get_remote_address)

# In-memory guest storage (resets if server restarts)
GUEST_HISTORY: dict[str, list[dict]] = {}
GUEST_COUNT: dict[str, int] = {}

MAX_GUEST_MESSAGES = 5


class GuestChatIn(BaseModel):
    guest_id: str = Field(min_length=6, max_length=100)
    message: str = Field(min_length=1, max_length=2000)


def detect_risk_level(text: str) -> str:
    t = text.lower()

    high_keywords = [
        "suicide", "kill myself", "self-harm", "cut myself", "end my life"
    ]
    moderate_keywords = [
        "hopeless", "worthless", "i want to disappear", "i can't go on"
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

    # message limit
    used = GUEST_COUNT.get(gid, 0) + 1
    GUEST_COUNT[gid] = used

    if used > MAX_GUEST_MESSAGES:
        raise HTTPException(
            status_code=403,
            detail="Guest limit reached (5 messages). Please login to continue using AI support."
        )

    # Risk check
    risk = detect_risk_level(payload.message)

    # Store guest message in history 
    history = GUEST_HISTORY.get(gid, [])
    history.append({"role": "user", "content": payload.message})
    history = history[-12:]

    if risk == "HIGH":
        safe_reply = (
            "I’m really sorry you’re feeling this way. You deserve support and you don’t have to handle it alone. "
            "If you’re in immediate danger, please reach out to a trusted adult or local emergency support right now. "
            "Do you want to share what’s been going on today?"
        )
        history.append({"role": "assistant", "content": safe_reply})
        GUEST_HISTORY[gid] = history[-12:]

        return {
            "guest_id": gid,
            "messages_used": used,
            "messages_left": max(0, MAX_GUEST_MESSAGES - used),
            "risk_level": "HIGH",
            "reply": safe_reply
        }

    client = get_ai_client()
    model = get_ai_model()

    completion = client.chat.completions.create(
        model=model,
        messages=history
    )

    reply = completion.choices[0].message.content

    # Save assistant reply
    history.append({"role": "assistant", "content": reply})
    GUEST_HISTORY[gid] = history[-12:]

    return {
        "guest_id": gid,
        "messages_used": used,
        "messages_left": max(0, MAX_GUEST_MESSAGES - used),
        "risk_level": risk,
        "reply": reply
    }