from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.ai_client import get_ai_client, get_ai_model
from app.schemas.ai import AIChatIn, AIChatOut

router = APIRouter(prefix="/ai", tags=["AI Support"])

def detect_risk(message: str) -> str:
    msg = message.lower()

    high = ["suicide", "kill myself", "end my life", "self harm"]
    moderate = ["hopeless", "worthless", "very depressed"]

    for w in high:
        if w in msg:
            return "HIGH"
    for w in moderate:
        if w in msg:
            return "MODERATE"
    return "LOW"

def high_risk_reply() -> str:
    # keep it supportive + encourage reaching out
    return (
        "I’m really sorry you’re feeling this way. You don’t have to handle this alone. "
        "If you’re in danger right now, please call Rwanda emergency services (112) or health services (114). "
        "If you’re a child/teen and need help, you can also call 116. "
        "If you can, reach out to a trusted adult or someone close to you right now."
    )

@router.post("/chat", response_model=AIChatOut)
def ai_chat(
    payload: AIChatIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    risk = detect_risk(payload.message)

    if risk == "HIGH":
        return {"reply": high_risk_reply(), "risk_level": risk}

    client = get_ai_client()
    model = get_ai_model()

    messages = [
        {
            "role": "system",
            "content": (
                "You are SereniLink AI Support. Be supportive, respectful, and helpful. "
                "Do not provide harmful instructions. If the user seems in danger, encourage seeking immediate help."
            )
        },
        {"role": "user", "content": payload.message},
    ]

    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=400,
    )

    reply_text = resp.choices[0].message.content
    return {"reply": reply_text, "risk_level": risk}