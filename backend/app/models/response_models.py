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

class SuggestQuestionsResponse(BaseModel):
    """
    Response model for question suggestions endpoint.
    """
    questions: List[str] = Field(..., description="List of suggested questions")

    class Config:
        schema_extra = {
            "example": {
                "questions": [
                    "What is the main topic of this webpage?",
                    "Can you summarize the key points?",
                    "How does this information relate to recent developments?",
                    "What are the implications of this content?",
                    "Are there any contradictions in the information presented?"
                ]
            }
        }
