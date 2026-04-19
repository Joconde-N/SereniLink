from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.ai_client import get_ai_client, get_ai_model
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.models.user_ai_summary import UserAISummary
from app.models.mood import MoodEntry
from app.models.assessment import Assessment
from app.models.booking import Booking
from app.schemas.ai import AIChatIn, AIChatOut, AIConversationOut, AIMessageOut

router = APIRouter(prefix="/ai", tags=["AI Support"])


def detect_risk(message: str) -> str:
    msg = message.lower()
    high = ["suicide", "kill myself", "end my life", "self harm", "self-harm", "i want to die",
            "i wish i was dead", "life is not worth living", "i can't live anymore", "thinking about suicide",
            "take my life", "hurt myself"]
    moderate = ["hopeless", "worthless", "very depressed", "i can't go on", "i want to disappear", "i feel empty",
                "nothing matters", "i feel lost", "i hate my life", "i feel like giving up", "i feel alone",
                "i feel overwhelmed", "everything is too much", "i feel broken"]
    for w in high:
        if w in msg:
            return "HIGH"
    for w in moderate:
        if w in msg:
            return "MODERATE"
    return "LOW"


def safe_high_risk_reply() -> str:
    return (
        "I'm really sorry you're feeling this way. You don't have to handle it alone. "
        "If you feel unsafe right now, please reach out to a trusted person nearby or local emergency support. "
        "If you want, tell me what's going on. I can help you find a safer next step."
    )


def get_or_create_conversation(db: Session, user_id: int, conversation_id: int | None, force_new: bool = False) -> AIConversation:
    if not force_new and conversation_id is not None:
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conv

    if not force_new and conversation_id is None:
        conv = (
            db.query(AIConversation)
            .filter(AIConversation.user_id == user_id)
            .order_by(AIConversation.created_at.desc())
            .first()
        )
        if conv:
            return conv

    conv = AIConversation(user_id=user_id, created_at=datetime.utcnow())
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def build_live_context(db: Session, user_id: int) -> str:
    """Fetch recent mood, assessment and booking data to give the AI situational awareness."""
    lines = []
    since = datetime.utcnow() - timedelta(days=7)

    # Recent moods
    moods = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user_id, MoodEntry.created_at >= since)
        .order_by(MoodEntry.created_at.desc())
        .limit(5)
        .all()
    )
    if moods:
        mood_list = ", ".join(m.mood for m in moods)
        lines.append(f"Recent moods (last 7 days): {mood_list}")

    # Latest assessment
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == user_id)
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if assessment:
        lines.append(
            f"Latest check-in scores — Mood: {assessment.mood}/10, "
            f"Stress: {assessment.stress}/10, Sleep: {assessment.sleep}/10"
        )

    # Upcoming bookings
    upcoming = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.status == "APPROVED",
            Booking.scheduled_for >= datetime.utcnow(),
        )
        .count()
    )
    if upcoming:
        lines.append(f"Upcoming approved counseling sessions: {upcoming}")

    return "\n".join(lines) if lines else ""


def get_or_create_summary(db: Session, user_id: int) -> UserAISummary:
    summary = db.query(UserAISummary).filter(UserAISummary.user_id == user_id).first()
    if not summary:
        summary = UserAISummary(user_id=user_id, summary="", updated_at=datetime.utcnow())
        db.add(summary)
        db.commit()
        db.refresh(summary)
    return summary


def update_summary(db: Session, user_id: int, conversation_excerpt: str, client, model: str):
    """Ask the AI to update the rolling summary based on the latest exchange."""
    summary_record = get_or_create_summary(db, user_id)
    existing = summary_record.summary

    prompt = [
        {
            "role": "system",
            "content": (
                "You are a calm, supportive mental health assistant who communicates in a natural, conversational, and empathetic way. Your role is to listen carefully, understand the user’s feelings, and respond with warmth and clarity. "
                "You validate emotions without exaggeration and offer gentle support, including simple coping strategies or grounding techniques when appropriate. Your responses should be clear, well-structured, and not overwhelming."
                "You do not act as a note-taking or memory system, and you do not summarize the user’s situation unless they explicitly ask. Avoid overly long, robotic, or complex responses. Maintain a balanced tone that is warm and human-like, but not overly dramatic or emotional."
                "If a user appears to be in distress, gently encourage them to seek help from trusted people or professional support. When suggesting emergency contacts, only provide Rwanda-based options such as 112 (general emergency) and 114 (health emergency or ambulance)."
                " Do not mention 911 or any non-Rwandan services."
                "Always remain respectful, non-judgmental, and supportive. Your goal is to help the user feel heard, understood, and safe."
            )
        },
        {
            "role": "user",
            "content": (
                f"Existing summary:\n{existing or 'None yet.'}\n\n"
                f"New conversation excerpt:\n{conversation_excerpt}\n\n"
                "Update the summary to include any new meaningful information. "
                "Return only the updated summary text, nothing else."
            )
        }
    ]

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=prompt,
            temperature=0.3,
            max_tokens=400,
        )
        new_summary = resp.choices[0].message.content.strip()
        summary_record.summary = new_summary
        summary_record.updated_at = datetime.utcnow()
        db.commit()
    except Exception:
        pass  # Never let summary update break the main chat flow


@router.post("/chat", response_model=AIChatOut)
def ai_chat(
    payload: AIChatIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conv = get_or_create_conversation(db, current_user.id, payload.conversation_id, force_new=payload.force_new)
    risk = detect_risk(payload.message)

    user_msg = AIMessage(
        conversation_id=conv.id,
        role="user",
        content=payload.message,
        risk_level=risk,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    if risk == "HIGH":
        reply_text = safe_high_risk_reply()
        ai_msg = AIMessage(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
            risk_level=risk,
            created_at=datetime.utcnow()
        )
        db.add(ai_msg)
        db.commit()
        return {"conversation_id": conv.id, "reply": reply_text, "risk_level": risk}

    # Build system prompt with summary only
    summary_record = get_or_create_summary(db, current_user.id)

    system_content = (
        "You are SereniLink AI Support — a warm, empathetic mental health companion. "
        "Be kind, supportive, and practical. Do not provide harmful instructions. "
        "Encourage professional help when appropriate. "
        "All users are based in Rwanda. When suggesting emergency or crisis contacts, "
        "only reference Rwandan services: emergency number 112, health services 114, "
        "or Caraes Ndera neuropsychiatric hospital which is the main mental health facility in Rwanda.\n\n"
    )

    if summary_record.summary:
        system_content += f"What you know about this user:\n{summary_record.summary}\n\n"

    system_content += (
        f"The user's name is {current_user.nickname}. "
        "Use this context naturally — do not reference it directly or make the user feel monitored."
    )

    # Recent conversation history
    history = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conv.id)
        .order_by(AIMessage.created_at.asc())
        .all()
    )
    history = history[-10:]

    messages = [{"role": "system", "content": system_content}]
    for m in history:
        messages.append({"role": m.role, "content": m.content})

    client = get_ai_client()
    model = get_ai_model()

    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=400,
    )

    reply_text = resp.choices[0].message.content or "I'm here with you. Tell me more."

    ai_msg = AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=reply_text,
        risk_level=risk,
        created_at=datetime.utcnow()
    )
    db.add(ai_msg)
    db.commit()

    # Update rolling summary with this exchange
    excerpt = f"User: {payload.message}\nAssistant: {reply_text}"
    update_summary(db, current_user.id, excerpt, client, model)

    return {"conversation_id": conv.id, "reply": reply_text, "risk_level": risk}


@router.get("/conversations/me", response_model=list[AIConversationOut])
def my_conversations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=20, le=100),
):
    return (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=list[AIMessageOut])
def conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
