// WebPage Chatter - Content Extractor Utilities

/**
 * Utility functions for extracting content from webpages
 */
const ContentExtractor = {
  /**
   * Extract content from the current webpage
   * @returns {Promise<Object>} - Object containing the extracted content
   */
  extractContent: async function() {
    try {
      // Request content extraction from content script
      return await chrome.runtime.sendMessage({ action: 'getPageContent' });
    } catch (error) {
      console.error('Error extracting content:', error);
      return {
        success: false,
        error: error.message || 'Failed to extract content'
      };
    }
  },
  
  /**
   * Estimate token count for a text string
   * @param {string} text - The text to estimate tokens for
   * @returns {number} - The estimated number of tokens
   */
  estimateTokens: function(text) {
    // Simple approximation: Gemini models use approximately 4 characters per token
    return Math.ceil(text.length / 4);
  },
  
  /**
   * Check if content is too large for primary model
   * @param {string} content - The content to check
   * @param {number} tokenLimit - The token limit (default: 200000)
   * @returns {boolean} - Whether the content exceeds the token limit
   */
  isContentTooLarge: function(content, tokenLimit = 200000) {
    const estimatedTokens = this.estimateTokens(content);
    return estimatedTokens > tokenLimit;
  }
};
