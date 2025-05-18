// WebPage Chatter - API Utilities

// Import configuration
import { Config } from "./config.js";

// Store active request controllers for cancellation
let activeRequestControllers = new Map();

/**
 * Utility functions for API operations
 */
const APIUtils = {
    /**
     * Send a chat request to the backend API
     * @param {Object} data - The request data
     * @param {string} requestId - Unique identifier for this request (for cancellation)
     * @returns {Promise<Object>} - The API response
     */
    sendChatRequest: async function (data, requestId = "default") {
        try {
            // Create a new AbortController for this request
            const controller = new AbortController();

            // Store the controller for potential cancellation
            activeRequestControllers.set(requestId, controller);

            // Send request to background script with the signal
            const response = await chrome.runtime.sendMessage({
                action: "sendChatRequest",
                data: data,
                requestId: requestId,
            });

            // Remove the controller when done
            activeRequestControllers.delete(requestId);

            return response;
        } catch (error) {
            console.error("Error sending chat request:", error);

            // Remove the controller when done
            activeRequestControllers.delete(requestId);

            return {
                success: false,
                error: error.message || "Failed to send chat request",
            };
        }
    },

    /**
     * Cancel an active API request
     * @param {string} requestId - The ID of the request to cancel
     * @returns {boolean} - Whether a request was found and cancelled
     */
    cancelRequest: function (requestId = "default") {
        const controller = activeRequestControllers.get(requestId);
        if (controller) {
            console.log(`Cancelling request: ${requestId}`);
            controller.abort();
            activeRequestControllers.delete(requestId);
            return true;
        }
        return false;
    },

    /**
     * Get question suggestions based on webpage content
     * @param {Object} data - The request data (api_key, webpage_content, count)
     * @param {string} requestId - Unique identifier for this request (for cancellation)
     * @returns {Promise<Object>} - The API response with suggested questions
     */
    getSuggestedQuestions: async function (data, requestId = "suggestions") {
        try {
            // Create a new AbortController for this request
            const controller = new AbortController();

            // Store the controller for potential cancellation
            activeRequestControllers.set(requestId, controller);

            // Send request to background script
            const response = await chrome.runtime.sendMessage({
                action: "getSuggestedQuestions",
                data: data,
                requestId: requestId,
            });

            // Remove the controller when done
            activeRequestControllers.delete(requestId);

            return response;
        } catch (error) {
            console.error("Error getting suggested questions:", error);

            // Remove the controller when done
            activeRequestControllers.delete(requestId);

            return {
                success: false,
                error: error.message || "Failed to get suggested questions",
            };
        }
    },

    /**
     * Process a streaming response
     * @param {ReadableStreamDefaultReader} reader - The response reader
     * @param {Function} onChunk - Callback for each chunk of text
     * @param {Function} onDone - Callback when streaming is complete
     * @param {Function} onError - Callback for errors
     */
    processStreamingResponse: async function (
        reader,
        onChunk,
        onDone,
        onError
    ) {
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (onDone) {
                        onDone();
                    }
                    break;
                }

                // Decode and process chunk
                const chunk = decoder.decode(value, { stream: true });

                if (onChunk) {
                    onChunk(chunk);
                }
            }
        } catch (error) {
            console.error("Error processing streaming response:", error);

            if (onError) {
                onError(error);
            }
        }
    },

    /**
     * Validate API key format
     * @param {string} apiKey - The API key to validate
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    validateApiKey: async function (apiKey) {
        try {
            // Send validation request to background script
            const response = await chrome.runtime.sendMessage({
                action: "validateApiKey",
                apiKey: apiKey,
            });

            return response.isValid;
        } catch (error) {
            console.error("Error validating API key:", error);
            return false;
        }
    },
};

// Export the APIUtils object
export { APIUtils };
