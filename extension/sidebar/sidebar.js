// WebPage Chatter - Sidebar Script

// Import utilities
import { Config } from "../utils/config.js";
import { StorageUtils } from "../utils/storage.js";
import { APIUtils } from "../utils/api.js";
import { TTSUtils } from "../utils/tts.js";

// Configure marked.js options
marked.setOptions({
    breaks: true, // Add line breaks on single line breaks
    gfm: true, // Use GitHub Flavored Markdown
    headerIds: false, // Don't add IDs to headers
    mangle: false, // Don't mangle email links
    sanitize: false, // Don't sanitize HTML (handled by innerHTML)
    silent: true, // Don't throw errors
    smartLists: true, // Use smarter list behavior
    smartypants: true, // Use "smart" typographic punctuation
    xhtml: false, // Don't use XHTML-style self-closing tags
});

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const settingsButton = document.getElementById("settings-button");
const historyButton = document.getElementById("history-button");
const historyCount = document.getElementById("history-count");
const apiKeyMissing = document.getElementById("api-key-missing");
const openSettings = document.getElementById("open-settings");
const ttsControls = document.getElementById("tts-controls");
const ttsPlay = document.getElementById("tts-play");
const ttsPause = document.getElementById("tts-pause");
const ttsStop = document.getElementById("tts-stop");
const ttsSpeed = document.getElementById("tts-speed");
const saveControls = document.getElementById("save-controls");
const saveAnswer = document.getElementById("save-answer");
const viewSaved = document.getElementById("view-saved");
const savedAnswersModal = document.getElementById("saved-answers-modal");
const savedAnswersList = document.getElementById("saved-answers-list");
const closeModal = document.getElementById("close-modal");
const loadingIndicator = document.getElementById("loading-indicator");
const elapsedTimeElement = document.getElementById("elapsed-time");

// Suggested Questions Elements
const suggestedQuestionsContainer = document.getElementById(
    "suggested-questions-container"
);
const suggestedQuestionsList = document.getElementById(
    "suggested-questions-list"
);
const refreshSuggestionsButton = document.getElementById("refresh-suggestions");
const suggestedQuestionsLoading = document.getElementById(
    "suggested-questions-loading"
);
const suggestedQuestionsError = document.getElementById(
    "suggested-questions-error"
);

// Webpage info elements
const webpageTitle = document.getElementById("webpage-title");
const webpageUrl = document.getElementById("webpage-url");
const refreshIndicator = document.getElementById("refresh-indicator");
const manualRefreshButton = document.getElementById("manual-refresh-button");

// Chat History Elements
const chatHistoryModal = document.getElementById("chat-history-modal");
const closeHistoryModal = document.getElementById("close-history-modal");
const chatHistoryList = document.getElementById("chat-history-list");
const historySearch = document.getElementById("history-search");
const historySearchButton = document.getElementById("history-search-button");
const clearHistoryButton = document.getElementById("clear-history-button");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const storageUsage = document.getElementById("storage-usage");
const storageText = document.getElementById("storage-text");

// State variables
let pageContent = "";
let currentChatSession = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    pageUrl: "",
    pageTitle: "",
    messages: [],
};
let currentAssistantMessage = "";
let isProcessing = false;

// Timer variables
let processingStartTime = 0;
let processingTimerId = null;

// Chat history state
let chatHistory = [];
let filteredHistory = [];
let currentPage = 1;
let itemsPerPage = 5;
let totalPages = 1;
let currentSearchTerm = "";

// Suggested questions state
let suggestedQuestions = [];
let isFetchingSuggestions = false;

// Initialize the sidebar
document.addEventListener("DOMContentLoaded", async () => {
    // Check if API key is set
    const settings = await StorageUtils.getSettings();
    if (!settings.apiKey) {
        apiKeyMissing.classList.remove("hidden");
    }

    // Load TTS settings
    if (settings.ttsSpeed) {
        ttsSpeed.value = settings.ttsSpeed;
    }

    // Extract page content
    await extractPageContent();

    // Load chat history
    await loadChatHistory();

    // Update storage usage
    await updateStorageUsage();

    // Set up event listeners
    setupEventListeners();

    // Set up message listener for context refresh events
    setupMessageListeners();
});

/**
 * Set up message listeners for background script communication
 */
function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            case "refreshContext":
                // Handle context refresh request
                extractPageContent(true, message.reason)
                    .then(() => {
                        sendResponse({ success: true });
                    })
                    .catch((error) => {
                        console.error("Error refreshing context:", error);
                        sendResponse({
                            success: false,
                            error: error.message || "Failed to refresh context",
                        });
                    });
                return true; // Keep the message channel open for async response
        }
    });
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
    // Send button click
    sendButton.addEventListener("click", handleSendMessage);

    // Enter key in chat input
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            // If Ctrl+Enter is pressed, insert a line break
            if (event.ctrlKey) {
                // Don't submit the form
                event.preventDefault();

                // Get cursor position
                const cursorPos = chatInput.selectionStart;

                // Insert a newline at cursor position
                const textBefore = chatInput.value.substring(0, cursorPos);
                const textAfter = chatInput.value.substring(cursorPos);
                chatInput.value = textBefore + "\n" + textAfter;

                // Move cursor position after the inserted newline
                chatInput.selectionStart = chatInput.selectionEnd =
                    cursorPos + 1;
            }
            // If just Enter is pressed (without Ctrl or Shift), send the message
            else if (!event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
            }
        }
    });

    // History button click
    historyButton.addEventListener("click", () => {
        showChatHistory();
    });

    // Settings button click
    settingsButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openSettings" });
    });

    // Open settings button click
    openSettings.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openSettings" });
    });

    // Close history modal button click
    closeHistoryModal.addEventListener("click", () => {
        chatHistoryModal.classList.add("hidden");
    });

    // Click outside history modal to close
    window.addEventListener("click", (event) => {
        if (event.target === chatHistoryModal) {
            chatHistoryModal.classList.add("hidden");
        }
    });

    // History search
    historySearchButton.addEventListener("click", () => {
        searchChatHistory();
    });

    // History search on Enter key
    historySearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            searchChatHistory();
        }
    });

    // Clear history button click
    clearHistoryButton.addEventListener("click", () => {
        if (
            confirm(
                "Are you sure you want to clear all chat history? This action cannot be undone."
            )
        ) {
            clearAllChatHistory();
        }
    });

    // Pagination buttons
    prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayChatHistory();
        }
    });

    nextPageButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayChatHistory();
        }
    });

    // TTS controls
    ttsPlay.addEventListener("click", () => {
        TTSUtils.play();
        ttsPlay.classList.add("hidden");
        ttsPause.classList.remove("hidden");
    });

    ttsPause.addEventListener("click", () => {
        TTSUtils.pause();
        ttsPause.classList.add("hidden");
        ttsPlay.classList.remove("hidden");
    });

    ttsStop.addEventListener("click", () => {
        TTSUtils.stop();
        ttsPause.classList.add("hidden");
        ttsPlay.classList.remove("hidden");
    });

    ttsSpeed.addEventListener("change", async (event) => {
        const speed = parseFloat(event.target.value);
        TTSUtils.setRate(speed);
        await StorageUtils.saveSettings({ ttsSpeed: speed });
    });

    // Manual refresh button click
    manualRefreshButton.addEventListener("click", async () => {
        console.log("Manual refresh button clicked");
        await extractPageContent(true, "manual_refresh");
    });

    // Save answer button click
    saveAnswer.addEventListener("click", saveCurrentAnswer);

    // View saved button click
    viewSaved.addEventListener("click", showSavedAnswers);

    // Close modal button click
    closeModal.addEventListener("click", () => {
        savedAnswersModal.classList.add("hidden");
    });

    // Click outside modal to close
    window.addEventListener("click", (event) => {
        if (event.target === savedAnswersModal) {
            savedAnswersModal.classList.add("hidden");
        }
    });

    // Refresh suggestions button click
    refreshSuggestionsButton.addEventListener("click", () => {
        fetchSuggestedQuestions(true); // Force refresh
    });

    // Add click event listeners for suggested questions
    suggestedQuestionsList.addEventListener("click", (event) => {
        const questionElement = event.target.closest(".suggested-question");
        if (questionElement) {
            const question = questionElement.textContent;
            chatInput.value = question;
            handleSendMessage();
        }
    });

    // Add click event listeners for suggested questions
    suggestedQuestionsList.addEventListener("click", (event) => {
        const questionElement = event.target.closest(".suggested-question");
        if (questionElement) {
            const question = questionElement.textContent;
            chatInput.value = question;
            handleSendMessage();
        }
    });
}

/**
 * Extract content from the current webpage
 * @param {boolean} isRefresh - Whether this is a refresh of the context
 * @param {string} reason - The reason for the refresh (if applicable)
 */
async function extractPageContent(isRefresh = false, reason = "") {
    try {
        if (isRefresh) {
            // Show refresh indicator
            refreshIndicator.classList.remove("hidden");
        } else {
            loadingIndicator.classList.remove("hidden");
            // Start the processing timer
            startProcessingTimer();
        }

        // Request page content from content script
        const response = await chrome.runtime.sendMessage({
            action: "getPageContent",
        });

        if (response.success) {
            pageContent = response.content;

            // Update current chat session with page info
            const url = pageContent.split("URL: ")[1]?.split("\n\n")[0] || "";
            const title =
                pageContent.split("TITLE: ")[1]?.split("\n\n")[0] || "";

            currentChatSession.pageUrl = url;
            currentChatSession.pageTitle = title;

            // Update webpage info display
            updateWebpageInfo(title, url);

            // Add system message if this is a refresh
            if (isRefresh) {
                let refreshMessage;
                if (reason === "tab_switch") {
                    refreshMessage =
                        "Context updated: Switched to a different tab.";
                } else if (reason === "manual_refresh") {
                    refreshMessage =
                        "Context updated: Manually refreshed by user.";
                } else {
                    refreshMessage =
                        "Context updated: Page content has changed.";
                }
                addSystemMessage(refreshMessage);
            }

            // Fetch suggested questions based on the new content
            console.log(
                "Calling fetchSuggestedQuestions after extracting page content"
            );
            fetchSuggestedQuestions(isRefresh);
        } else {
            console.error("Failed to extract page content:", response.error);
            addSystemMessage(
                "Failed to extract page content. Please try refreshing the page."
            );
        }
    } catch (error) {
        console.error("Error extracting page content:", error);
        addSystemMessage("An error occurred while extracting page content.");
    } finally {
        if (!isRefresh) {
            loadingIndicator.classList.add("hidden");
            // Stop the processing timer
            stopProcessingTimer();
        } else {
            // Hide refresh indicator after a delay
            setTimeout(() => {
                refreshIndicator.classList.add("hidden");
            }, Config.NAVIGATION.REFRESH_INDICATOR_TIME);
        }
    }
}

/**
 * Update the webpage info display
 * @param {string} title - The webpage title
 * @param {string} url - The webpage URL
 */
function updateWebpageInfo(title, url) {
    webpageTitle.textContent = title || "Untitled Page";
    webpageUrl.textContent = url || "No URL available";

    // Set title attribute for tooltip on hover
    webpageTitle.title = title || "Untitled Page";
    webpageUrl.title = url || "No URL available";
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
    const query = chatInput.value.trim();

    if (!query || isProcessing) {
        return;
    }

    // Check if API key is set
    const settings = await StorageUtils.getSettings();
    if (!settings.apiKey) {
        apiKeyMissing.classList.remove("hidden");
        return;
    }

    isProcessing = true;
    loadingIndicator.classList.remove("hidden");
    // Start the processing timer
    startProcessingTimer();

    // Clear input
    chatInput.value = "";

    // Add user message to chat
    addUserMessage(query);

    // Add message to current chat session
    currentChatSession.messages.push({
        role: "user",
        content: query,
        timestamp: new Date().toISOString(),
    });

    try {
        // Prepare request data
        const requestData = {
            api_key: settings.apiKey,
            webpage_content: pageContent,
            query: query,
        };

        // Send chat request to background script
        const response = await chrome.runtime.sendMessage({
            action: "sendChatRequest",
            data: requestData,
        });

        if (response.success) {
            // Create message element for assistant response
            const messageElement = addAssistantMessage("");

            // Reset current assistant message
            currentAssistantMessage = "";

            // Add loading indicator to the message
            const loadingIndicator = document.createElement("div");
            loadingIndicator.className = "streaming-indicator";
            loadingIndicator.textContent = "Receiving response...";
            messageElement.appendChild(loadingIndicator);

            let responseSuccess = false;

            // Check if this is a non-streaming response
            if (response.isNonStreaming) {
                // Handle non-streaming response
                try {
                    // Set the complete text response
                    currentAssistantMessage = response.text;

                    // Update message element with Markdown rendering
                    if (
                        currentAssistantMessage &&
                        currentAssistantMessage.trim()
                    ) {
                        messageElement.innerHTML = marked.parse(
                            currentAssistantMessage
                        );
                    } else {
                        messageElement.textContent = currentAssistantMessage;
                    }

                    // Scroll to bottom
                    chatMessages.scrollTop = chatMessages.scrollHeight;

                    responseSuccess = true;
                } catch (error) {
                    console.error(
                        "Error processing non-streaming response:",
                        error
                    );
                    messageElement.textContent = "Error processing response.";
                    responseSuccess = false;
                }
            } else {
                // Process streaming response with retry capability (fallback for compatibility)
                responseSuccess = await processStreamingResponse(
                    response.reader,
                    messageElement
                );
            }

            // Remove the loading indicator
            if (loadingIndicator.parentNode === messageElement) {
                loadingIndicator.remove();
            }

            // Add message to current chat session
            currentChatSession.messages.push({
                role: "assistant",
                content: currentAssistantMessage,
                timestamp: new Date().toISOString(),
                responseCompleted: responseSuccess,
                isNonStreaming: response.isNonStreaming || false,
            });

            // Only show TTS and save controls if we have content
            if (currentAssistantMessage.trim().length > 0) {
                ttsControls.classList.remove("hidden");
                saveControls.classList.remove("hidden");

                // Set up TTS for the response
                TTSUtils.setText(currentAssistantMessage);

                // Automatically save chat session to history
                await saveChatSessionToHistory();
            }
        } else {
            console.error("Chat request failed:", response.error);
            addSystemMessage(`Error: ${response.error}`);
        }
    } catch (error) {
        console.error("Error sending chat request:", error);
        addSystemMessage("An error occurred while processing your request.");
    } finally {
        isProcessing = false;
        loadingIndicator.classList.add("hidden");
        // Stop the processing timer
        stopProcessingTimer();
    }
}

/**
 * Process streaming response from the API
 * Note: This function is kept for backward compatibility with streaming mode
 * @param {ReadableStreamDefaultReader} reader - The response reader
 * @param {HTMLElement} messageElement - The message element to update
 * @param {number} maxRetries - Maximum number of retry attempts (default: 2)
 * @returns {boolean} - Whether the streaming completed successfully
 */
async function processStreamingResponse(
    reader,
    messageElement,
    maxRetries = 2
) {
    const decoder = new TextDecoder();
    let retryCount = 0;
    let lastError = null;
    let streamSuccess = false;

    // Function to create retry button
    function createRetryButton() {
        const retryContainer = document.createElement("div");
        retryContainer.className = "retry-container";

        const retryButton = document.createElement("button");
        retryButton.className = "retry-button";
        retryButton.textContent = "Retry Connection";
        retryButton.addEventListener("click", async () => {
            // Remove the retry button
            retryContainer.remove();

            // Append "Retrying..." message
            const retryingText = document.createElement("div");
            retryingText.className = "retrying-text";
            retryingText.textContent = "Retrying connection...";
            messageElement.appendChild(retryingText);

            // Try to resume the stream
            try {
                // This is a simplified retry - in a real implementation,
                // you would need to store the original request and re-send it
                const settings = await StorageUtils.getSettings();
                const requestData = {
                    api_key: settings.apiKey,
                    webpage_content: pageContent,
                    query: currentChatSession.messages[
                        currentChatSession.messages.length - 2
                    ].content,
                };

                const response = await chrome.runtime.sendMessage({
                    action: "sendChatRequest",
                    data: requestData,
                });

                if (response.success) {
                    // Remove the retrying text
                    retryingText.remove();

                    // Process the new stream
                    await processStreamingResponse(
                        response.reader,
                        messageElement,
                        0
                    );
                } else {
                    retryingText.textContent = `Failed to retry: ${response.error}`;
                }
            } catch (error) {
                console.error("Error during retry:", error);
                retryingText.textContent = `Error during retry: ${error.message}`;
            }
        });

        retryContainer.appendChild(retryButton);
        messageElement.appendChild(retryContainer);
    }

    // Main streaming loop with retry logic
    while (retryCount <= maxRetries) {
        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    streamSuccess = true;
                    break;
                }

                // Decode and append chunk to message
                const chunk = decoder.decode(value, { stream: true });
                currentAssistantMessage += chunk;

                // Update message element with Markdown rendering
                if (currentAssistantMessage && currentAssistantMessage.trim()) {
                    messageElement.innerHTML = marked.parse(
                        currentAssistantMessage
                    );
                } else {
                    messageElement.textContent = currentAssistantMessage;
                }

                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            // If we got here without an error, break out of the retry loop
            break;
        } catch (error) {
            lastError = error;
            console.error(
                `Error processing streaming response (attempt ${
                    retryCount + 1
                }/${maxRetries + 1}):`,
                error
            );

            // If we've reached max retries, show the final error message
            if (retryCount >= maxRetries) {
                // Check if the error message contains details
                let errorMessage = "Stream interrupted.";

                // Add more specific error messages based on error type
                if (
                    error.name === "NetworkError" ||
                    error.message.includes("network")
                ) {
                    errorMessage =
                        "Stream interrupted due to network issues. Please check your internet connection.";
                } else if (error.name === "AbortError") {
                    errorMessage =
                        "Stream was aborted. This might be due to a timeout or server disconnection.";
                } else if (
                    error.name === "TypeError" &&
                    error.message.includes("fetch")
                ) {
                    errorMessage =
                        "Connection to the server failed. The server might be unavailable.";
                }

                // Append error message to the current content
                if (currentAssistantMessage && currentAssistantMessage.trim()) {
                    messageElement.innerHTML = marked.parse(
                        currentAssistantMessage
                    );
                } else {
                    messageElement.textContent = currentAssistantMessage;
                }

                // Add a paragraph with the error
                const errorParagraph = document.createElement("p");
                errorParagraph.className = "error-message";
                errorParagraph.textContent = `Error: ${errorMessage}`;
                messageElement.appendChild(errorParagraph);

                // Add retry button if appropriate
                if (error.name !== "AbortError") {
                    createRetryButton();
                }
            } else {
                // If we still have retries left, wait a bit and try again
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * (retryCount + 1))
                );
            }

            retryCount++;
        }
    }

    return streamSuccess;
}

/**
 * Add a user message to the chat
 * @param {string} message - The message text
 */
function addUserMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "chat-message user-message";

    const contentElement = document.createElement("div");
    contentElement.className = "message-content";
    contentElement.textContent = message;

    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Add an assistant message to the chat
 * @param {string} message - The message text
 * @returns {HTMLElement} - The message content element
 */
function addAssistantMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "chat-message assistant-message";

    // Create message header with TTS button
    const messageHeader = document.createElement("div");
    messageHeader.className = "message-header";

    // Create role label
    const roleLabel = document.createElement("div");
    roleLabel.className = "message-role";
    roleLabel.textContent = "Assistant:";
    messageHeader.appendChild(roleLabel);

    // Create TTS button
    const ttsButton = document.createElement("button");
    ttsButton.className = "message-tts-button";
    ttsButton.title = "Read aloud";
    ttsButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';

    // Add click event to TTS button
    ttsButton.addEventListener("click", async () => {
        // Get the message text
        const messageText = contentElement.textContent || "";

        // Get current TTS settings
        const settings = await StorageUtils.getSettings();

        // Apply TTS settings
        if (settings.ttsSpeed) {
            TTSUtils.setRate(parseFloat(settings.ttsSpeed));
        }

        if (settings.ttsVoiceURI) {
            await TTSUtils.setVoice(settings.ttsVoiceURI);
        }

        // Set up TTS with the message text
        TTSUtils.setText(messageText);
        TTSUtils.play();

        // Show TTS controls
        ttsControls.classList.remove("hidden");
    });

    messageHeader.appendChild(ttsButton);
    messageElement.appendChild(messageHeader);

    // Create content element
    const contentElement = document.createElement("div");
    contentElement.className = "message-content markdown-content";

    // Use marked.js to render Markdown if message is not empty
    if (message && message.trim()) {
        contentElement.innerHTML = marked.parse(message);
    } else {
        contentElement.textContent = message;
    }

    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return contentElement;
}

/**
 * Add a system message to the chat
 * @param {string} message - The message text
 */
function addSystemMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = "chat-message system-message";

    const contentElement = document.createElement("div");
    contentElement.className = "message-content";
    contentElement.textContent = message;

    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Save the current answer to storage
 */
async function saveCurrentAnswer() {
    if (!currentAssistantMessage) {
        return;
    }

    try {
        // Get saved answers from storage
        const savedAnswers = await StorageUtils.getSavedAnswers();

        // Add current chat session to saved answers
        savedAnswers.push(currentChatSession);

        // Save to storage
        await StorageUtils.saveSavedAnswers(savedAnswers);

        // Show confirmation
        addSystemMessage("Answer saved successfully.");
    } catch (error) {
        console.error("Error saving answer:", error);
        addSystemMessage("Failed to save answer.");
    }
}

/**
 * Show saved answers in modal
 */
async function showSavedAnswers() {
    try {
        // Get saved answers from storage
        const savedAnswers = await StorageUtils.getSavedAnswers();

        // Clear saved answers list
        savedAnswersList.innerHTML = "";

        if (savedAnswers.length === 0) {
            const noAnswersElement = document.createElement("div");
            noAnswersElement.className = "no-saved-answers";
            noAnswersElement.textContent = "No saved answers yet.";
            savedAnswersList.appendChild(noAnswersElement);
        } else {
            // Add saved answers to list
            savedAnswers.forEach((session, index) => {
                const sessionElement = document.createElement("div");
                sessionElement.className = "saved-session";

                const headerElement = document.createElement("div");
                headerElement.className = "saved-session-header";

                const titleElement = document.createElement("h3");
                titleElement.textContent = session.pageTitle || "Untitled Page";

                const dateElement = document.createElement("span");
                dateElement.className = "saved-date";
                dateElement.textContent = new Date(
                    session.timestamp
                ).toLocaleString();

                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.innerHTML = "&times;";
                deleteButton.title = "Delete";
                deleteButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    deleteSavedAnswer(index);
                });

                headerElement.appendChild(titleElement);
                headerElement.appendChild(dateElement);
                headerElement.appendChild(deleteButton);

                const contentElement = document.createElement("div");
                contentElement.className = "saved-session-content hidden";

                // Add messages to content
                session.messages.forEach((message) => {
                    const messageElement = document.createElement("div");
                    messageElement.className = `saved-message ${message.role}-message`;

                    const roleElement = document.createElement("div");
                    roleElement.className = "message-role";
                    roleElement.textContent =
                        message.role === "user" ? "You:" : "Assistant:";

                    const textElement = document.createElement("div");
                    textElement.className = "message-text";
                    textElement.textContent = message.content;

                    messageElement.appendChild(roleElement);
                    messageElement.appendChild(textElement);
                    contentElement.appendChild(messageElement);
                });

                // Toggle content visibility on header click
                headerElement.addEventListener("click", () => {
                    contentElement.classList.toggle("hidden");
                });

                sessionElement.appendChild(headerElement);
                sessionElement.appendChild(contentElement);
                savedAnswersList.appendChild(sessionElement);
            });
        }

        // Show modal
        savedAnswersModal.classList.remove("hidden");
    } catch (error) {
        console.error("Error showing saved answers:", error);
        addSystemMessage("Failed to load saved answers.");
    }
}

/**
 * Delete a saved answer
 * @param {number} index - The index of the answer to delete
 */
async function deleteSavedAnswer(index) {
    try {
        // Get saved answers from storage
        const savedAnswers = await StorageUtils.getSavedAnswers();

        // Remove answer at index
        savedAnswers.splice(index, 1);

        // Save to storage
        await StorageUtils.saveSavedAnswers(savedAnswers);

        // Refresh saved answers list
        showSavedAnswers();
    } catch (error) {
        console.error("Error deleting saved answer:", error);
        addSystemMessage("Failed to delete saved answer.");
    }
}

/**
 * Load chat history from storage
 */
async function loadChatHistory() {
    try {
        // Get chat history from storage
        chatHistory = await StorageUtils.getChatHistory();

        // Update history count badge
        updateHistoryCountBadge();

        // Initialize filtered history
        filteredHistory = [...chatHistory];

        // Calculate total pages
        totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

/**
 * Update the history count badge
 */
function updateHistoryCountBadge() {
    if (chatHistory.length > 0) {
        historyCount.textContent =
            chatHistory.length > 99 ? "99+" : chatHistory.length;
        historyCount.classList.remove("hidden");
    } else {
        historyCount.classList.add("hidden");
    }
}

/**
 * Save current chat session to history
 */
async function saveChatSessionToHistory() {
    try {
        // Only save if there are messages
        if (currentChatSession.messages.length > 0) {
            // Save to history
            await StorageUtils.saveChatToHistory(currentChatSession);

            // Reload chat history
            await loadChatHistory();

            // Update storage usage
            await updateStorageUsage();
        }
    } catch (error) {
        console.error("Error saving chat session to history:", error);
        // Show error message if storage is full
        if (error.message && error.message.includes("QUOTA_EXCEEDED")) {
            addSystemMessage(
                "Error: Storage quota exceeded. Please delete some chat history to continue."
            );
        }
    }
}

/**
 * Show chat history modal
 */
function showChatHistory() {
    // Reset search
    historySearch.value = "";
    currentSearchTerm = "";

    // Reset pagination
    currentPage = 1;

    // Reset filtered history
    filteredHistory = [...chatHistory];

    // Calculate total pages
    totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    // Display chat history
    displayChatHistory();

    // Show modal
    chatHistoryModal.classList.remove("hidden");
}

/**
 * Display chat history with pagination
 */
function displayChatHistory() {
    // Clear chat history list
    chatHistoryList.innerHTML = "";

    // Update pagination info
    updatePaginationInfo();

    // If no history, show message
    if (filteredHistory.length === 0) {
        const noHistoryElement = document.createElement("div");
        noHistoryElement.className = "no-saved-answers";
        noHistoryElement.textContent = currentSearchTerm
            ? "No matching conversations found."
            : "No chat history yet.";
        chatHistoryList.appendChild(noHistoryElement);
        return;
    }

    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(
        startIndex + itemsPerPage,
        filteredHistory.length
    );

    // Display items for current page
    for (let i = startIndex; i < endIndex; i++) {
        const session = filteredHistory[i];
        chatHistoryList.appendChild(createHistoryItem(session));
    }
}

/**
 * Create a history item element
 * @param {Object} session - The chat session
 * @returns {HTMLElement} - The history item element
 */
function createHistoryItem(session) {
    const itemElement = document.createElement("div");
    itemElement.className = "history-item";

    // Create header
    const headerElement = document.createElement("div");
    headerElement.className = "history-item-header";

    // Create title
    const titleElement = document.createElement("h3");
    titleElement.className = "history-item-title";
    titleElement.textContent = session.pageTitle || "Untitled Page";

    // Create date
    const dateElement = document.createElement("span");
    dateElement.className = "history-item-date";
    dateElement.textContent = new Date(session.timestamp).toLocaleString();

    // Create actions
    const actionsElement = document.createElement("div");
    actionsElement.className = "history-item-actions";

    // Create load chat button
    const loadButton = document.createElement("button");
    loadButton.className = "icon-button load-button";
    loadButton.title = "Load Chat";
    loadButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
    loadButton.addEventListener("click", (event) => {
        event.stopPropagation();
        loadHistoricalChat(session);
    });

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button";
    deleteButton.title = "Delete";
    deleteButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteChatSession(session.id);
    });

    actionsElement.appendChild(loadButton);
    actionsElement.appendChild(deleteButton);

    // Add elements to header
    headerElement.appendChild(titleElement);
    headerElement.appendChild(dateElement);
    headerElement.appendChild(actionsElement);

    // Create content container
    const contentElement = document.createElement("div");
    contentElement.className = "history-item-content hidden";

    // Add messages to content
    session.messages.forEach((message) => {
        const messageElement = document.createElement("div");
        messageElement.className = `saved-message ${message.role}-message`;

        const roleElement = document.createElement("div");
        roleElement.className = "message-role";
        roleElement.textContent =
            message.role === "user" ? "You:" : "Assistant:";

        const textElement = document.createElement("div");
        textElement.className = "message-text";

        // Use Markdown for assistant messages
        if (
            message.role === "assistant" &&
            message.content &&
            message.content.trim()
        ) {
            textElement.innerHTML = marked.parse(message.content);
        } else {
            textElement.textContent = message.content;
        }

        messageElement.appendChild(roleElement);
        messageElement.appendChild(textElement);
        contentElement.appendChild(messageElement);
    });

    // Toggle content visibility on header click
    headerElement.addEventListener("click", () => {
        contentElement.classList.toggle("hidden");
    });

    // Add elements to item
    itemElement.appendChild(headerElement);
    itemElement.appendChild(contentElement);

    return itemElement;
}

/**
 * Update pagination information
 */
function updatePaginationInfo() {
    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

    // Update button states
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

/**
 * Search chat history
 */
async function searchChatHistory() {
    const searchTerm = historySearch.value.trim();
    currentSearchTerm = searchTerm;

    if (searchTerm === "") {
        // Reset to full history
        filteredHistory = [...chatHistory];
    } else {
        // Search history
        filteredHistory = await StorageUtils.searchChatHistory(searchTerm);
    }

    // Reset pagination
    currentPage = 1;
    totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    // Display results
    displayChatHistory();
}

/**
 * Delete a chat session from history
 * @param {string} sessionId - The ID of the session to delete
 */
async function deleteChatSession(sessionId) {
    try {
        // Confirm deletion
        if (confirm("Are you sure you want to delete this conversation?")) {
            // Delete from storage
            await StorageUtils.deleteChatFromHistory(sessionId);

            // Reload chat history
            await loadChatHistory();

            // Update filtered history
            if (currentSearchTerm) {
                filteredHistory = await StorageUtils.searchChatHistory(
                    currentSearchTerm
                );
            } else {
                filteredHistory = [...chatHistory];
            }

            // Recalculate total pages
            totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

            // Adjust current page if needed
            if (currentPage > totalPages) {
                currentPage = Math.max(1, totalPages);
            }

            // Display updated history
            displayChatHistory();

            // Update storage usage
            await updateStorageUsage();
        }
    } catch (error) {
        console.error("Error deleting chat session:", error);
    }
}

/**
 * Clear all chat history
 */
async function clearAllChatHistory() {
    try {
        // Clear from storage
        await StorageUtils.clearChatHistory();

        // Reload chat history
        await loadChatHistory();

        // Reset filtered history
        filteredHistory = [];

        // Reset pagination
        currentPage = 1;
        totalPages = 1;

        // Display empty history
        displayChatHistory();

        // Update storage usage
        await updateStorageUsage();
    } catch (error) {
        console.error("Error clearing chat history:", error);
    }
}

/**
 * Load a historical chat session into the current chat interface
 * @param {Object} session - The historical chat session to load
 */
async function loadHistoricalChat(session) {
    try {
        // Close the history modal
        chatHistoryModal.classList.add("hidden");

        // Clear current chat messages
        chatMessages.innerHTML = "";

        // Create a deep copy of the session to avoid reference issues
        const sessionCopy = JSON.parse(JSON.stringify(session));

        // Update current chat session
        currentChatSession = sessionCopy;

        // Add system message indicating loaded chat
        addSystemMessage(
            `Loaded chat from ${new Date(session.timestamp).toLocaleString()}`
        );

        // Recreate all messages in the UI
        session.messages.forEach((message) => {
            if (message.role === "user") {
                addUserMessage(message.content);
            } else if (message.role === "assistant") {
                // Store the current assistant message for potential saving
                currentAssistantMessage = message.content;
                addAssistantMessage(message.content);
            }
        });

        // Add a visual indicator that this is a loaded chat
        const chatHeader = document.createElement("div");
        chatHeader.className = "loaded-chat-indicator";

        // Create the header content with icon and text
        const headerContent = document.createElement("div");
        headerContent.className = "loaded-chat-header-content";
        headerContent.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Historical Chat from ${new Date(
                session.timestamp
            ).toLocaleDateString()}</span>
        `;

        // Create a "New Chat" button to start a fresh chat
        const newChatButton = document.createElement("button");
        newChatButton.className = "button secondary small-button";
        newChatButton.textContent = "New Chat";
        newChatButton.addEventListener("click", () => {
            // Create a new chat session
            currentChatSession = {
                id: generateUUID(),
                timestamp: new Date().toISOString(),
                pageUrl: currentChatSession.pageUrl,
                pageTitle: currentChatSession.pageTitle,
                messages: [],
            };

            // Clear the chat interface
            chatMessages.innerHTML = "";

            // Add a system message
            addSystemMessage("Started a new chat session");

            // Reset current assistant message
            currentAssistantMessage = "";
        });

        // Add elements to the header
        chatHeader.appendChild(headerContent);
        chatHeader.appendChild(newChatButton);

        // Add the header to the chat interface
        chatMessages.prepend(chatHeader);

        console.log(`Loaded historical chat session: ${session.id}`);
    } catch (error) {
        console.error("Error loading historical chat:", error);
        addSystemMessage("Failed to load historical chat. Please try again.");
    }
}

/**
 * Update storage usage information
 */
async function updateStorageUsage() {
    try {
        // Get storage usage
        const usage = await StorageUtils.getStorageUsage();

        // Update storage bar
        storageUsage.style.width = `${usage.percentUsed * 100}%`;

        // Update storage text
        storageText.textContent = `Storage: ${usage.formattedUsed} / ${usage.formattedTotal}`;

        // Add warning class if near limit
        if (usage.percentUsed >= 0.9) {
            storageUsage.classList.add("danger");
        } else if (usage.percentUsed >= 0.7) {
            storageUsage.classList.add("warning");
            storageUsage.classList.remove("danger");
        } else {
            storageUsage.classList.remove("warning", "danger");
        }

        // Show warning if near limit
        if (usage.isNearLimit) {
            addSystemMessage(
                "Warning: Storage space is running low. Consider deleting some chat history."
            );
        }
    } catch (error) {
        console.error("Error updating storage usage:", error);
    }
}

/**
 * Generate a UUID for chat sessions
 * @returns {string} - A UUID string
 */
function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

/**
 * Start the processing timer
 */
function startProcessingTimer() {
    // Reset timer variables
    processingStartTime = Date.now();
    elapsedTimeElement.textContent = "0s";

    // Clear any existing timer
    if (processingTimerId) {
        clearInterval(processingTimerId);
    }

    // Start a new timer that updates every second
    processingTimerId = setInterval(() => {
        const elapsedSeconds = Math.floor(
            (Date.now() - processingStartTime) / 1000
        );
        elapsedTimeElement.textContent = `${elapsedSeconds}s`;
    }, 1000);
}

/**
 * Stop the processing timer
 */
function stopProcessingTimer() {
    if (processingTimerId) {
        clearInterval(processingTimerId);
        processingTimerId = null;
    }
}

/**
 * Fetch suggested questions based on the webpage content
 * @param {boolean} forceRefresh - Whether to force a refresh of suggestions
 */
async function fetchSuggestedQuestions(forceRefresh = false) {
    // Don't fetch if already fetching or if we already have suggestions and not forcing refresh
    if (
        isFetchingSuggestions ||
        (suggestedQuestions.length > 0 && !forceRefresh)
    ) {
        return;
    }

    // Check if API key is set
    const settings = await StorageUtils.getSettings();
    if (!settings.apiKey) {
        suggestedQuestionsError.textContent =
            "API key required to generate suggestions";
        suggestedQuestionsError.classList.remove("hidden");
        return;
    }

    // Check if we have page content
    if (!pageContent || pageContent.trim() === "") {
        suggestedQuestionsError.textContent =
            "No page content available for suggestions";
        suggestedQuestionsError.classList.remove("hidden");
        return;
    }

    try {
        isFetchingSuggestions = true;

        // Show loading indicator
        suggestedQuestionsLoading.classList.remove("hidden");
        suggestedQuestionsError.classList.add("hidden");

        // Clear existing questions if refreshing
        if (forceRefresh) {
            suggestedQuestionsList.innerHTML = "";
            suggestedQuestions = [];
        }

        // Prepare request data
        const requestData = {
            api_key: settings.apiKey,
            webpage_content: pageContent,
            count: 3, // Request 3 suggested questions
        };

        console.log("Sending request for suggested questions with data:", {
            api_key: "REDACTED",
            webpage_content_length: pageContent.length,
            count: requestData.count,
        });

        // Send request to get suggested questions
        const response = await APIUtils.getSuggestedQuestions(requestData);

        console.log("Received suggested questions response:", response);

        if (
            response.success &&
            response.questions &&
            response.questions.length > 0
        ) {
            // Store the questions
            suggestedQuestions = response.questions;
            console.log("Storing suggested questions:", suggestedQuestions);

            // Display the questions
            displaySuggestedQuestions(suggestedQuestions);

            // Show the container
            suggestedQuestionsContainer.classList.remove("hidden");
        } else {
            console.error("Failed to get valid suggested questions:", response);
            // Show error message
            suggestedQuestionsError.textContent =
                response.error || "Failed to generate suggestions";
            suggestedQuestionsError.classList.remove("hidden");

            // Make sure the container is visible so the error is shown
            suggestedQuestionsContainer.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Error fetching suggested questions:", error);
        suggestedQuestionsError.textContent =
            "Error generating suggestions: " + (error.message || error);
        suggestedQuestionsError.classList.remove("hidden");

        // Make sure the container is visible so the error is shown
        suggestedQuestionsContainer.classList.remove("hidden");
    } finally {
        isFetchingSuggestions = false;
        suggestedQuestionsLoading.classList.add("hidden");
    }
}

/**
 * Display suggested questions in the UI
 * @param {Array} questions - Array of question strings
 */
function displaySuggestedQuestions(questions) {
    // Clear the list
    suggestedQuestionsList.innerHTML = "";

    // Add each question as a button
    questions.forEach((question) => {
        const questionElement = document.createElement("button");
        questionElement.className = "suggested-question";
        questionElement.textContent = question;
        suggestedQuestionsList.appendChild(questionElement);
    });
}
