from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from app.models.request_models import ChatRequest
from app.services.gemini_service import get_gemini_response_stream
from app.services.token_estimator import estimate_tokens
from app.core.security import validate_api_key

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Process a chat request and return a streaming response from Gemini API.
    
    Args:
        request: The chat request containing the API key, webpage content, and user query.
        
    Returns:
        StreamingResponse: A streaming response from the Gemini API.
    """
    # Validate API key
    if not validate_api_key(request.api_key):
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Combine webpage content and user query
    input_text_parts = [
        f"WEBPAGE CONTENT:\n{request.webpage_content}\n\nUSER QUERY: {request.query}"
    ]
    
    # Estimate token count to determine which model to use
    token_count = estimate_tokens(request.webpage_content + request.query)
    
    # Select model based on token count
    # If token count exceeds 200k, use the fallback model
    if token_count > 200000:
        model_name = "gemini-2.0-flash-lite"
    else:
        model_name = "gemini-2.5-flash-preview-04-17"
    
    # Create streaming response
    return StreamingResponse(
        get_gemini_response_stream(request.api_key, model_name, input_text_parts),
        media_type="text/plain",
    )

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict: A dictionary containing the status of the API.
    """
    return {"status": "healthy"}
