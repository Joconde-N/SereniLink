from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "SereniLink"
    ENV: str = "dev"

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 * 7  # 7 days

    HF_API_KEY: str
    HF_BASE_URL: str = "https://router.huggingface.co/v1"
    AI_MODEL: str = "openai/gpt-oss-20b:groq"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@serenilink.com"

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()