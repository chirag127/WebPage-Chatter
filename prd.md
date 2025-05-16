**WebPage Chatter - Product Requirements Document (PRD)**

**Document Version:** 1.0
**Last Updated:** [current date]
**Owner:** Chirag Singhal
**Status:** Final
**Prepared for:** Augment Code Assistant
**Prepared by:** Chirag Singhal (CTO Guidance)

---

**Instructions for AI Code Assistant:**
*   This document outlines the requirements for the "WebPage Chatter" browser extension.
*   **Contextual Understanding:** Utilize the `context7 mcp` server to gather contextual information about the current task, including relevant libraries, frameworks, and APIs. Use it to understand the latest updates and documentation for any third-party API integration or new library/framework usage.
*   **Problem Decomposition:** Employ the `sequentialthinking mcp` server to break down complex problems into manageable, sequential steps for implementation.
*   **Information Retrieval:** Use the `websearch` tool to find information on the internet regarding best practices, specific API documentation, or troubleshooting.
*   **Project Structure:**
    *   `extension/`: Contains all browser extension code (manifest, content scripts, background scripts, popup/sidebar UI).
    *   `backend/`: Contains all backend FastAPI server code.
*   The goal is to build the final, polished version of the product as described.

---

**1. Introduction & Overview**

*   **1.1. Purpose:**
    To create a browser extension, "WebPage Chatter," that allows users to engage in a conversational chat with the content of any active webpage. The extension will leverage the Gemini AI API (via a user-provided API key) to understand and respond to user queries about the page's content.

*   **1.2. Problem Statement:**
    Users often need to quickly understand, query, or interact with the information presented on a webpage without manually sifting through all the text. Existing tools may not offer a comprehensive chat experience that includes all page elements (like metadata, URL context) or provide features like Text-to-Speech (TTS) for answers. This extension aims to provide a seamless and intelligent way to "talk" to webpages.

**2. Goals & Objectives**

*   **2.1. Business Goals:**
    *   Provide a valuable tool for users to enhance their web browsing and information consumption efficiency.
    *   Empower users by allowing them to use their own AI model API keys, giving them control over usage.

*   **2.2. Product Goals:**
    *   Enable users to chat with the full textual content of any webpage.
    *   Provide clear, AI-generated answers based on the webpage context.
    *   Offer TTS functionality for answers with customizable settings.
    *   Allow users to save important chat interactions locally.
    *   Ensure ease of use through multiple activation methods and a clean UI.
    *   Securely manage user-provided API keys.

**3. Scope**

*   **3.1. In Scope:**
    *   Browser extension (Chrome, Firefox, Edge compatible).
    *   Sidebar UI for chat interaction.
    *   Extraction of comprehensive webpage content (text, title, URL, meta tags, etc.).
    *   Integration with Gemini API via a backend proxy.
    *   User-provided Gemini API key management (input in extension settings).
    *   Primary AI Model: `gemini-2.5-flash-preview-04-17`.
    *   Fallback AI Model: `gemini-2.0-flash-lite` (if primary model's input token limit for the current request is reached, e.g., >200k tokens).
    *   Text-to-Speech (TTS) for AI responses using browser's built-in capabilities.
    *   TTS settings: speed (0.25x - 16x), voice selection.
    *   Saving chat answers/sessions to browser local storage.
    *   Extension activation: toolbar icon, context menu, keyboard shortcut.
    *   Settings page for API key and TTS configuration.
    *   Backend API (FastAPI) to handle communication with Gemini.

*   **3.2. Out of Scope:**
    *   User accounts or server-side storage of user data (beyond ephemeral session data for processing).
    *   Chat history synchronization across different browsers (beyond what browser's native `storage.sync` might offer for settings).
    *   Advanced analytics or tracking of user behavior.
    *   Commercialization features (e.g., subscription models).
    *   Support for non-textual content chat (e.g., analyzing images or videos directly beyond alt text).

**4. User Personas & Scenarios**

*   **4.1. Key User Persona: The Efficient Researcher (Alex)**
    *   **Description:** Alex is a student/professional who spends a lot of time reading articles, documentation, and various web content for research. Alex needs to quickly find specific information or get summaries without reading everything end-to-end.
    *   **Goals:** Save time, improve comprehension, easily extract key points.

*   **4.2. Key User Scenarios / Use Cases:**
    *   **UC1: Quick Question about Page Content:** Alex is on a long news article. Alex opens the WebPage Chatter sidebar, types "What are the main conclusions of this article?", and gets a concise answer from the AI, which can also be read aloud.
    *   **UC2: Understanding Technical Terms:** While reading technical documentation, Alex encounters a term specific to the page. Alex asks the chat "Explain [term] in the context of this page."
    *   **UC3: Accessing Meta-Information:** Alex wants to know the author or publication date if not immediately visible. Alex asks "Who wrote this page?" or "When was this published?" and the AI uses meta tags or page content to answer.
    *   **UC4: Configuring Settings:** Alex navigates to the extension's settings page to enter their Gemini API key and adjust the TTS voice speed to their preference.
    *   **UC5: Saving Useful Information:** Alex receives a particularly insightful answer from the AI and clicks "Save Answer" to store it in local browser storage for later reference.
    *   **UC6: Activating the Extension:** Alex uses their preferred method (toolbar click, right-click, or keyboard shortcut) to quickly open the sidebar on a new page.

**5. User Stories**
*(Illustrative - detailed breakdown by AI assistant)*
*   **US1:** As a user, I want to open a sidebar on any webpage so that I can chat with its content.
*   **US2:** As a user, I want the extension to extract all relevant text, metadata, URL, and title from the current page to provide context for the chat.
*   **US3:** As a user, I want to type questions into the sidebar and receive answers generated by the Gemini AI based on the page content.
*   **US4:** As a user, I want to be able to have the AI's answers read aloud to me.
*   **US5:** As a user, I want to control the speed and voice of the Text-to-Speech feature.
*   **US6:** As a user, I want to securely enter and store my Gemini API key in the extension settings.
*   **US7:** As a user, I want the extension to use a primary Gemini model and switch to a fallback model if the content is too large for the primary model.
*   **US8:** As a user, I want to save useful AI answers or chat sessions locally in my browser.
*   **US9:** As a user, I want to activate the extension via a toolbar icon, a context menu option, or a keyboard shortcut.
*   **US10:** As a user, I want to see clear error messages if something goes wrong (e.g., API key invalid, network error).

**6. Functional Requirements (FR)**

*   **6.1. Extension Core & UI**
    *   **FR1.1: Sidebar Interface:** The extension shall provide a sidebar UI that can be toggled open/closed.
    *   **FR1.2: Activation Methods:**
        *   **FR1.2.1:** Users must be able to open the sidebar by clicking the extension's toolbar icon.
        *   **FR1.2.2:** Users must be able to open the sidebar by right-clicking on a webpage and selecting an option from the context menu.
        *   **FR1.2.3:** Users must be able to open/close the sidebar using a configurable keyboard shortcut.
    *   **FR1.3: Chat Display:** The sidebar shall display the conversation history (user queries and AI responses) for the current session.
    *   **FR1.4: Input Field:** The sidebar shall include a text input field for users to type their questions.

*   **6.2. Content Processing & AI Interaction**
    *   **FR2.1: Webpage Content Extraction:** Upon activation, the extension must extract relevant textual content from the active webpage. This includes:
        *   Visible text (paragraphs, headings, lists, tables).
        *   Page title.
        *   Page URL.
        *   Meta tags (description, keywords, author if available).
        *   Image alt text.
        *   (Exclusion: Scripts, style elements, non-renderable content).
    *   **FR2.2: Backend API Communication:** The extension shall send the extracted content and user query to the backend FastAPI server.
    *   **FR2.3: Gemini API Call (Backend):** The backend server will use the user-provided API key to make requests to the Gemini API.
        *   The backend must use the following Python structure for Gemini integration:
            ```python
            # To run this code you need to install the following dependencies:
            # pip install google-genai

            import base64
            import os
            from google import genai
            from google.genai import types

            # API key will be passed from the extension to the backend per request,
            # or fetched from a secure configuration if the backend manages keys (not for this version)
            # For this project, API_KEY is provided by the user and sent with each request from extension.

            def get_gemini_response_stream(user_api_key, model_name, input_text_parts):
                # It's crucial to handle the API key securely.
                # For user-provided keys, this function will be called with the key.
                client = genai.Client(api_key=user_api_key)

                model_to_use = model_name # e.g., "gemini-2.5-flash-preview-04-17"
                contents = [
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=part) for part in input_text_parts], # input_text_parts can be [web_page_content, user_query]
                    ),
                ]
                generate_content_config = types.GenerateContentConfig(
                    response_mime_type="text/plain", # Expecting text responses
                )

                # Stream the response
                for chunk in client.models.generate_content_stream(
                    model=model_to_use,
                    contents=contents,
                    config=generate_content_config,
                ):
                    yield chunk.text
            ```
    *   **FR2.4: AI Model Selection (Backend):**
        *   The primary model is `gemini-2.5-flash-preview-04-17`.
        *   The backend should estimate the token count of the input (extracted page content + query).
        *   If the estimated token count exceeds 200,000 tokens (or the effective limit for `gemini-2.5-flash-preview-04-17`), the backend shall switch to the `gemini-2.0-flash-lite` model for that request.
    *   **FR2.5: Streaming Responses:** AI responses should be streamed from the backend to the extension's sidebar to display text as it's generated.

*   **6.3. Text-to-Speech (TTS)**
    *   **FR3.1: TTS Functionality:** Users shall be able to trigger TTS for AI-generated responses.
    *   **FR3.2: TTS Controls:** Play, Pause buttons for TTS.
    *   **FR3.3: TTS Settings (Speed):** Users can adjust TTS speed from 0.25x to 16x (actual range to be tested for usability, 0x implies off).
    *   **FR3.4: TTS Settings (Voice):** Users can select from available system voices provided by the browser's `SpeechSynthesis` API.

*   **6.4. Settings Page**
    *   **FR4.1: Access to Settings:** The extension must provide a settings page, accessible from the extension (e.g., via toolbar icon menu or from sidebar).
    *   **FR4.2: API Key Configuration:** Users must be able to input and save their Gemini API key. The key should be validated superficially (e.g., not empty).
    *   **FR4.3: TTS Configuration:** Users can configure default TTS speed and preferred voice on the settings page.

*   **6.5. Data Storage**
    *   **FR5.1: API Key Storage:** The Gemini API key shall be stored securely using `chrome.storage.sync` (preferred for syncing across user's browsers if they are signed in) or `chrome.storage.local`.
    *   **FR5.2: Settings Storage:** TTS preferences (speed, voice) shall be stored using `chrome.storage.sync` or `chrome.storage.local`.
    *   **FR5.3: Chat Answer Saving:** Users must be able to save individual AI responses or entire chat sessions.
    *   **FR5.4: Saved Data Storage:** Saved chat data will be stored in `chrome.storage.local`.
    *   **FR5.5: View Saved Answers:** (Implicit) A mechanism to view/manage saved answers (basic implementation: display list, allow deletion).

*   **6.6. Error Handling**
    *   **FR6.1: API Key Errors:** Display a clear message if the API key is invalid or missing.
    *   **FR6.2: Network Errors:** Inform the user about network connectivity issues affecting backend communication.
    *   **FR6.3: Gemini API Errors:** Relay errors from the Gemini API (e.g., rate limits, content policy violations) to the user in a user-friendly way.
    *   **FR6.4: Content Extraction Errors:** Handle cases where page content cannot be fully extracted, possibly with a notification.

**7. Non-Functional Requirements (NFR)**
*   **7.1. Performance:**
    *   Sidebar should load quickly (<1-2 seconds).
    *   Webpage content extraction should be efficient and not noticeably slow down page interaction.
    *   AI response streaming should provide immediate feedback.
*   **7.2. Scalability (Backend):**
    *   Backend API (FastAPI on PaaS) should handle concurrent requests from multiple users efficiently. The PaaS choice should allow for easy scaling.
*   **7.3. Usability:**
    *   Clean, intuitive, and minimalist UI.
    *   Easy to discover features.
    *   Clear feedback for user actions.
*   **7.4. Reliability / Availability:**
    *   Extension should function consistently across supported websites.
    *   Backend service should aim for high availability.
*   **7.5. Security:**
    *   User's Gemini API key must be handled securely: stored appropriately on the client-side and transmitted securely (HTTPS) to the backend. The backend should not log API keys.
    *   Content scripts must use minimal necessary permissions and sanitize any data used to interact with the DOM (if applicable, though primary interaction is data extraction).
    *   Backend should sanitize all inputs.
*   **7.6. Accessibility:**
    *   Aim for WCAG 2.1 Level AA compliance for the extension's UI (sidebar, settings). Provide ARIA attributes where necessary. Keyboard navigability for sidebar and settings.
*   **7.7. Browser Compatibility:**
    *   Target latest versions of Chrome, Firefox, and Edge using WebExtension APIs.

**8. High-Level Technical Stack & Architecture**

*   **8.1. Frontend (Browser Extension - `extension/` folder):**
    *   HTML, CSS, JavaScript.
    *   WebExtension APIs (for storage, context menus, sidebar, content scripts, background scripts).
    *   No specific JS framework mandated, but can use a lightweight one if it simplifies development (e.g., Preact, Svelte, or vanilla JS).
*   **8.2. Backend (`backend/` folder):**
    *   Python 3.x.
    *   FastAPI framework.
    *   Hosted on a Platform-as-a-Service (PaaS) (e.g., Google Cloud Run, AWS Lambda + API Gateway, Heroku, Vercel).
*   **8.3. AI Service:**
    *   Google Gemini API (via `google-genai` Python library).
*   **8.4. Architecture Overview:**
    1.  User activates extension sidebar on a webpage.
    2.  Content script extracts page content, sends to background script.
    3.  Background script (or sidebar directly) sends content + user query + API key to the backend API.
    4.  Backend API validates request, selects Gemini model, calls Gemini API with user's key.
    5.  Backend streams Gemini response back to the extension.
    6.  Extension sidebar displays streamed response. TTS can be initiated.

**9. Conceptual Data Model**

*   **9.1. User Settings (stored in `chrome.storage.sync` or `local`):**
    *   `apiKey`: string (encrypted or handled by secure browser storage)
    *   `ttsSpeed`: float (e.g., 1.0)
    *   `ttsVoiceURI`: string (URI of the selected voice)
*   **9.2. Saved Chat Session (example structure, stored in `chrome.storage.local`):**
    *   `id`: string (unique ID for the session)
    *   `timestamp`: ISO string
    *   `pageUrl`: string
    *   `pageTitle`: string
    *   `messages`: array of objects:
        *   `role`: "user" | "assistant"
        *   `content`: string
        *   `timestamp`: ISO string

**10. User Interface Design Principles**

*   **Clarity:** Easy to understand what's happening and how to use the features.
*   **Efficiency:** Enable users to achieve their goals quickly.
*   **Consistency:** Maintain a consistent look and feel across the sidebar and settings.
*   **Minimalism:** Avoid clutter; focus on essential information and controls.
*   **Feedback:** Provide immediate visual feedback for actions (e.g., sending query, TTS playing).

**11. Open Issues / Future Considerations**

*   **11.1. Open Issues (to be addressed during development):**
    *   Determining the most robust and comprehensive method for webpage content extraction across diverse site structures.
    *   Fine-tuning the token estimation logic for Gemini model switching.
    *   Ensuring TTS voice selection is user-friendly across different browsers and OS platforms.
    *   Specific UI for managing/viewing saved chat answers.
*   **11.2. Future Enhancements (Post-Launch):**
    *   More advanced summarization presets (e.g., "bullet points," "one paragraph").
    *   Option to edit the extracted page content before sending to AI.
    *   Export chat history (e.g., as .txt or .md).
    *   Support for custom prompts/instructions to guide the AI.
    *   Highlighting text on the webpage that corresponds to the AI's answer.

**12. Potential Challenges & Mitigation**

*   **Challenge:** Variability in webpage structures affecting content extraction.
    *   **Mitigation:** Use robust parsing libraries, iterative improvements based on testing across diverse websites. Focus on common HTML structures first.
*   **Challenge:** Gemini API rate limits or errors.
    *   **Mitigation:** Implement clear error handling and user feedback. Backend to manage retries where appropriate. Advise users on managing their own API key usage.
*   **Challenge:** Maintaining cross-browser compatibility.
    *   **Mitigation:** Adhere closely to WebExtension standards. Test thoroughly on target browsers.
*   **Challenge:** User API key security.
    *   **Mitigation:** Use `chrome.storage.sync` or `local` which are designed for this. Transmit over HTTPS. Backend should not store or log keys.

**13. Document History / Revisions**
*   **Version 1.0 (Current Date):** Initial draft based on product idea.

---