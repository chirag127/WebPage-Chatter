import os
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
    
    # Gemini API settings
    PRIMARY_MODEL: str = "gemini-2.5-flash-preview-04-17"
    FALLBACK_MODEL: str = "gemini-2.0-flash-lite"
    TOKEN_LIMIT: int = 200000  # Token limit for primary model
    
    # CORS settings
    CORS_ORIGINS: list = ["*"]  # Allow all origins for browser extensions
    
    # Environment settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

# Create settings instance
settings = Settings()
