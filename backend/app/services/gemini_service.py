# To run this code you need to install the following dependencies:
# pip install google-genai tenacity

import asyncio
import json
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

        # Configure response generation with plain text and no thinking budget
        # Note: We'll still render as Markdown on the frontend
        generate_content_config = types.GenerateContentConfig(
            thinking_config = types.ThinkingConfig(
                thinking_budget=0,
            ),
            response_mime_type="text/plain",
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

    # Configure response generation with timeout and no thinking budget
    generate_content_config = types.GenerateContentConfig(
        thinking_config = types.ThinkingConfig(
            thinking_budget=0,
        ),
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

async def generate_question_suggestions(user_api_key: str, model_name: str, webpage_content: str, count: int = 5) -> List[str]:
    """
    Generate suggested questions based on webpage content.

    Args:
        user_api_key: The user's Gemini API key.
        model_name: The name of the Gemini model to use.
        webpage_content: The content of the webpage.
        count: Number of questions to generate (default: 5).

    Returns:
        List[str]: A list of suggested questions.
    """
    try:
        # Initialize Gemini client with user's API key
        client = genai.Client(api_key=user_api_key)

        # Create a prompt for generating questions
        prompt = f"""
        Based on the following webpage content, generate {count} relevant and diverse questions that a user might want to ask.

        The questions should:
        1. Be directly related to the content of the webpage
        2. Include a mix of question types (e.g., summarization, explanation, comparison, analysis)
        3. Be clear, concise, and specific
        4. Avoid redundancy or overlap between questions
        5. Be phrased in natural, conversational language

        Format your response as a JSON array of strings containing only the questions.

        WEBPAGE CONTENT:
        {webpage_content}

        QUESTIONS:
        """

        # Prepare content for Gemini API
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]

        # Configure response generation with no thinking budget
        generate_content_config = types.GenerateContentConfig(
            thinking_config = types.ThinkingConfig(
                thinking_budget=0,
            ),
            response_mime_type="text/plain",
        )

        # Use the retry decorator for the API call
        @gemini_retry_decorator()
        def get_content():
            return client.models.generate_content(
                model=model_name,
                contents=contents,
                config=generate_content_config,
            )

        # Get the complete response
        response = get_content()
        response_text = response.text.strip()

        # Try to parse the response as JSON
        try:
            # Check if the response is already in JSON format
            if response_text.startswith("[") and response_text.endswith("]"):
                questions = json.loads(response_text)
            else:
                # Try to extract JSON array from the response text
                # Look for text between square brackets
                import re
                json_match = re.search(r'\[(.*?)\]', response_text, re.DOTALL)
                if json_match:
                    # Try to parse the extracted text as JSON
                    questions = json.loads(f"[{json_match.group(1)}]")
                else:
                    # If no JSON array found, split by newlines and clean up
                    questions = [q.strip() for q in response_text.split('\n') if q.strip()]
                    # Remove any numbering (e.g., "1.", "2.", etc.)
                    questions = [re.sub(r'^\d+[\.\)]\s*', '', q) for q in questions]
                    # Remove any quotes
                    questions = [q.strip('"\'') for q in questions]
        except json.JSONDecodeError:
            # If JSON parsing fails, split by newlines and clean up
            questions = [q.strip() for q in response_text.split('\n') if q.strip()]
            # Remove any numbering (e.g., "1.", "2.", etc.)
            import re
            questions = [re.sub(r'^\d+[\.\)]\s*', '', q) for q in questions]
            # Remove any quotes
            questions = [q.strip('"\'') for q in questions]

        # Limit to the requested count
        questions = questions[:count]

        # Ensure we have at least one question
        if not questions:
            questions = ["What is this webpage about?"]

        return questions

    except Exception as e:
        # Handle all exceptions with specific error messages based on error type
        error_type = type(e).__name__
        error_message = str(e)

        # Log the error
        logger.error(f"Error generating question suggestions: {error_type}: {error_message}")

        # Return default questions if there's an error
        return [
            "What is this webpage about?",
            "Can you summarize the key points?",
            "What are the main topics discussed?",
            "How does this information relate to current events?",
            "What are the implications of this content?"
        ]
