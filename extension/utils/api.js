// WebPage Chatter - API Utilities

// Import configuration
import { Config } from "./config.js";

/**
 * Utility functions for API operations
 */
const APIUtils = {
    /**
     * Send a chat request to the backend API
     * @param {Object} data - The request data
     * @returns {Promise<Object>} - The API response
     */
    sendChatRequest: async function (data) {
        try {
            // Send request to background script
            return await chrome.runtime.sendMessage({
                action: "sendChatRequest",
                data: data,
            });
        } catch (error) {
            console.error("Error sending chat request:", error);
            return {
                success: false,
                error: error.message || "Failed to send chat request",
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
