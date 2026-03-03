import os
from openai import OpenAI

def get_ai_client() -> OpenAI:
    # Hugging Face router is OpenAI-compatible
    return OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=os.getenv("HF_TOKEN", ""),
    )

def get_ai_model() -> str:
    return os.getenv("AI_MODEL", "openai/gpt-oss-20b:groq")