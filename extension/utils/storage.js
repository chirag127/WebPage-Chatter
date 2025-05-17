// WebPage Chatter - Storage Utilities

// Import configuration
import { Config } from "./config.js";

/**
 * Utility functions for storage operations
 */
const StorageUtils = {
    // Storage keys
    KEYS: {
        SETTINGS: "settings",
        SAVED_ANSWERS: "savedAnswers",
        CHAT_HISTORY: "chatHistory",
        CURRENT_CHAT_SESSION: "currentChatSession",
    },

    // Storage limits (in bytes) - using values from Config
    LIMITS: {
        LOCAL_STORAGE: Config.STORAGE.LOCAL_STORAGE_LIMIT,
        SYNC_STORAGE: Config.STORAGE.SYNC_STORAGE_LIMIT,
        WARNING_THRESHOLD: Config.STORAGE.WARNING_THRESHOLD,
    },

    /**
     * Get settings from storage
     * @returns {Promise<Object>} - The settings object
     */
    getSettings: async function () {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(
                    [
                        "apiKey",
                        "apiEndpoint",
                        "requestTimeout",
                        "ttsSpeed",
                        "ttsVoiceURI",
                    ],
                    (result) => {
                        // Check for chrome runtime errors
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Chrome storage error:",
                                chrome.runtime.lastError
                            );
                            reject(
                                new Error(
                                    `Storage error: ${chrome.runtime.lastError.message}`
                                )
                            );
                            return;
                        }

                        // Create settings object with fallbacks to defaults
                        const settings = {
                            apiKey: result.apiKey || "",
                            apiEndpoint:
                                result.apiEndpoint ||
                                Config.API.DEFAULT_ENDPOINT,
                            requestTimeout:
                                result.requestTimeout ||
                                Config.API.DEFAULT_TIMEOUT,
                            ttsSpeed:
                                result.ttsSpeed || Config.TTS.DEFAULT_SPEED,
                            ttsVoiceURI: result.ttsVoiceURI || "",
                        };

                        // Log successful settings retrieval
                        console.log("Settings retrieved from storage");

                        resolve(settings);
                    }
                );
            } catch (error) {
                console.error("Error in getSettings:", error);
                reject(error);
            }
        });
    },

    /**
     * Save settings to storage
     * @param {Object} settings - The settings to save
     * @returns {Promise<void>}
     */
    saveSettings: async function (settings) {
        return new Promise((resolve, reject) => {
            try {
                // Validate settings object
                if (!settings || typeof settings !== "object") {
                    reject(new Error("Invalid settings object"));
                    return;
                }

                // Ensure settings has expected properties with fallbacks
                const validatedSettings = {
                    apiKey: settings.apiKey || "",
                    apiEndpoint:
                        settings.apiEndpoint || Config.API.DEFAULT_ENDPOINT,
                    requestTimeout:
                        settings.requestTimeout || Config.API.DEFAULT_TIMEOUT,
                    ttsSpeed: settings.ttsSpeed || Config.TTS.DEFAULT_SPEED,
                    ttsVoiceURI: settings.ttsVoiceURI || "",
                };

                // Save to chrome.storage.sync
                chrome.storage.sync.set(validatedSettings, () => {
                    // Check for chrome runtime errors
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Chrome storage error:",
                            chrome.runtime.lastError
                        );
                        reject(
                            new Error(
                                `Storage error: ${chrome.runtime.lastError.message}`
                            )
                        );
                        return;
                    }

                    console.log("Settings saved successfully");
                    resolve();
                });
            } catch (error) {
                console.error("Error in saveSettings:", error);
                reject(error);
            }
        });
    },

    /**
     * Get saved answers from storage
     * @returns {Promise<Array>} - Array of saved chat sessions
     */
    getSavedAnswers: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.get(["savedAnswers"], (result) => {
                resolve(result.savedAnswers || []);
            });
        });
    },

    /**
     * Save answers to storage
     * @param {Array} savedAnswers - Array of saved chat sessions
     * @returns {Promise<void>}
     */
    saveSavedAnswers: async function (savedAnswers) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ savedAnswers }, resolve);
        });
    },

    /**
     * Clear all saved answers
     * @returns {Promise<void>}
     */
    clearSavedAnswers: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.remove(["savedAnswers"], resolve);
        });
    },

    /**
     * Get current chat session from storage
     * @returns {Promise<Object|null>} - The current chat session or null
     */
    getCurrentChatSession: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.get(["currentChatSession"], (result) => {
                resolve(result.currentChatSession || null);
            });
        });
    },

    /**
     * Save current chat session to storage
     * @param {Object} chatSession - The chat session to save
     * @returns {Promise<void>}
     */
    saveCurrentChatSession: async function (chatSession) {
        return new Promise((resolve) => {
            chrome.storage.local.set(
                { currentChatSession: chatSession },
                resolve
            );
        });
    },

    /**
     * Clear current chat session
     * @returns {Promise<void>}
     */
    clearCurrentChatSession: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.remove(["currentChatSession"], resolve);
        });
    },

    /**
     * Get chat history from storage
     * @returns {Promise<Array>} - Array of chat sessions
     */
    getChatHistory: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.KEYS.CHAT_HISTORY], (result) => {
                resolve(result[this.KEYS.CHAT_HISTORY] || []);
            });
        });
    },

    /**
     * Save chat session to history
     * @param {Object} chatSession - The chat session to save
     * @returns {Promise<void>}
     */
    saveChatToHistory: async function (chatSession) {
        try {
            // Get current chat history
            const chatHistory = await this.getChatHistory();

            // Check if this chat session already exists in history (by ID)
            const existingIndex = chatHistory.findIndex(
                (session) => session.id === chatSession.id
            );

            if (existingIndex !== -1) {
                // Update existing session
                chatHistory[existingIndex] = chatSession;
            } else {
                // Add new session to the beginning of the array
                chatHistory.unshift(chatSession);
            }

            // Save updated history
            return new Promise((resolve, reject) => {
                chrome.storage.local.set(
                    { [this.KEYS.CHAT_HISTORY]: chatHistory },
                    () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        } catch (error) {
            console.error("Error saving chat to history:", error);
            throw error;
        }
    },

    /**
     * Delete a chat session from history
     * @param {string} sessionId - ID of the session to delete
     * @returns {Promise<void>}
     */
    deleteChatFromHistory: async function (sessionId) {
        try {
            // Get current chat history
            const chatHistory = await this.getChatHistory();

            // Filter out the session to delete
            const updatedHistory = chatHistory.filter(
                (session) => session.id !== sessionId
            );

            // Save updated history
            return new Promise((resolve) => {
                chrome.storage.local.set(
                    { [this.KEYS.CHAT_HISTORY]: updatedHistory },
                    resolve
                );
            });
        } catch (error) {
            console.error("Error deleting chat from history:", error);
            throw error;
        }
    },

    /**
     * Clear all chat history
     * @returns {Promise<void>}
     */
    clearChatHistory: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.remove([this.KEYS.CHAT_HISTORY], resolve);
        });
    },

    /**
     * Search chat history by keyword
     * @param {string} keyword - Keyword to search for
     * @returns {Promise<Array>} - Array of matching chat sessions
     */
    searchChatHistory: async function (keyword) {
        try {
            if (!keyword || keyword.trim() === "") {
                return this.getChatHistory();
            }

            const chatHistory = await this.getChatHistory();
            const searchTerm = keyword.toLowerCase().trim();

            return chatHistory.filter((session) => {
                // Search in page title and URL
                if (
                    session.pageTitle &&
                    session.pageTitle.toLowerCase().includes(searchTerm)
                ) {
                    return true;
                }
                if (
                    session.pageUrl &&
                    session.pageUrl.toLowerCase().includes(searchTerm)
                ) {
                    return true;
                }

                // Search in messages
                return session.messages.some(
                    (message) =>
                        message.content &&
                        message.content.toLowerCase().includes(searchTerm)
                );
            });
        } catch (error) {
            console.error("Error searching chat history:", error);
            throw error;
        }
    },

    /**
     * Get storage usage information
     * @returns {Promise<Object>} - Storage usage information
     */
    getStorageUsage: async function () {
        return new Promise((resolve) => {
            chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
                const percentUsed = bytesInUse / this.LIMITS.LOCAL_STORAGE;
                const isNearLimit =
                    percentUsed >= this.LIMITS.WARNING_THRESHOLD;

                resolve({
                    bytesUsed: bytesInUse,
                    bytesTotal: this.LIMITS.LOCAL_STORAGE,
                    percentUsed: percentUsed,
                    isNearLimit: isNearLimit,
                    formattedUsed: this.formatBytes(bytesInUse),
                    formattedTotal: this.formatBytes(this.LIMITS.LOCAL_STORAGE),
                });
            });
        });
    },

    /**
     * Format bytes to human-readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} - Formatted string
     */
    formatBytes: function (bytes) {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
};

// Export the StorageUtils object
export { StorageUtils };
