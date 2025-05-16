from pydantic import BaseModel, Field
from typing import List, Optional

class ErrorResponse(BaseModel):
    """
    Error response model.
    """
    detail: str = Field(..., description="Error message")

class HealthResponse(BaseModel):
    """
    Health check response model.
    """
    status: str = Field(..., description="API status")
