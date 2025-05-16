// WebPage Chatter - Storage Utilities

/**
 * Utility functions for storage operations
 */
const StorageUtils = {
  /**
   * Get settings from storage
   * @returns {Promise<Object>} - The settings object
   */
  getSettings: async function() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'ttsSpeed', 'ttsVoiceURI'], (result) => {
        resolve({
          apiKey: result.apiKey || '',
          apiEndpoint: result.apiEndpoint || '',
          ttsSpeed: result.ttsSpeed || 1.0,
          ttsVoiceURI: result.ttsVoiceURI || ''
        });
      });
    });
  },
  
  /**
   * Save settings to storage
   * @param {Object} settings - The settings to save
   * @returns {Promise<void>}
   */
  saveSettings: async function(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, resolve);
    });
  },
  
  /**
   * Get saved answers from storage
   * @returns {Promise<Array>} - Array of saved chat sessions
   */
  getSavedAnswers: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['savedAnswers'], (result) => {
        resolve(result.savedAnswers || []);
      });
    });
  },
  
  /**
   * Save answers to storage
   * @param {Array} savedAnswers - Array of saved chat sessions
   * @returns {Promise<void>}
   */
  saveSavedAnswers: async function(savedAnswers) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ savedAnswers }, resolve);
    });
  },
  
  /**
   * Clear all saved answers
   * @returns {Promise<void>}
   */
  clearSavedAnswers: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['savedAnswers'], resolve);
    });
  },
  
  /**
   * Get current chat session from storage
   * @returns {Promise<Object|null>} - The current chat session or null
   */
  getCurrentChatSession: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentChatSession'], (result) => {
        resolve(result.currentChatSession || null);
      });
    });
  },
  
  /**
   * Save current chat session to storage
   * @param {Object} chatSession - The chat session to save
   * @returns {Promise<void>}
   */
  saveCurrentChatSession: async function(chatSession) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ currentChatSession: chatSession }, resolve);
    });
  },
  
  /**
   * Clear current chat session
   * @returns {Promise<void>}
   */
  clearCurrentChatSession: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['currentChatSession'], resolve);
    });
  }
};
