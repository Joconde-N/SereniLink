import os
from openai import OpenAI
from app.core.config import settings

def get_ai_client():
    return OpenAI(
        api_key=settings.HF_API_KEY,
        base_url=settings.HF_BASE_URL
    )

def get_ai_model() -> str:
    return settings.AI_MODEL