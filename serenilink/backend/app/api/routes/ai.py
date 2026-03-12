from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.ai_client import get_ai_client, get_ai_model
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.schemas.ai import AIChatIn, AIChatOut, AIConversationOut, AIMessageOut

router = APIRouter(prefix="/ai", tags=["AI Support"])


def detect_risk(message: str) -> str:
    msg = message.lower()

    high = ["suicide", "kill myself", "end my life", "self harm", "self-harm", "i want to die",
            "i wish i was dead", "life is not worth living", "i can't live anymore", "thinking about suicide"
            "take my life", "hurt myself"]
    moderate = ["hopeless", "worthless", "very depressed", "i can't go on", "i want to disappear", "i feel empty", "nothing matters",
                "i feel lost", "i hate my life", "i feel like giving up", "i feel alone",
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
        "I’m really sorry you’re feeling this way. You don’t have to handle it alone. "
        "If you feel unsafe right now, please reach out to a trusted person nearby or local emergency support. "
        "If you want, tell me what’s going on. I can help you find a safer next step."
    )


# auto-pick latest conversation if none provided
def get_or_create_conversation(db: Session, user_id: int, conversation_id: int | None) -> AIConversation:
    if conversation_id is not None:
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conv

    conv = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == user_id)
        .order_by(AIConversation.created_at.desc())
        .first()
    )
    if conv:
        return conv

    # If user has no conversations: create a new one
    conv = AIConversation(user_id=user_id, created_at=datetime.utcnow())
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.post("/chat", response_model=AIChatOut)
def ai_chat(
    payload: AIChatIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conv = get_or_create_conversation(db, current_user.id, payload.conversation_id)

    risk = detect_risk(payload.message)

    # Save user message first
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

    memory_limit = 10
    history = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conv.id)
        .order_by(AIMessage.created_at.asc())
        .all()
    )
    history = history[-memory_limit:]

    messages = [
        {
            "role": "system",
            "content": (
                "You are SereniLink AI Support. Be kind, supportive, practical and answer any question clearly. "
                "Do not provide harmful instructions. Encourage professional help when appropriate."
            )
        }
    ]

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

    reply_text = resp.choices[0].message.content or "I’m here with you. Tell me more."

    # Save assistant reply
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