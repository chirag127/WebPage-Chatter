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
         * Default API endpoint URL
         */
        DEFAULT_ENDPOINT: "https://webpage-chatter.onrender.com/api/chat",

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
};

// Export the configuration object
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
else {
    window.Config = Config;
}
