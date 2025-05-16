# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from google import genai
from google.genai import types

async def get_gemini_response_stream(user_api_key, model_name, input_text_parts):
    """
    Get a streaming response from the Gemini API.

    Args:
        user_api_key: The user's Gemini API key.
        model_name: The name of the Gemini model to use.
        input_text_parts: The input text parts to send to the Gemini API.

    Yields:
        str: Chunks of text from the Gemini API response.
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

        # Configure response generation
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/plain",
        )

        # Stream the response
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                yield chunk.text

    except Exception as e:
        # Handle Gemini API errors
        error_message = f"Error from Gemini API: {str(e)}"
        yield f"Error: {error_message}"
