// WebPage Chatter - Background Script

// Import configuration
import { Config } from "../utils/config.js";

// Track which tabs have the sidebar open
const openSidebars = new Set();

// Debounce function to prevent excessive refreshes
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Toggle the sidebar for a specific tab
 * This function provides multiple methods to ensure the sidebar opens
 * @param {number} tabId - The ID of the tab
 */
async function toggleSidebar(tabId) {
    console.log("Attempting to toggle sidebar for tab:", tabId);

    try {
        // Check if the sidePanel API is available
        if (!chrome.sidePanel) {
            console.error(
                "chrome.sidePanel API is not available in this browser version"
            );
            return;
        }

        // Method 1: Try using chrome.sidePanel.open
        if (chrome.sidePanel.open) {
            try {
                await chrome.sidePanel.open({ tabId: tabId });
                console.log(
                    "Method 1 success: Opened sidebar using chrome.sidePanel.open"
                );
                openSidebars.add(tabId);
                return;
            } catch (error) {
                console.error("Method 1 failed:", error);
            }
        } else {
            console.warn("chrome.sidePanel.open is not available");
        }

        // Method 2: Try using setOptions to enable the panel
        if (chrome.sidePanel.setOptions) {
            try {
                await chrome.sidePanel.setOptions({
                    tabId: tabId,
                    path: "sidebar/sidebar.html",
                    enabled: true,
                });
                console.log(
                    "Method 2 success: Enabled sidebar using chrome.sidePanel.setOptions"
                );
                openSidebars.add(tabId);
                return;
            } catch (error) {
                console.error("Method 2 failed:", error);
            }
        } else {
            console.warn("chrome.sidePanel.setOptions is not available");
        }

        // Method 3: Try using chrome.sidePanel.open without tabId (global)
        if (chrome.sidePanel.open) {
            try {
                await chrome.sidePanel.open();
                console.log("Method 3 success: Opened sidebar globally");
                openSidebars.add(tabId);
                return;
            } catch (error) {
                console.error("Method 3 failed:", error);
            }
        }

        // Method 4: Fallback to using chrome.action.openPopup if available
        if (chrome.action && chrome.action.openPopup) {
            try {
                await chrome.action.openPopup();
                console.log("Method 4 success: Opened popup as fallback");
                return;
            } catch (error) {
                console.error("Method 4 failed:", error);
            }
        }

        // If all methods fail, log an error
        console.error("All methods to open sidebar failed for tab:", tabId);
    } catch (error) {
        console.error("Unexpected error in toggleSidebar:", error);
    }
}

// Create context menu item
function createContextMenu() {
    // Remove existing menu items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        // Create the context menu item
        chrome.contextMenus.create(
            {
                id: "open-webpage-chatter",
                title: "Chat with this page",
                contexts: ["page", "selection"],
            },
            () => {
                // Check for any errors in creation
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error creating context menu:",
                        chrome.runtime.lastError
                    );
                } else {
                    console.log("Context menu created successfully");
                }
            }
        );
    });
}

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async () => {
    console.log("WebPage Chatter extension installed or updated");

    // Create context menu item
    createContextMenu();

    // Initialize default settings if not already set
    const settings = await chrome.storage.sync.get([
        "apiKey",
        "ttsSpeed",
        "ttsVoiceURI",
    ]);
    if (!settings.ttsSpeed) {
        await chrome.storage.sync.set({ ttsSpeed: 1.0 });
    }
});

// Create context menu when extension is loaded
createContextMenu();

// Open the side panel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked for tab:", tab.id);
    toggleSidebar(tab.id);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-webpage-chatter") {
        console.log("Context menu clicked for tab:", tab.id);
        toggleSidebar(tab.id);
    }
});

// Track when sidepanel is opened (with error handling)
try {
    if (chrome.sidePanel && chrome.sidePanel.onOpened) {
        console.log("Setting up sidePanel.onOpened listener");
        chrome.sidePanel.onOpened.addListener((panel) => {
            console.log("Sidebar opened for tab:", panel.tabId);
            if (panel.tabId) {
                openSidebars.add(panel.tabId);
            }
        });
    } else {
        console.warn(
            "chrome.sidePanel.onOpened is not available in this browser version"
        );
    }
} catch (error) {
    console.error("Error setting up sidePanel.onOpened listener:", error);
}

// Track when sidepanel is closed (with error handling)
try {
    if (chrome.sidePanel && chrome.sidePanel.onClosed) {
        console.log("Setting up sidePanel.onClosed listener");
        chrome.sidePanel.onClosed.addListener((panel) => {
            console.log("Sidebar closed for tab:", panel.tabId);
            if (panel.tabId) {
                openSidebars.delete(panel.tabId);
            }
        });
    } else {
        console.warn(
            "chrome.sidePanel.onClosed is not available in this browser version"
        );
    }
} catch (error) {
    console.error("Error setting up sidePanel.onClosed listener:", error);
}

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener(
    debounce((activeInfo) => {
        if (openSidebars.has(activeInfo.tabId)) {
            notifySidebarOfContextChange(activeInfo.tabId, "tab_switch");
        }
    }, Config.NAVIGATION.DEBOUNCE_TIME)
);

// Listen for tab updates (page navigation, refresh, URL changes)
chrome.tabs.onUpdated.addListener(
    debounce((tabId, changeInfo, tab) => {
        // Only trigger on complete load or when URL changes
        if (
            openSidebars.has(tabId) &&
            (changeInfo.status === "complete" || changeInfo.url)
        ) {
            notifySidebarOfContextChange(tabId, "page_update");
        }
    }, Config.NAVIGATION.DEBOUNCE_TIME)
);

/**
 * Notify the sidebar that the context has changed
 * @param {number} tabId - The ID of the tab
 * @param {string} reason - The reason for the context change
 */
function notifySidebarOfContextChange(tabId, reason) {
    chrome.tabs.sendMessage(
        tabId,
        { action: "contextChanged", reason: reason },
        (response) => {
            // Handle potential errors
            if (chrome.runtime.lastError) {
                console.log(
                    "Content script not ready yet:",
                    chrome.runtime.lastError
                );
                // Try again after a short delay
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, {
                        action: "refreshContext",
                        reason: reason,
                    });
                }, 500);
            }
        }
    );
}

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

        case "refreshContext":
            // Request content script to extract page content for context refresh
            if (sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(
                    sender.tab.id,
                    { action: "extractContent" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Error sending message to content script:",
                                chrome.runtime.lastError
                            );
                            sendResponse({
                                success: false,
                                error: "Failed to extract page content for refresh",
                            });
                        } else {
                            sendResponse({
                                success: true,
                                content: response.content,
                                url: sender.tab.url,
                                title: sender.tab.title,
                            });
                        }
                    }
                );
                return true; // Keep the message channel open for async response
            } else {
                sendResponse({
                    success: false,
                    error: "No tab information available",
                });
            }
            return true;

        case "sendChatRequest":
            // Forward the chat request to the API
            handleChatRequest(message.data)
                .then((response) => sendResponse(response))
                .catch((error) => sendResponse({ error: error.message }));
            return true; // Keep the message channel open for async response

        case "getSuggestedQuestions":
            // Forward the suggested questions request to the API
            handleSuggestedQuestionsRequest(message.data)
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
        // Get the API endpoint from settings or use default from Config
        const settings = await chrome.storage.sync.get([
            "apiEndpoint",
            "requestTimeout",
        ]);
        const apiUrl = settings.apiEndpoint || Config.API.DEFAULT_ENDPOINT;
        const timeout = settings.requestTimeout || Config.API.DEFAULT_TIMEOUT;

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

/**
 * Handle suggested questions request to the backend API
 * @param {Object} data - The request data (api_key, webpage_content, count)
 * @returns {Promise} - Promise that resolves with the API response
 */
async function handleSuggestedQuestionsRequest(data) {
    try {
        // Get the API endpoint from settings or use default from Config
        const settings = await chrome.storage.sync.get([
            "apiEndpoint",
            "requestTimeout",
        ]);

        // Construct the API URL for suggested questions
        let apiUrl =
            settings.suggestionsEndpoint ||
            Config.API.DEFAULT_SUGGESTIONS_ENDPOINT;

        // If no specific suggestions endpoint is set, derive it from the chat endpoint
        if (!settings.suggestionsEndpoint) {
            const chatEndpoint =
                settings.apiEndpoint || Config.API.DEFAULT_ENDPOINT;

            // If the endpoint ends with "/chat", replace it with "/suggest-questions"
            if (chatEndpoint.endsWith("/chat")) {
                apiUrl = chatEndpoint.replace(/\/chat$/, "/suggest-questions");
            } else {
                // Otherwise, assume it's the base URL and append "/suggest-questions"
                // First remove any trailing slash
                const baseUrl = chatEndpoint.replace(/\/$/, "");
                // Then append the path
                apiUrl = `${baseUrl}/suggest-questions`;
            }
        }

        console.log("Using suggestions API URL:", apiUrl);

        const timeout = settings.requestTimeout || Config.API.DEFAULT_TIMEOUT;

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

        // Return the questions
        return {
            success: true,
            questions: responseData.questions,
            status: response.status,
        };
    } catch (error) {
        console.error("API request error for suggested questions:", error);

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
