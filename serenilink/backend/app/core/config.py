from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "SereniLink"
    ENV: str = "dev"

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 * 7 #for 7 days

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()