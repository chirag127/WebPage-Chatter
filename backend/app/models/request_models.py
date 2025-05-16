from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    """
    Request model for chat endpoint.
    """
    api_key: str = Field(..., description="User's Gemini API key")
    webpage_content: str = Field(..., description="Extracted content from the webpage")
    query: str = Field(..., description="User's query about the webpage content")
    
    class Config:
        schema_extra = {
            "example": {
                "api_key": "YOUR_GEMINI_API_KEY",
                "webpage_content": "This is the content of the webpage...",
                "query": "What is this webpage about?"
            }
        }
