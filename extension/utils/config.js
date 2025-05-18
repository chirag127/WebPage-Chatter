// WebPage Chatter - Configuration Constants

/**
 * Application-wide configuration constants
 */
const Config = {
    /**
     * API configuration
     */
    API: {
        /**
         * Base API URL
         */
        // BASE_API_URL: "https://webpage-chatter.onrender.com",
        BASE_API_URL: "http://localhost:8000",

        /**
         * Default API endpoint URL for chat
         * This is derived from the base URL by appending "/api/chat"
         */
        get DEFAULT_ENDPOINT() {
            return `${this.BASE_API_URL}/api/chat`;
        },

        /**
         * Default suggested questions endpoint URL
         * This is derived from the base URL by appending "/api/suggest-questions"
         */
        get DEFAULT_SUGGESTIONS_ENDPOINT() {
            return `${this.BASE_API_URL}/api/suggest-questions`;
        },

        /**
         * Default request timeout in milliseconds
         */
        DEFAULT_TIMEOUT: 120000, // 120 seconds
    },

    /**
     * Storage configuration
     */
    STORAGE: {
        /**
         * Local storage limit in bytes (5MB)
         */
        LOCAL_STORAGE_LIMIT: 5242880,

        /**
         * Sync storage limit in bytes (100KB)
         */
        SYNC_STORAGE_LIMIT: 102400,

        /**
         * Storage warning threshold (80% of capacity)
         */
        WARNING_THRESHOLD: 0.8,
    },

    /**
     * Text-to-Speech configuration
     */
    TTS: {
        /**
         * Default TTS speed
         */
        DEFAULT_SPEED: 1.0,
    },

    /**
     * Navigation event handling configuration
     */
    NAVIGATION: {
        /**
         * Debounce time for navigation events in milliseconds
         * This prevents excessive refreshes when multiple events fire in quick succession
         */
        DEBOUNCE_TIME: 500,

        /**
         * Refresh indicator display time in milliseconds
         * How long to show the refresh indicator when context is updated
         */
        REFRESH_INDICATOR_TIME: 2000,
    },
};

// Export the configuration object
export { Config };
