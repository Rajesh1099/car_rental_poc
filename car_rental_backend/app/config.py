# app/config.py

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # JWT Auth
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Email config
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str
    SMTP_SERVER: str
    SMTP_PORT: int

    # Google OAuth2
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    # DB and frontend
    DATABASE_URL: str
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Cashfree payment gateway
    CASHFREE_CLIENT_ID: str
    CASHFREE_CLIENT_SECRET: str
    
    class Config:
        env_file = ".env"
        orm_mode = True


settings = Settings()
