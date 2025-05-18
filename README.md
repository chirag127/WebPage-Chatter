# WebPage Chatter

A browser extension that allows users to engage in a conversational chat with the content of any active webpage using Google's Gemini AI.

## Overview

WebPage Chatter is a powerful browser extension that enables users to ask questions about the content of any webpage they're viewing. The extension extracts the textual content, metadata, and other relevant information from the page and uses the Gemini AI API to provide intelligent responses to user queries.

## Features

-   **Chat with Any Webpage**: Ask questions about the content of any webpage you're viewing.
-   **Comprehensive Content Extraction**: Extracts text, metadata, URL, title, and image alt text from webpages.
-   **Gemini AI Integration**: Powered by Google's Gemini AI models for intelligent responses.
-   **Text-to-Speech**: Listen to AI responses with customizable voice and speed settings.
-   **Save Important Answers**: Save useful chat interactions for future reference.
-   **Multiple Activation Methods**: Open the sidebar via toolbar icon, context menu, or keyboard shortcut.
-   **User-Provided API Key**: Use your own Gemini API key for complete control over usage.
-   **Cross-Browser Compatibility**: Works on Chrome, Firefox, and Edge.

## Installation

### Prerequisites

-   Node.js (v14 or higher)
-   npm (v6 or higher)
-   A Gemini API key from Google AI Studio

### Backend Setup

1. Clone the repository:

    ```
    git clone https://github.com/chirag127/WebPage-Chatter.git
    cd WebPage-Chatter
    ```

2. Install backend dependencies:

    ```
    cd backend
    pip install -r requirements.txt
    ```

3. Run the backend server:
    ```
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

### Extension Setup

1. Install extension dependencies and generate icons:

    ```
    cd extension
    npm install --save-dev sharp
    node ../scripts/generate-pngs.js
    ```

2. Load the extension in your browser:

    - **Chrome**:

        - Go to `chrome://extensions/`
        - Enable "Developer mode"
        - Click "Load unpacked" and select the `extension` folder

    - **Firefox**:

        - Go to `about:debugging#/runtime/this-firefox`
        - Click "Load Temporary Add-on" and select any file in the `extension` folder

    - **Edge**:
        - Go to `edge://extensions/`
        - Enable "Developer mode"
        - Click "Load unpacked" and select the `extension` folder

3. Configure the extension:
    - Click on the extension icon and go to Settings
    - Enter your Gemini API key
    - Adjust TTS settings as desired

## Usage

1. Navigate to any webpage you want to chat about.
2. Open the WebPage Chatter sidebar using one of these methods:
    - Click the extension icon in the toolbar
    - Right-click on the page and select "Chat with this page"
    - Use the keyboard shortcut (Ctrl+Shift+C or Command+Shift+C on Mac)
3. Type your question in the input field and press Enter or click the send button.
4. View the AI's response in the chat.
5. Optionally:
    - Use the TTS controls to have the response read aloud
    - Save important answers for future reference
    - Adjust TTS speed as needed

## Project Structure

-   `extension/`: Contains all browser extension code

    -   `manifest.json`: Extension configuration
    -   `background/`: Background scripts
    -   `content/`: Content scripts for webpage interaction
    -   `sidebar/`: Sidebar UI for chat interface
    -   `settings/`: Settings page
    -   `utils/`: Utility functions
    -   `assets/`: Images and styles
    -   `icons/`: Extension icons

-   `backend/`: Contains all backend FastAPI server code

    -   `main.py`: Application entry point
    -   `app/`: Application modules
        -   `api/`: API routes
        -   `core/`: Core functionality
        -   `services/`: Service modules
        -   `models/`: Data models

-   `scripts/`: Contains utility scripts

    -   `generate-pngs.js`: Script to generate PNG icons from SVG source
    -   `generate-landing-page-icons.js`: Script to generate icons for the landing page

-   `index.html` & `privacy-policy.html`: GitHub Pages website files

## GitHub Pages Website

Visit our [GitHub Pages website](https://chirag127.github.io/WebPage-Chatter) for more information about the extension and our privacy policy.

## Development

### Backend Development

The backend is built with FastAPI and handles communication with the Gemini API. It provides endpoints for:

-   Processing chat requests
-   Streaming responses from Gemini
-   Health checks

#### Gemini Integration

The backend uses the official Google Generative AI Python library to interact with the Gemini API. Here's a simplified example of how the integration works:

```python
# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.5-flash-preview-04-17"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="Your question here"),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()
```

### Extension Development

The extension consists of several components:

-   **Background Script**: Handles extension activation and communication between components
-   **Content Script**: Extracts webpage content
-   **Sidebar UI**: Provides the chat interface
-   **Settings Page**: Allows configuration of API key and TTS settings
-   **Utility Modules**: Handle storage, TTS, API communication, and content extraction

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chirag Singhal (GitHub: [chirag127](https://github.com/chirag127))

## Acknowledgments

-   Google Gemini API for providing the AI capabilities
-   FastAPI for the backend framework
-   The browser extension APIs that make this possible

---

Last Updated: May 18, 2025
