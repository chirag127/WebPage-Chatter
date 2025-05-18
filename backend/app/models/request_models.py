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

class SuggestQuestionsRequest(BaseModel):
    """
    Request model for question suggestions endpoint.
    """
    api_key: str = Field(..., description="User's Gemini API key")
    webpage_content: str = Field(..., description="Extracted content from the webpage")
    count: int = Field(5, description="Number of question suggestions to generate", ge=1, le=10)
    conversation_history: list = Field([], description="Previous messages in the conversation")
    use_conversation_context: bool = Field(False, description="Whether to use conversation history for context")

    class Config:
        schema_extra = {
            "example": {
                "api_key": "YOUR_GEMINI_API_KEY",
                "webpage_content": "This is the content of the webpage...",
                "count": 5,
                "conversation_history": [
                    {"role": "user", "content": "What is this webpage about?"},
                    {"role": "assistant", "content": "This webpage is about..."}
                ],
                "use_conversation_context": True
            }
        }
