import re
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

# API key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def validate_api_key(api_key: str) -> bool:
    """
    Validate the Gemini API key format.
    
    Args:
        api_key: The API key to validate.
        
    Returns:
        bool: True if the API key is valid, False otherwise.
    """
    # Basic validation - Gemini API keys typically start with "AI" followed by alphanumeric characters
    # This is a simple check and may need to be updated based on actual Gemini API key format
    if not api_key or not isinstance(api_key, str):
        return False
    
    # Check if the API key matches the expected pattern
    # This is a simplified pattern and may need to be adjusted
    pattern = r'^[A-Za-z0-9_-]{20,}$'
    return bool(re.match(pattern, api_key))

async def get_api_key(api_key_header: str = Security(api_key_header)) -> str:
    """
    Get and validate the API key from the request header.
    
    Args:
        api_key_header: The API key from the request header.
        
    Returns:
        str: The validated API key.
        
    Raises:
        HTTPException: If the API key is invalid or missing.
    """
    if not api_key_header:
        raise HTTPException(
            status_code=401,
            detail="API key is required",
        )
    
    if not validate_api_key(api_key_header):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )
    
    return api_key_header
