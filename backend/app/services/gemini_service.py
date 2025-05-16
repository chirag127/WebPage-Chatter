# To run this code you need to install the following dependencies:
# pip install google-genai tenacity

import asyncio
import logging
from typing import List, AsyncGenerator
from tenacity import retry, stop_after_attempt, wait_exponential
from google import genai
from google.genai import types

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define retry decorator for Gemini API calls
def gemini_retry_decorator():
    """Create a retry decorator for Gemini API calls."""
    return retry(
        # Retry on any exception that might be related to network or service issues
        # We can't import specific Google API exceptions, so we'll retry on all exceptions
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=True,
        before_sleep=lambda retry_state: logger.info(f"Retrying Gemini API call: attempt {retry_state.attempt_number}")
    )

async def get_gemini_response(user_api_key: str, model_name: str, input_text_parts: List[str]) -> str:
    """
    Get a non-streaming response from the Gemini API.

    Args:
        user_api_key: The user's Gemini API key.
        model_name: The name of the Gemini model to use.
        input_text_parts: The input text parts to send to the Gemini API.

    Returns:
        str: The complete text response from the Gemini API.
    """
    try:
        # Initialize Gemini client with user's API key
        client = genai.Client(api_key=user_api_key)

        # Prepare content for Gemini API
        combined_text = "\n".join(input_text_parts)
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=combined_text),
                ],
            ),
        ]

        # Configure response generation with Markdown formatting
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/markdown",
        )

        # Use the retry decorator for the API call
        @gemini_retry_decorator()
        def get_content():
            return client.models.generate_content(
                model=model_name,
                contents=contents,
                config=generate_content_config,
            )

        # Get the complete response (non-streaming)
        response = get_content()

        # Return the complete text
        return response.text

    except Exception as e:
        # Handle all exceptions with specific error messages based on error type
        error_type = type(e).__name__
        error_message = str(e)

        # Log the error
        logger.error(f"Error during Gemini API call: {error_type}: {error_message}")

        # Categorize errors based on their type or message content
        if "quota" in error_message.lower() or "rate" in error_message.lower() or "limit" in error_message.lower():
            return f"Error: API quota exceeded or rate limited. Please try again later or check your API quota."
        elif "unavailable" in error_message.lower() or "service" in error_message.lower():
            return f"Error: Service temporarily unavailable. Please try again later."
        elif "timeout" in error_message.lower() or "deadline" in error_message.lower():
            return f"Error: Request timed out. The response took too long to generate. Try a shorter prompt or try again later."
        elif "key" in error_message.lower() or "auth" in error_message.lower() or "credential" in error_message.lower():
            return f"Error: API key issue. Please check your API key and try again."
        elif "network" in error_message.lower() or "connection" in error_message.lower():
            return f"Error: Network connection issue. Please check your internet connection and try again."
        else:
            return f"Error: {error_type}: {error_message}"

async def get_gemini_response_stream(user_api_key: str, model_name: str, input_text_parts: List[str]) -> AsyncGenerator[str, None]:
    """
    Get a streaming response from the Gemini API with improved error handling and retry logic.

    Args:
        user_api_key: The user's Gemini API key.
        model_name: The name of the Gemini model to use.
        input_text_parts: The input text parts to send to the Gemini API.

    Yields:
        str: Chunks of text from the Gemini API response.
    """
    # Initialize Gemini client with user's API key
    client = genai.Client(api_key=user_api_key)

    # Prepare content for Gemini API
    combined_text = "\n".join(input_text_parts)
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=combined_text),
            ],
        ),
    ]

    # Configure response generation with timeout
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )

    # Track if we've started streaming to provide better error messages
    stream_started = False

    try:
        # Use the retry decorator for the API call
        @gemini_retry_decorator()
        def get_content_stream():
            return client.models.generate_content_stream(
                model=model_name,
                contents=contents,
                config=generate_content_config,
            )

        # Stream the response with retries
        for chunk in get_content_stream():
            stream_started = True
            if chunk.text:
                yield chunk.text
            # Small delay to prevent overwhelming the client
            await asyncio.sleep(0.01)

        # Signal successful completion
        yield "\n\n[Response completed successfully]"

    except Exception as e:
        # Handle all exceptions with specific error messages based on error type
        error_type = type(e).__name__
        error_message = str(e)

        # Log the error
        logger.error(f"Error during Gemini API streaming: {error_type}: {error_message}")

        # Categorize errors based on their type or message content
        if "quota" in error_message.lower() or "rate" in error_message.lower() or "limit" in error_message.lower():
            # Handle rate limiting or quota errors
            user_message = f"\n\nError: API quota exceeded or rate limited. Please try again later or check your API quota."
        elif "unavailable" in error_message.lower() or "service" in error_message.lower():
            # Handle service unavailability
            user_message = f"\n\nError: Service temporarily unavailable. Please try again later."
        elif "timeout" in error_message.lower() or "deadline" in error_message.lower():
            # Handle timeout errors
            user_message = f"\n\nError: Request timed out. The response took too long to generate. Try a shorter prompt or try again later."
        elif "key" in error_message.lower() or "auth" in error_message.lower() or "credential" in error_message.lower():
            # Handle API key errors
            user_message = f"\n\nError: API key issue. Please check your API key and try again."
        elif "network" in error_message.lower() or "connection" in error_message.lower():
            # Handle network errors
            user_message = f"\n\nError: Network connection issue. Please check your internet connection and try again."
        else:
            # Generic error message with context about whether streaming started
            if not stream_started:
                user_message = f"\n\nError: Failed to start streaming response. {error_type}: {error_message}"
            else:
                user_message = f"\n\nError: Stream interrupted. {error_type}: {error_message}"

        # Return a user-friendly error message
        yield user_message
