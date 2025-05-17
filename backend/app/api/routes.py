from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.models.request_models import ChatRequest
from app.services.gemini_service import get_gemini_response
from app.services.token_estimator import estimate_tokens
from app.core.security import validate_api_key
from app.core.config import settings

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Process a chat request and return a non-streaming response from Gemini API.

    Args:
        request: The chat request containing the API key, webpage content, and user query.

    Returns:
        JSONResponse: A JSON response containing the complete text from the Gemini API.
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
    # If token count exceeds the configured token limit, use the fallback model
    if token_count > settings.TOKEN_LIMIT:
        model_name = settings.FALLBACK_MODEL
    else:
        model_name = settings.PRIMARY_MODEL

    # Get complete response (non-streaming)
    response_text = await get_gemini_response(request.api_key, model_name, input_text_parts)

    # Return JSON response
    return JSONResponse(
        content={"text": response_text},
        media_type="application/json",
    )

@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        dict: A dictionary containing the status of the API.
    """
    return {"status": "healthy"}
