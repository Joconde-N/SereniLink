from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "SereniLink"
    ENV: str = "dev"

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 * 7  # 7 days

    # ✅ Add these to match .env
    HF_TOKEN: str = ""
    AI_MODEL: str = "openai/gpt-oss-20b:groq"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid"   # keeps it strict (recommended)
    )


settings = Settings()