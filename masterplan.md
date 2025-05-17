
# Masterplan for WebPage Chatter Extension

Document Version: 1.0
Owner: Chirag Singhal
Status: final
Prepared for: augment code assistant
Prepared by: Chirag Singhal

---

## Project Overview
WebPage Chatter is a browser extension designed to enhance web browsing by allowing users to interactively "chat" with the content of any webpage. Upon activation, a sidebar appears, enabling users to ask questions about the page's text, URL, title, and meta information. The backend, built with FastAPI (Python) and deployed on a PaaS (Google Cloud Run), leverages the Google Gemini API to generate answers. Users must provide their own Gemini API key via the extension's settings.

Key features include text-to-speech (TTS) for answers, with user-configurable settings for voice, speed (0-16x), and pitch. The extension also allows users to save chat interactions to their browser's local storage for later reference. Activation methods include a toolbar icon, a context menu option, and a customizable keyboard shortcut. The system is designed to switch to a fallback Gemini model if token limits are encountered with the primary model.

## Project Goals
- To provide users with a powerful tool to quickly understand, summarize, and query information from any webpage through a natural language interface.
- To enhance accessibility and user experience by integrating text-to-speech functionality with customizable voice output.
- To deliver a seamless and intuitive user experience across major web browsers (Chrome, Firefox, Edge) with multiple convenient activation methods.
- To empower users by allowing them to use their own Gemini API keys, ensuring transparency in AI usage.

## Technical Stack
- **Frontend (Extension)**:
    - HTML5, CSS3, Vanilla JavaScript
    - Content Extraction: Mozilla Readability.js
    - Text-to-Speech: Browser's `window.speechSynthesis` API
    - Storage: `chrome.storage.sync` (for settings), `chrome.storage.local` (for saved chats)
    - Target Browsers: Google Chrome, Mozilla Firefox, Microsoft Edge (Chromium-based)
- **Backend**:
    - Framework: FastAPI (Python)
    - AI Integration: Google Gemini API (`gemini-2.5-flash-preview-04-17` with fallback to `gemini-2.0-flash-lite`)
- **Database**: Not applicable in the traditional sense. Data storage is client-side via browser extension APIs.
- **Deployment (Backend)**: Google Cloud Run (containerized deployment)

## Project Scope
### In Scope
-   **IS1:** Browser Extension Development: Compatible with Chrome, Firefox, and Edge.
-   **IS2:** Sidebar Interface: For displaying chat, input fields, and controls.
-   **IS3:** Multiple Activation Methods:
    -   Clicking a browser toolbar icon.
    -   Right-clicking on the page and selecting an option from the context menu.
    -   Configurable keyboard shortcut (via browser's native extension shortcut settings).
-   **IS4:** Content Extraction:
    -   Extraction of main readable content using Readability.js.
    -   Extraction of page URL, title, and meta description tags.
    -   Combination of extracted text and metadata to form context for AI.
-   **IS5:** Backend Service:
    -   FastAPI application to handle requests from the extension.
    -   Securely receive and use user's Gemini API key per request.
    -   Interface with Google Gemini API.
-   **IS6:** Gemini API Integration:
    -   Primary model: `gemini-2.5-flash-preview-04-17`.
    -   Fallback model: `gemini-2.0-flash-lite` if the primary model call fails due to token limits (e.g., input context too large for the primary model).
    -   Streaming responses from Gemini to the extension.
-   **IS7:** Text-to-Speech (TTS):
    -   Convert AI-generated text answers to speech using `window.speechSynthesis`.
    -   TTS controls: voice selection, speed (0-16x range), pitch.
-   **IS8:** Settings Page:
    -   Input field for user's Gemini API key.
    -   Controls for TTS settings (voice, speed, pitch).
    -   Option to enable/disable automatic saving of chats.
    -   Button to clear all saved chats.
    -   Security/cost warning regarding API key usage.
-   **IS9:** Chat Saving:
    -   Option to save question-answer pairs to `chrome.storage.local`.
    -   Simple list display of saved chats within the sidebar.
-   **IS10:** User Feedback:
    -   Loading indicators during content processing and AI response generation.
    -   Clear error messages for API issues or other failures.
    -   Notification if extracted page content is very limited.
-   **IS11:** SPA Handling:
    -   A "Refresh Content" button in the sidebar for users to manually re-analyze content on SPAs or dynamically changing pages.

### Out of Scope
-   **OS1:** Safari browser support (initial version).
-   **OS2:** Advanced chat history management (e.g., cloud synchronization, tagging, advanced search beyond simple listing).
-   **OS3:** User accounts or server-side authentication (relies on user-provided API key).
-   **OS4:** Automatic content re-analysis for Single Page Applications without user interaction.
-   **OS5:** Direct analysis of image, video, or other non-textual multimedia content by Gemini.
-   **OS6:** Team-based features or collaboration.
-   **OS7:** Proactive suggestions or summarization without user query.

## Functional Requirements

### FR1: Extension Core & Activation
-   **FR1.1:** The extension must be installable on Google Chrome, Mozilla Firefox, and Microsoft Edge.
-   **FR1.2:** The extension shall provide a toolbar icon. Clicking this icon toggles the visibility of the chat sidebar.
-   **FR1.3:** The extension shall add an option to the browser's context menu (right-click on a webpage) to open the chat sidebar.
-   **FR1.4:** The extension shall support a keyboard shortcut to toggle the chat sidebar. This shortcut should be configurable through the browser's standard extension shortcut settings page (e.g., `chrome://extensions/shortcuts`).
-   **FR1.5:** The sidebar shall overlay the current webpage content without disrupting the page layout excessively. It should be dismissible.

### FR2: Content Processing & Chat Interface
-   **FR2.1:** Upon activation, the extension's content script shall extract the main readable text content from the current webpage using Readability.js.
-   **FR2.2:** The content script shall also extract the page's URL, title, and primary meta description tag.
-   **FR2.3:** The extracted text and metadata shall be sent to the backend service when a user submits a query.
-   **FR2.4:** The sidebar shall display a chat interface with a text input field for user queries and an area for displaying the conversation history (user queries and AI responses for the current session).
-   **FR2.5:** The user shall be able to type questions related to the webpage content into the input field and submit them.
-   **FR2.6:** AI responses from the backend shall be displayed in the chat interface, clearly attributed to the AI.
-   **FR2.7:** If extracted content is minimal, a message should inform the user that the context for chat is limited.
-   **FR2.8:** A "Refresh Content" button shall be available in the sidebar to re-trigger content extraction for the current page, useful for SPAs or dynamically updated content.

### FR3: Backend & Gemini API Integration
-   **FR3.1:** The FastAPI backend server must expose an API endpoint to receive page content data, user query, and the user's Gemini API key from the extension.
-   **FR3.2:** The backend must use the provided user's Gemini API key to initialize the Gemini client for each request. The API key must not be stored on the server.
-   **FR3.3:** The backend shall first attempt to use the `gemini-2.5-flash-preview-04-17` model.
-   **FR3.4:** If the Gemini API returns an error indicating a token limit issue with the primary model for the given input, the backend shall automatically retry the request using the `gemini-2.0-flash-lite` model.
-   **FR3.5:** The backend shall stream the Gemini API's response back to the extension to allow for progressive display of the answer.
-   **FR3.6:** The backend must handle potential errors from the Gemini API (e.g., key invalid, quota exceeded, network issues) and return appropriate error messages to the extension.
-   **FR3.7:** The Gemini API interaction code provided by the user (adapted for FastAPI, dynamic API key, and streaming) will be used.

### FR4: Text-to-Speech (TTS)
-   **FR4.1:** Each AI-generated answer in the chat shall have an option (e.g., a speaker icon) to initiate TTS playback of that answer.
-   **FR4.2:** The extension shall use the browser's `window.speechSynthesis` API for TTS.
-   **FR4.3:** Users shall be able to control TTS playback (e.g., play, pause, stop).
-   **FR4.4:** TTS settings (voice, speed, pitch) configured in the settings page shall apply to all TTS playback.
-   **FR4.5:** TTS speed must be adjustable from 0.0x (interpreted as very slow, e.g., 0.1x minimum for API) up to 16.0x. The UI should map this to the typical `SpeechSynthesisUtterance.rate` range (0.1 to 10), ensuring a usable experience.

### FR5: Settings Management
-   **FR5.1:** The extension shall have a dedicated settings page/section accessible from the sidebar.
-   **FR5.2:** Users must be able to input and save their Google Gemini API key. This key will be stored using `chrome.storage.sync`.
-   **FR5.3:** The settings page shall include a clear warning about API key security and potential usage costs associated with the Gemini API.
-   **FR5.4:** Users shall be able to select their preferred TTS voice from the list of available voices provided by `window.speechSynthesis.getVoices()`.
-   **FR5.5:** Users shall be able to adjust TTS speed (0-16x visual range, mapped to API limits) and pitch (e.g., 0-2 range). These settings will be stored using `chrome.storage.sync`.
-   **FR5.6:** Users shall have an option to enable/disable automatic saving of chat Q&A. Stored in `chrome.storage.sync`.
-   **FR5.7:** Users shall have a button to clear all locally saved chat history (`chrome.storage.local`).

### FR6: Chat Saving & History
-   **FR6.1:** If enabled in settings, successfully generated AI answers and their corresponding questions shall be automatically saved to `chrome.storage.local`.
-   **FR6.2:** Saved data for each item shall include the page URL, page title, user's question, AI's answer, and a timestamp.
-   **FR6.3:** The sidebar shall feature a section or tab to view a list of saved chats, displaying them in reverse chronological order.
-   **FR6.4:** Users should be able to delete individual saved chat items.

## Non-Functional Requirements (NFR)
-   **NFR1. Performance:**
    -   **NFR1.1:** Sidebar should load and respond to user interactions within 500ms.
    -   **NFR1.2:** Content extraction from an average webpage should complete within 2 seconds.
    -   **NFR1.3:** API response time (excluding Gemini processing time) from the backend should be under 300ms for 95% of requests.
    -   **NFR1.4:** TTS playback should start within 1 second of user initiation.
-   **NFR2. Scalability (Backend):**
    -   **NFR2.1:** The backend deployed on Google Cloud Run must be configured to autoscale to handle at least 100 concurrent users without significant degradation in performance.
-   **NFR3. Usability:**
    -   **NFR3.1:** The UI must be intuitive and require minimal learning curve for new users.
    -   **NFR3.2:** All interactive elements must have clear visual feedback (hover, active, focus states).
    -   **NFR3.3:** Error messages must be user-friendly and provide guidance where possible.
-   **NFR4. Compatibility:**
    -   **NFR4.1:** The extension must function consistently across the latest two stable versions of Google Chrome, Mozilla Firefox, and Microsoft Edge (Chromium).
-   **NFR5. Security:**
    -   **NFR5.1:** The user's Gemini API key must be stored securely using `chrome.storage.sync` and only transmitted over HTTPS to the backend.
    -   **NFR5.2:** The backend must not log or persist the user's Gemini API key.
    -   **NFR5.3:** Web content sent to the backend should be handled as potentially untrusted data; ensure no injection vulnerabilities.
-   **NFR6. Maintainability:**
    -   **NFR6.1:** Code must be well-commented, modular, and follow SOLID, DRY, KISS principles.
    -   **NFR6.2:** Configuration (e.g., API endpoint URLs) should be centralized.
-   **NFR7. Accessibility:**
    -   **NFR7.1:** The extension sidebar UI should strive for WCAG 2.1 Level AA compliance, including keyboard navigability, sufficient color contrast, and ARIA attributes where necessary.
    -   **NFR7.2:** TTS functionality inherently aids accessibility.

## Project Structure
```
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app definition, routes
│   │   ├── services/
│   │   │   └── gemini_service.py # Logic for Gemini API interaction, model fallback
│   │   └── models/
│   │       └── chat_models.py    # Pydantic models for API requests/responses
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example            # Example environment variables (if any for server config)
├── extension/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── popup/                  # (If a separate popup is needed, else sidebar is main UI)
│   │   ├── popup.html
│   │   └── popup.js
│   ├── sidebar/
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.js          # Main logic for sidebar UI, chat, TTS, settings access
│   ├── settings/
│   │   ├── settings.html
│   │   ├── settings.css
│   │   └── settings.js         # Logic for settings page
│   ├── background.js           # Background scripts (context menu, keyboard shortcuts, message passing)
│   ├── content_script.js       # Injected into web pages (content extraction, sidebar injection)
│   └── common/
│       ├── readability.js      # Readability.js library
│       └── storage_service.js  # Wrapper for chrome.storage API
├── README.md
├── CHANGELOG.md
└── .gitignore
```

## Implementation Plan

### Phase 1: Setup & Foundation (1 Week)
-   **Task 1.1:** Initialize project structure, Git repository.
-   **Task 1.2:** Develop basic browser extension scaffolding (`manifest.json`, background script, content script).
-   **Task 1.3:** Implement basic sidebar injection and UI (HTML/CSS shell).
-   **Task 1.4:** Setup FastAPI backend project structure.
-   **Task 1.5:** Create Dockerfile for backend and test local containerization.
-   **Task 1.6:** Basic API endpoint on backend for health check / initial communication test from extension.

### Phase 2: Core Chat Functionality (2 Weeks)
-   **Task 2.1:** Implement content extraction logic (Readability.js, metadata) in `content_script.js`.
-   **Task 2.2:** Implement communication from content script to background script, then to sidebar UI.
-   **Task 2.3:** Develop the chat UI in the sidebar (message display, input field).
-   **Task 2.4 (Backend):** Implement `/api/chat` endpoint in FastAPI.
-   **Task 2.5 (Backend):** Integrate Gemini API call (using user-provided key passed from extension) into the backend, initially with `gemini-2.5-flash-preview-04-17`. Use the provided Python script as a base, adapting it for FastAPI, dynamic API key, and streaming.
-   **Task 2.6 (Backend):** Implement streaming response from FastAPI to the extension.
-   **Task 2.7:** Connect sidebar UI to backend for sending queries and receiving streamed responses.
-   **Task 2.8 (Backend):** Implement Gemini model fallback logic (`gemini-2.0-flash-lite` on token limit error).

### Phase 3: TTS and Settings (1.5 Weeks)
-   **Task 3.1:** Implement Text-to-Speech functionality using `window.speechSynthesis` in the sidebar.
-   **Task 3.2:** Design and implement the Settings page/UI (HTML, CSS, JS).
-   **Task 3.3:** Implement API key input and storage (`chrome.storage.sync`).
-   **Task 3.4:** Implement TTS settings controls (voice, speed, pitch) and storage.
-   **Task 3.5:** Implement "Refresh Content" button functionality.
-   **Task 3.6:** Add security/cost warnings for API key usage.

### Phase 4: Chat Saving & Activation Methods (1 Week)
-   **Task 4.1:** Implement chat saving feature (`chrome.storage.local`).
-   **Task 4.2:** Implement UI for viewing and deleting saved chats.
-   **Task 4.3:** Implement settings for toggling auto-save and clearing all saved chats.
-   **Task 4.4:** Implement toolbar icon activation.
-   **Task 4.5:** Implement context menu activation.
-   **Task 4.6:** Implement keyboard shortcut activation (manifest declaration, handling in background script).

### Phase 5: Testing, Refinement & Documentation (1.5 Weeks)
-   **Task 5.1:** Cross-browser testing (Chrome, Firefox, Edge) and bug fixing.
-   **Task 5.2:** UI/UX refinement based on testing.
-   **Task 5.3:** Implement comprehensive error handling and user feedback messages.
-   **Task 5.4:** Write/update `README.md` with setup, usage, and contribution guidelines.
-   **Task 5.5:** Create `CHANGELOG.md`.
-   **Task 5.6 (Backend):** Prepare backend for Google Cloud Run deployment (e.g., `gcloud`ignore files, service configuration).
-   **Task 5.7:** Final code review and cleanup.
-   **Task 5.8:** Prepare extension package for submission to web stores (if applicable).

## API Endpoints (Backend)
-   **`POST /api/chat`**
    -   **Description:** Receives webpage content context, user's query, and user's Gemini API key. Returns a streamed response from the Gemini API.
    -   **Request Body (JSON):**
        ```json
        {
            "apiKey": "USER_GEMINI_API_KEY",
            "pageContent": "Extracted text content from the webpage...",
            "pageUrl": "https://example.com/article",
            "pageTitle": "Example Article Title",
            "pageMetaDescription": "Optional: Meta description of the page...",
            "userQuery": "What is this page about?"
        }
        ```
    -   **Response:**
        -   `200 OK`: `text/event-stream` (StreamingResponse) with chunks of text from Gemini.
            Each chunk could be a simple string or a JSON object like `{"text": "chunk of text"}`.
        -   `400 Bad Request`: Invalid input (e.g., missing API key, query).
        -   `401 Unauthorized`: Invalid Gemini API key.
        -   `429 Too Many Requests`: Rate limits specific to the user's key (from Gemini).
        -   `500 Internal Server Error`: Backend or Gemini API error.
    -   **Streaming Content:** The provided Python script `client.models.generate_content_stream` will be used. Each `chunk.text` will be sent as part of the stream.

## Data Models (Extension Storage)

### `UserSettings` (stored in `chrome.storage.sync`)
-   `geminiApiKey`: `string` - User's Google Gemini API key.
-   `ttsVoiceURI`: `string` - URI of the selected `SpeechSynthesisVoice`.
-   `ttsSpeed`: `number` - Playback speed (e.g., 0.1 to 10, UI shows 0-16x).
-   `ttsPitch`: `number` - Playback pitch (e.g., 0 to 2).
-   `autoSaveChats`: `boolean` - Whether to automatically save chats.

### `SavedChatItem` (array of these stored in `chrome.storage.local` under a key like `savedChats`)
-   `id`: `string` - Unique identifier for the chat item (e.g., UUID or timestamp-based).
-   `pageUrl`: `string` - URL of the webpage the chat pertains to.
-   `pageTitle`: `string` - Title of the webpage.
-   `question`: `string` - The user's question.
-   `answer`: `string` - The AI's answer.
-   `timestamp`: `string` - ISO 8601 timestamp of when the chat was saved.

## Environment Variables
### Backend (`backend/.env.example`, for local development if needed, or GCR service configuration)
```
# FastAPI server settings (often managed by PaaS like Google Cloud Run)
# HOST=0.0.0.0
# PORT=8080
# LOG_LEVEL=info

# No GEMINI_API_KEY here as it's provided per-request by the user's extension.
```
### Extension
No traditional environment variables. Configuration like backend URL will be hardcoded or managed within the extension's JavaScript constants.

## Testing Strategy
-   **Unit Testing:**
    -   Backend: Use `pytest` for FastAPI business logic, especially `gemini_service.py`. Mock Gemini API calls.
    -   Frontend: Use a testing library like Jest (if complexity warrants it, otherwise manual testing for vanilla JS) for utility functions (e.g., storage_service.js).
-   **Integration Testing:**
    -   Test communication between extension components (content script, background, sidebar).
    -   Test extension-to-backend API calls with a test backend or mocked responses.
    -   Test actual Gemini API integration with a valid test key during development.
-   **End-to-End (E2E) Testing:**
    -   Manually test core user flows on all target browsers (Chrome, Firefox, Edge).
    -   Automated E2E tests using tools like Puppeteer or Playwright could be considered for key scenarios if time permits.
-   **User Acceptance Testing (UAT):**
    -   Internal testing by the developer simulating real user scenarios.
    -   (Optional) Beta testing with a small group of users.

## Deployment Strategy
### Backend (FastAPI on Google Cloud Run)
1.  Containerize the FastAPI application using the `Dockerfile`.
2.  Push the container image to Google Container Registry (GCR) or Artifact Registry.
3.  Deploy the image to Google Cloud Run, configuring:
    -   Public accessibility (or appropriate IAM for restricted access if extension authenticates itself - not planned).
    -   Autoscaling settings.
    -   No server-side environment variable for `GEMINI_API_KEY` as it comes from client.
    -   Any other necessary environment variables for server configuration (e.g., `LOG_LEVEL`).
4.  Set up CI/CD pipeline (e.g., using GitHub Actions) to automate build and deployment on code changes to the main branch.
### Frontend (Browser Extension)
1.  Package the extension files (HTML, CSS, JS, manifest.json, icons) into a .zip file.
2.  Manually upload to browser web stores (Chrome Web Store, Firefox Add-ons, Microsoft Edge Add-ons).
3.  Follow store-specific review processes.
4.  Automate packaging process with a script.

## Maintenance Plan
-   **Monitoring:**
    -   Backend: Monitor Google Cloud Run for errors, latency, and instance counts. Set up alerts for high error rates or downtime.
    -   Frontend: Rely on user feedback and browser store developer dashboards for error reporting.
-   **Updates & Bug Fixes:**
    -   Regularly update dependencies (Python packages, JS libraries like Readability.js).
    -   Address reported bugs and release updates through browser web stores.
    -   Keep up-to-date with changes in browser extension APIs and Gemini API.
-   **Security:**
    -   Periodically review security best practices for browser extensions and FastAPI.
    -   Address any security vulnerabilities found in dependencies or custom code.
-   **Documentation:**
    -   Keep `README.md` and `CHANGELOG.md` updated with each release.

## Risks and Mitigations
| Risk                                      | Impact | Likelihood | Mitigation                                                                                                                               |
|-------------------------------------------|--------|------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **R1:** Gemini API Key Security           | High   | Medium     | Store key using `chrome.storage.sync`. Clear warnings to user. Transmit over HTTPS. Backend does not store key.                               |
| **R2:** Gemini API Costs                  | Medium | Medium     | User provides their own key. Clear warnings about potential costs. No default key provided by the extension.                                 |
| **R3:** Gemini API Changes/Deprecation    | Medium | Low        | Monitor Gemini API announcements. Design backend service layer to abstract Gemini calls, allowing easier adaptation.                       |
| **R4:** Inconsistent Web Page Structures  | Medium | High       | Use robust Readability.js for main content. Handle cases where extraction yields little content gracefully. Allow manual refresh.          |
| **R5:** Browser API Incompatibilities     | Medium | Medium     | Target modern APIs common across Chrome/Firefox/Edge. Test thoroughly. Use feature detection if necessary for minor differences.             |
| **R6:** Performance on Large Pages        | Low    | Medium     | Optimize content script. Readability.js is generally performant. Inform user if processing takes time. Stream responses.                  |
| **R7:** Token Limits with Gemini Models   | Medium | Medium     | Implement model fallback logic. Clearly indicate to users if a less capable model is used. Educate users on prompt engineering for brevity. |
| **R8:** PaaS Backend Downtime/Issues      | Medium | Low        | Choose a reliable PaaS like Google Cloud Run. Implement basic error handling in extension for backend unavailability.                        |

## Future Enhancements
-   **FE1:** Support for Safari browser.
-   **FE2:** Advanced chat history: search, tagging, export.
-   **FE3:** User-configurable prompts or "personas" for the AI.
-   **FE4:** Option to select specific DOM elements for chat context instead of whole page.
-   **FE5:** Summarization feature (e.g., "Summarize this page in 3 bullet points").
-   **FE6:** Integration with other AI models or services.
-   **FE7:** Translation of webpage content or AI responses.
-   **FE8:** Dark mode for the sidebar UI.

## Conclusion
The WebPage Chatter extension offers a significant enhancement to web interaction by integrating conversational AI directly into the browsing experience. By leveraging the user's Gemini API key, it provides a personalized and powerful tool for understanding web content. The plan outlines a phased development approach, focusing on core functionality first, followed by TTS, settings, and other refinements. Adherence to the technical stack, development guidelines, and a proactive approach to risks will be key to delivering a high-quality, useful, and maintainable product.

---

## Development Guidelines

### Code Quality & Design Principles

-   Follow industry-standard coding best practices (clean code, modularity, error handling, security, scalability)
-   Apply SOLID, DRY (via abstraction), and KISS principles
-   Design modular, reusable components/functions
-   Optimize for code readability and maintainable structure
-   Add concise, useful function-level comments
-   Implement comprehensive error handling (try-catch, custom errors, async handling)

### Frontend Development

-   Provide modern, clean, professional, and intuitive UI designs
-   Adhere to UI/UX principles (clarity, consistency, simplicity, feedback, accessibility/WCAG)
-   Use appropriate CSS frameworks/methodologies (e.g., Tailwind, BEM - for this project, vanilla CSS with BEM-like naming is suitable given the choice of Vanilla JS).

### React Native Guidelines (if applicable)
- Not applicable for this browser extension project.

### Data Handling & APIs

-   Integrate with real, live data sources and APIs as specified or implied (Gemini API).
-   Prohibit placeholder, mock, or dummy data/API responses in the final code (except for unit/integration tests).
-   The user's Gemini API key is accepted via extension settings and sent with each request to the backend.
-   The backend must use this key to interact with the Gemini API.
-   Use `.env` files for local backend secrets/config (if any, e.g., `LOG_LEVEL`) with a template `.env.example` file.
-   Centralize all API endpoint URLs (backend URL for the extension) in a single location (config constants module in extension).
-   Never hardcode API endpoint URLs directly in service/component files.

### Asset Generation

-   Do not use placeholder images or icons.
-   Create necessary graphics (e.g., extension icons) as SVG and convert to PNG using a library like `sharp` or an online tool. Store final PNGs in `extension/icons/`.
-   No build scripts for asset generation are strictly necessary for simple icon conversion if done manually once.

### Documentation Requirements

-   Create a comprehensive README.md including project overview, setup instructions (for both extension and backend local development), usage guide, and other essential information.
-   Maintain a CHANGELOG.md to document changes using semantic versioning.
-   Document required API keys/credentials clearly (i.e., user needs their own Gemini API key, how to get it, and where to put it in settings).
-   Ensure all documentation is well-written, accurate, and reflects the final code.

---

## Tool Usage Instructions

### MCP Servers and Tools

-   Use the context7 MCP server to gather contextual information about the current task, including relevant libraries, frameworks, and APIs

-   Use the clear thought MCP servers for various problem-solving approaches:

    -   `mentalmodel_clear_thought`: For applying structured problem-solving approaches (First Principles Thinking, Opportunity Cost Analysis, Error Propagation Understanding, Rubber Duck Debugging, Pareto Principle, Occam's Razor)

    -   `designpattern_clear_thought`: For applying software architecture and implementation patterns (Modular Architecture, API Integration Patterns, State Management, Asynchronous Processing, Scalability Considerations, Security Best Practices, Agentic Design Patterns)

    -   `programmingparadigm_clear_thought`: For applying different programming approaches (Imperative Programming, Procedural Programming, Object-Oriented Programming, Functional Programming, Declarative Programming, Logic Programming, Event-Driven Programming, Aspect-Oriented Programming, Concurrent Programming, Reactive Programming)

    -   `debuggingapproach_clear_thought`: For systematic debugging of technical issues (Binary Search, Reverse Engineering, Divide and Conquer, Backtracking, Cause Elimination, Program Slicing)

    -   `collaborativereasoning_clear_thought`: For simulating expert collaboration with diverse perspectives and expertise (Multi-persona problem-solving, Diverse expertise integration, Structured debate and consensus building, Perspective synthesis)

    -   `decisionframework_clear_thought`: For structured decision analysis and rational choice theory (Structured decision analysis, Multiple evaluation methodologies, Criteria weighting, Risk and uncertainty handling)

    -   `metacognitivemonitoring_clear_thought`: For tracking knowledge boundaries and reasoning quality (Metacognitive Monitoring, Knowledge boundary assessment, Claim certainty evaluation, Reasoning bias detection, Confidence calibration, Uncertainty identification)

    -   `scientificmethod_clear_thought`: For applying formal scientific reasoning to questions and problems (Structured hypothesis testing, Variable identification, Prediction formulation, Experimental design, Evidence evaluation)

    -   `structuredargumentation_clear_thought`: For dialectical reasoning and argument analysis (Thesis-antithesis-synthesis, Argument strength analysis, Premise evaluation, Logical structure mapping)

    -   `visualreasoning_clear_thought`: For visual thinking, problem-solving, and communication (Diagrammatic representation, Visual problem-solving, Spatial relationship analysis, Conceptual mapping, Visual insight generation)

    -   `sequentialthinking_clear_thought`: For breaking down complex problems into manageable steps (Structured thought process, Revision and branching support, Progress tracking, Context maintenance)

-   Use the date and time MCP server:

    -   Use `getCurrentDateTime_node` tool to get the current date and time in UTC format
    -   Add last updated date and time in UTC format to the `README.md` file

-   Use the websearch tool to find information on the internet when needed

### System & Environment Considerations

-   Target system: Windows 11 Home Single Language 23H2
-   Use semicolon (`;`) as the command separator in PowerShell commands, not `&&`
-   Use `New-Item -ItemType Directory -Path "path1", "path2", ... -Force` for creating directories in PowerShell
-   Use language-native path manipulation libraries (e.g., Node.js `path` for JS parts, Python `os.path` or `pathlib` for backend) for robust path handling
-   Use package manager commands via the launch-process tool to add dependencies; do not edit package.json or requirements.txt directly (unless instructed for specific contents).

### Error Handling & Debugging

-   First attempt to resolve errors autonomously using available tools
-   Perform systematic debugging: consult web resources, documentation, modify code, adjust configuration, retry
-   Report back only if an insurmountable blocker persists after exhausting all self-correction efforts

```