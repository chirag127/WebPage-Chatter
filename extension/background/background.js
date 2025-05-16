// WebPage Chatter - Background Script

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async () => {
    console.log("WebPage Chatter extension installed or updated");

    // Create context menu item
    chrome.contextMenus.create({
        id: "open-webpage-chatter",
        title: "Chat with this page",
        contexts: ["page", "selection"],
    });

    // Initialize default settings if not already set
    const settings = await chrome.storage.sync.get([
        "apiKey",
        "ttsSpeed",
        "ttsVoiceURI",
    ]);
    if (!settings.ttsSpeed) {
        await chrome.storage.sync.set({ ttsSpeed: 1.0 });
    }

    // Open the side panel when the extension icon is clicked
    chrome.action.onClicked.addListener((tab) => {
        chrome.sidePanel.open({ tabId: tab.id });
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-webpage-chatter") {
        chrome.sidePanel.open({ tabId: tab.id });
    }
});

// Listen for messages from content scripts or sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle different message types
    switch (message.action) {
        case "getPageContent":
            // Request content script to extract page content
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { action: "extractContent" },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.error(
                                    "Error sending message to content script:",
                                    chrome.runtime.lastError
                                );
                                sendResponse({
                                    error: "Failed to extract page content",
                                });
                            } else {
                                sendResponse(response);
                            }
                        }
                    );
                } else {
                    sendResponse({ error: "No active tab found" });
                }
            });
            return true; // Keep the message channel open for async response

        case "sendChatRequest":
            // Forward the chat request to the API
            handleChatRequest(message.data)
                .then((response) => sendResponse(response))
                .catch((error) => sendResponse({ error: error.message }));
            return true; // Keep the message channel open for async response

        case "validateApiKey":
            // Validate the API key format
            const isValid = validateApiKey(message.apiKey);
            sendResponse({ isValid });
            break;

        case "openSettings":
            // Open the settings page
            chrome.runtime.openOptionsPage();
            break;
    }
});

/**
 * Handle chat request to the backend API
 * @param {Object} data - The chat request data
 * @returns {Promise} - Promise that resolves with the API response
 */
async function handleChatRequest(data) {
    try {
        // Get the API endpoint from settings or use default
        const settings = await chrome.storage.sync.get([
            "apiEndpoint",
            "requestTimeout",
        ]);
        const apiUrl = settings.apiEndpoint || "http://localhost:8000/api/chat";
        const timeout = settings.requestTimeout || 60000; // Default timeout: 60 seconds

        // Create an AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Make the API request with timeout
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            signal: controller.signal,
        });

        // Clear the timeout
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = "Failed to get response from API";

            try {
                // Try to parse error as JSON
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (jsonError) {
                // If JSON parsing fails, use status text
                errorMessage = `Server error (${response.status}): ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }

        // Parse the JSON response
        const responseData = await response.json();

        // Return the complete text response
        return {
            success: true,
            text: responseData.text,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            isNonStreaming: true,
        };
    } catch (error) {
        console.error("API request error:", error);

        // Provide more specific error messages based on error type
        let errorMessage = error.message;

        if (error.name === "AbortError") {
            errorMessage =
                "Request timed out. The server took too long to respond.";
        } else if (
            error.name === "TypeError" &&
            error.message.includes("Failed to fetch")
        ) {
            errorMessage =
                "Network error. Please check your internet connection and the API server status.";
        }

        return {
            success: false,
            error: errorMessage,
            errorType: error.name,
        };
    }
}

/**
 * Validate API key format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} - Whether the API key is valid
 */
function validateApiKey(apiKey) {
    // Basic validation - Gemini API keys typically have a specific format
    // This is a simple check and may need to be updated based on actual Gemini API key format
    if (!apiKey || typeof apiKey !== "string") {
        return false;
    }

    // Check if the API key matches the expected pattern
    // This is a simplified pattern and may need to be adjusted
    const pattern = /^[A-Za-z0-9_-]{20,}$/;
    return pattern.test(apiKey);
}
