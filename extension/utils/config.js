// WebPage Chatter - Configuration Constants

/**
 * Application-wide configuration constants
 */
const Config = Object.freeze({
    /**
     * API configuration
     */
    API: Object.freeze({
        /**
         * Default API endpoint URL
         */
        DEFAULT_ENDPOINT: "https://webpage-chatter.onrender.com/api/chat",

        /**
         * Default request timeout in milliseconds
         */
        DEFAULT_TIMEOUT: 120000, // 120 seconds
    }),

    /**
     * Storage configuration
     */
    STORAGE: Object.freeze({
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
    }),

    /**
     * Text-to-Speech configuration
     */
    TTS: Object.freeze({
        /**
         * Default TTS speed
         */
        DEFAULT_SPEED: 1.0,
    }),
});

// Export the configuration object
export { Config };
