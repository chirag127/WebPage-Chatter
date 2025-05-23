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
const savedAnswersModal = document.getElementById("saved-answers-modal");
const savedAnswersList = document.getElementById("saved-answers-list");
const closeModal = document.getElementById("close-modal");
const loadingIndicator = document.getElementById("loading-indicator");
const elapsedTimeElement = document.getElementById("elapsed-time");
const cancelRequestButton = document.getElementById("cancel-request");

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
let currentRequestId = null;

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

    // TTS settings loading removed

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

    // TTS controls removed

    // Manual refresh button click
    manualRefreshButton.addEventListener("click", async () => {
        console.log("Manual refresh button clicked");
        await extractPageContent(true, "manual_refresh");
    });

    // Cancel request button click
    cancelRequestButton.addEventListener("click", () => {
        console.log("Cancel request button clicked");
        if (isProcessing && currentRequestId) {
            // Send cancel request to background script
            chrome.runtime.sendMessage(
                {
                    action: "cancelRequest",
                    requestId: currentRequestId,
                },
                (response) => {
                    if (response && response.success) {
                        console.log("Request cancelled successfully");
                        // The request will be cleaned up in the API response handler
                    } else {
                        console.error("Failed to cancel request");
                    }
                }
            );
        }
    });

    // Save and view buttons removed

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

    // Add click event listener for suggested questions
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
        // Generate a unique request ID for this chat request
        currentRequestId = `chat_${generateUUID()}`;

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
            requestId: currentRequestId,
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

            // TTS and save controls removed
            if (currentAssistantMessage.trim().length > 0) {
                // Automatically save chat session to history
                await saveChatSessionToHistory();

                // Regenerate suggested questions based on the conversation context
                // Only do this if we have at least one user-assistant exchange
                if (currentChatSession.messages.length >= 2) {
                    try {
                        // Regenerate suggested questions with conversation context
                        await fetchSuggestedQuestions(true, true);
                    } catch (suggestionError) {
                        console.error(
                            "Error regenerating suggested questions:",
                            suggestionError
                        );
                        // Don't show an error message to the user, just log it
                    }
                }
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
        // Clear the current request ID
        currentRequestId = null;
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
        // If already speaking, toggle play/pause
        if (TTSUtils.isSpeaking()) {
            const isPlaying = TTSUtils.togglePlayPause();

            // Update button appearance based on state
            if (isPlaying) {
                ttsButton.classList.remove("tts-paused");
                ttsButton.title = "Pause speech";
            } else {
                ttsButton.classList.add("tts-paused");
                ttsButton.title = "Resume speech";
            }
            return;
        }

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

        // Create the utterance
        TTSUtils.createUtterance();

        // Set up event listeners for TTS events before playing
        setupTTSHighlighting(contentElement, messageElement);

        // Add event listener for when speech ends
        TTSUtils.utterance.onend = function () {
            ttsButton.title = "Read aloud";
            ttsButton.classList.remove("tts-paused");
        };

        // Play the TTS
        TTSUtils.play();

        // Update button state
        ttsButton.title = "Pause speech";
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
 * Set up TTS highlighting for a message
 * @param {HTMLElement} contentElement - The message content element
 * @param {HTMLElement} messageElement - The message element
 */
function setupTTSHighlighting(contentElement, messageElement) {
    // Remove any existing highlights
    const existingHighlights = contentElement.querySelectorAll(
        ".tts-highlight, .tts-active"
    );
    existingHighlights.forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
            // Replace the highlight span with its text content
            parent.replaceChild(document.createTextNode(el.textContent), el);
            // Normalize the parent to merge adjacent text nodes
            parent.normalize();
        }
    });

    // Create a text version of the content for processing
    const textContent = contentElement.textContent;

    // Split the text into words with a more comprehensive regex that handles punctuation better
    // This regex splits on whitespace but keeps punctuation attached to words
    const words = textContent.match(/\S+/g) || [];

    // Create a map of word indices to their positions in the DOM
    const wordMap = [];

    // Process the DOM to find text nodes and map words to them
    function processNode(node, wordIndex) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            // Skip empty text nodes
            if (!text.trim()) {
                return wordIndex;
            }

            // Match words in this text node
            const nodeWords = text.match(/\S+/g) || [];

            for (let i = 0; i < nodeWords.length; i++) {
                const word = nodeWords[i];
                const wordPosition = text.indexOf(
                    word,
                    i > 0
                        ? text.indexOf(nodeWords[i - 1]) +
                              nodeWords[i - 1].length
                        : 0
                );

                wordMap.push({
                    word: word,
                    node: node,
                    index: wordIndex + i,
                    position: wordPosition,
                    length: word.length,
                });
            }

            return wordIndex + nodeWords.length;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip script and style elements
            if (node.tagName === "SCRIPT" || node.tagName === "STYLE") {
                return wordIndex;
            }

            let currentIndex = wordIndex;
            for (const child of node.childNodes) {
                currentIndex = processNode(child, currentIndex);
            }
            return currentIndex;
        }
        return wordIndex;
    }

    processNode(contentElement, 0);

    // Set up event listeners for the utterance
    const utterance = TTSUtils.utterance;

    if (!utterance) {
        console.error("No utterance available for TTS highlighting");
        return;
    }

    // Current word index being spoken
    let currentWordIndex = -1; // Start at -1 so first word gets highlighted
    let activeHighlight = null;
    let previousHighlights = [];

    // Pre-highlight the first few words to give context
    function preHighlightInitialWords() {
        // Clear any existing highlights first
        clearAllHighlights();

        // Pre-highlight the first 3 words (or fewer if there aren't enough)
        const wordsToPreHighlight = Math.min(3, words.length);

        for (let i = 0; i < wordsToPreHighlight; i++) {
            const wordInfo = wordMap.find((w) => w.index === i);
            if (wordInfo) {
                const highlight = highlightWord(wordInfo, i === 0);
                if (highlight && i === 0) {
                    activeHighlight = highlight;
                } else if (highlight) {
                    previousHighlights.push(highlight);
                }
            }
        }
    }

    // Function to highlight a specific word
    function highlightWord(wordInfo, isActive = false) {
        if (!wordInfo) return null;

        const wordNode = wordInfo.node;
        const wordText = wordInfo.word;
        const wordPosition = wordInfo.position;

        try {
            // Create a range for this word
            const range = document.createRange();
            range.setStart(wordNode, wordPosition);
            range.setEnd(wordNode, wordPosition + wordInfo.length);

            // Create the highlight span
            const highlightSpan = document.createElement("span");
            highlightSpan.className = isActive
                ? "tts-highlight tts-active"
                : "tts-highlight";
            highlightSpan.textContent = wordText;
            highlightSpan.dataset.wordIndex = wordInfo.index;

            // Replace the text with the highlight span
            range.deleteContents();
            range.insertNode(highlightSpan);

            return highlightSpan;
        } catch (error) {
            console.error("Error highlighting word:", error, wordInfo);
            return null;
        }
    }

    // Function to clear all highlights
    function clearAllHighlights() {
        const allHighlights = contentElement.querySelectorAll(
            ".tts-highlight, .tts-active"
        );
        allHighlights.forEach((el) => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(
                    document.createTextNode(el.textContent),
                    el
                );
                parent.normalize();
            }
        });

        activeHighlight = null;
        previousHighlights = [];
    }

    // Handle the start event
    utterance.onstart = () => {
        currentWordIndex = -1; // Start at -1 so first boundary event moves to index 0
        preHighlightInitialWords();
    };

    // Handle the end event
    utterance.onend = () => {
        clearAllHighlights();
    };

    // Handle the boundary event (word or sentence boundary)
    utterance.onboundary = (event) => {
        if (event.name === "word") {
            // Update the current word index
            currentWordIndex = Math.min(currentWordIndex + 1, words.length - 1);

            // Find the corresponding word in our map
            const wordInfo = wordMap.find((w) => w.index === currentWordIndex);

            if (wordInfo) {
                // Remove active class from previous highlight
                if (activeHighlight) {
                    activeHighlight.classList.remove("tts-active");
                    previousHighlights.push(activeHighlight);

                    // Keep only the last 2 previous highlights
                    if (previousHighlights.length > 2) {
                        const oldestHighlight = previousHighlights.shift();
                        if (oldestHighlight && oldestHighlight.parentNode) {
                            oldestHighlight.parentNode.replaceChild(
                                document.createTextNode(
                                    oldestHighlight.textContent
                                ),
                                oldestHighlight
                            );
                        }
                    }
                }

                // Highlight the current word
                const newHighlight = highlightWord(wordInfo, true);
                if (newHighlight) {
                    activeHighlight = newHighlight;

                    // Look ahead and pre-highlight the next word if available
                    const nextWordInfo = wordMap.find(
                        (w) => w.index === currentWordIndex + 1
                    );
                    if (nextWordInfo) {
                        highlightWord(nextWordInfo, false);
                    }

                    // Scroll the highlight into view with smooth behavior
                    activeHighlight.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest",
                    });
                }
            }
        }
    };
}

// Save/view functions removed

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
 * Fetch suggested questions based on the webpage content and conversation history
 * @param {boolean} forceRefresh - Whether to force a refresh of suggestions
 * @param {boolean} useConversationContext - Whether to use conversation history for context
 */
async function fetchSuggestedQuestions(
    forceRefresh = false,
    useConversationContext = false
) {
    // Always show the container and display the "Summarize this page" button immediately
    suggestedQuestionsContainer.classList.remove("hidden");

    // Display the "Summarize this page" button immediately
    if (forceRefresh || suggestedQuestions.length === 0) {
        // Clear the list and show just the "Summarize this page" button
        suggestedQuestionsList.innerHTML = "";
        const summarizeButton = document.createElement("button");
        summarizeButton.className = "suggested-question";
        summarizeButton.textContent = "Summarize this page";
        suggestedQuestionsList.appendChild(summarizeButton);
    }

    // Don't fetch if already fetching or if we already have suggestions and not forcing refresh
    if (
        isFetchingSuggestions ||
        (suggestedQuestions.length > 0 &&
            !forceRefresh &&
            !useConversationContext)
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

        // We already cleared and added the "Summarize this page" button above
        if (forceRefresh) {
            suggestedQuestions = [];
        }

        // Generate a unique request ID for this suggestions request
        currentRequestId = `suggestions_${generateUUID()}`;

        // Prepare request data with conversation history if needed
        const requestData = {
            api_key: settings.apiKey,
            webpage_content: pageContent,
            count: 3, // Request 3 suggested questions
            use_conversation_context: useConversationContext,
            conversation_history: useConversationContext
                ? currentChatSession.messages
                : [],
        };

        console.log("Sending request for suggested questions with data:", {
            api_key: "REDACTED",
            webpage_content_length: pageContent.length,
            count: requestData.count,
            use_conversation_context: requestData.use_conversation_context,
            conversation_history_length:
                requestData.conversation_history.length,
        });

        // Send request to get suggested questions
        const response = await APIUtils.getSuggestedQuestions(
            requestData,
            currentRequestId
        );

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
        // Clear the current request ID if it's a suggestions request
        if (currentRequestId && currentRequestId.startsWith("suggestions_")) {
            currentRequestId = null;
        }
    }
}

/**
 * Display suggested questions in the UI
 * @param {Array} questions - Array of question strings
 */
function displaySuggestedQuestions(questions) {
    // Clear the list
    suggestedQuestionsList.innerHTML = "";

    // Always add "Summarize this page" as the first button
    const summarizeButton = document.createElement("button");
    summarizeButton.className = "suggested-question";
    summarizeButton.textContent = "Summarize this page";
    suggestedQuestionsList.appendChild(summarizeButton);

    // Add each question as a button
    questions.forEach((question) => {
        const questionElement = document.createElement("button");
        questionElement.className = "suggested-question";
        questionElement.textContent = question;
        suggestedQuestionsList.appendChild(questionElement);
    });
}
