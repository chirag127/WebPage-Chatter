// WebPage Chatter - Sidebar Script

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const settingsButton = document.getElementById("settings-button");
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

    // Set up event listeners
    setupEventListeners();
});

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
    // Send button click
    sendButton.addEventListener("click", handleSendMessage);

    // Enter key in chat input
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    });

    // Settings button click
    settingsButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openSettings" });
    });

    // Open settings button click
    openSettings.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openSettings" });
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
}

/**
 * Extract content from the current webpage
 */
async function extractPageContent() {
    try {
        loadingIndicator.classList.remove("hidden");

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
        loadingIndicator.classList.add("hidden");
    }
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

                    // Update message element
                    messageElement.textContent = currentAssistantMessage;

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

                // Update message element
                messageElement.textContent = currentAssistantMessage;

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
                messageElement.textContent = currentAssistantMessage;

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

    const contentElement = document.createElement("div");
    contentElement.className = "message-content";
    contentElement.textContent = message;

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
