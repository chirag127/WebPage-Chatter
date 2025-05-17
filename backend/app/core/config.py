import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Settings(BaseModel):
    """
    Application settings.
    """
    API_TITLE: str = "WebPage Chatter API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Backend API for WebPage Chatter browser extension"

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Gemini API settings
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "gemini-2.5-flash-preview-04-17")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "gemini-2.0-flash-lite")
    TOKEN_LIMIT: int = int(os.getenv("TOKEN_LIMIT", "200000"))  # Token limit for primary model

    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")

    # Environment settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

# Create settings instance
settings = Settings()
