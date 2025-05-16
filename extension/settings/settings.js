// WebPage Chatter - Settings Script

// Import configuration
import { Config } from "../utils/config.js";

// DOM Elements
const apiKeyInput = document.getElementById("api-key");
const apiKeyError = document.getElementById("api-key-error");
const toggleApiKey = document.getElementById("toggle-api-key");
const eyeIcon = document.getElementById("eye-icon");
const eyeOffIcon = document.getElementById("eye-off-icon");
const apiEndpointInput = document.getElementById("api-endpoint");
const requestTimeoutInput = document.getElementById("request-timeout");
const ttsSpeedSelect = document.getElementById("tts-speed");
const ttsVoiceSelect = document.getElementById("tts-voice");
const testTtsButton = document.getElementById("test-tts");
const clearSavedAnswersButton = document.getElementById("clear-saved-answers");
const saveSettingsButton = document.getElementById("save-settings");
const saveStatus = document.getElementById("save-status");

// Initialize settings page
document.addEventListener("DOMContentLoaded", async () => {
    // Load settings
    await loadSettings();

    // Load available voices
    await loadVoices();

    // Set up event listeners
    setupEventListeners();
});

/**
 * Load settings from storage
 */
async function loadSettings() {
    try {
        const settings = await StorageUtils.getSettings();

        // Set API key if available
        if (settings.apiKey) {
            apiKeyInput.value = settings.apiKey;
        }

        // Set API endpoint if available
        if (settings.apiEndpoint) {
            apiEndpointInput.value = settings.apiEndpoint;
        } else {
            apiEndpointInput.value = Config.API.DEFAULT_ENDPOINT;
        }

        // Set request timeout if available
        if (settings.requestTimeout) {
            requestTimeoutInput.value = Math.floor(
                settings.requestTimeout / 1000
            ); // Convert from ms to seconds
        } else {
            requestTimeoutInput.value = Math.floor(
                Config.API.DEFAULT_TIMEOUT / 1000
            ); // Convert from ms to seconds
        }

        // Set TTS speed if available
        if (settings.ttsSpeed) {
            ttsSpeedSelect.value = settings.ttsSpeed;
        }

        // Set TTS voice if available
        if (settings.ttsVoiceURI) {
            // Voice selection will be handled after voices are loaded
            // We'll store this for later
            ttsVoiceSelect.dataset.selectedVoice = settings.ttsVoiceURI;
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        showError("Failed to load settings. Please try again.");
    }
}

/**
 * Load available TTS voices
 */
async function loadVoices() {
    try {
        // Get available voices
        const voices = await TTSUtils.getVoices();

        // Clear loading option
        ttsVoiceSelect.innerHTML = "";

        // Add voices to select
        voices.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            ttsVoiceSelect.appendChild(option);
        });

        // Set selected voice if available
        if (ttsVoiceSelect.dataset.selectedVoice) {
            ttsVoiceSelect.value = ttsVoiceSelect.dataset.selectedVoice;
        }

        // If no voice is selected, select the first one
        if (!ttsVoiceSelect.value && voices.length > 0) {
            ttsVoiceSelect.value = voices[0].voiceURI;
        }
    } catch (error) {
        console.error("Error loading voices:", error);
        ttsVoiceSelect.innerHTML =
            '<option value="">No voices available</option>';
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Toggle API key visibility
    toggleApiKey.addEventListener("click", () => {
        if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text";
            eyeIcon.classList.add("hidden");
            eyeOffIcon.classList.remove("hidden");
        } else {
            apiKeyInput.type = "password";
            eyeIcon.classList.remove("hidden");
            eyeOffIcon.classList.add("hidden");
        }
    });

    // Test TTS button
    testTtsButton.addEventListener("click", () => {
        const speed = parseFloat(ttsSpeedSelect.value);
        const voiceURI = ttsVoiceSelect.value;

        if (voiceURI) {
            TTSUtils.setVoice(voiceURI);
            TTSUtils.setRate(speed);
            TTSUtils.setText(
                "This is a test of the text-to-speech feature in WebPage Chatter."
            );
            TTSUtils.play();
        } else {
            showError("No voice selected. Please select a voice first.");
        }
    });

    // Clear saved answers button
    clearSavedAnswersButton.addEventListener("click", async () => {
        if (
            confirm(
                "Are you sure you want to clear all saved answers? This action cannot be undone."
            )
        ) {
            try {
                await StorageUtils.clearSavedAnswers();
                showSuccess("Saved answers cleared successfully.");
            } catch (error) {
                console.error("Error clearing saved answers:", error);
                showError("Failed to clear saved answers. Please try again.");
            }
        }
    });

    // Save settings button
    saveSettingsButton.addEventListener("click", saveSettings);
}

/**
 * Save settings to storage
 */
async function saveSettings() {
    try {
        // Validate API key
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showError("API key is required.");
            return;
        }

        // Validate API key format
        const isValid = await validateApiKey(apiKey);
        if (!isValid) {
            showError("Invalid API key format. Please check your API key.");
            return;
        }

        // Get other settings
        const apiEndpoint =
            apiEndpointInput.value.trim() || Config.API.DEFAULT_ENDPOINT;
        const requestTimeout = parseInt(requestTimeoutInput.value, 10) * 1000; // Convert seconds to ms
        const ttsSpeed = parseFloat(ttsSpeedSelect.value);
        const ttsVoiceURI = ttsVoiceSelect.value;

        // Save settings
        await StorageUtils.saveSettings({
            apiKey,
            apiEndpoint,
            requestTimeout,
            ttsSpeed,
            ttsVoiceURI,
        });

        // Show success message
        showSuccess("Settings saved successfully!");
    } catch (error) {
        console.error("Error saving settings:", error);
        showError("Failed to save settings. Please try again.");
    }
}

/**
 * Validate API key format
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<boolean>} - Whether the API key is valid
 */
async function validateApiKey(apiKey) {
    try {
        // Send validation request to background script
        const response = await chrome.runtime.sendMessage({
            action: "validateApiKey",
            apiKey,
        });

        return response.isValid;
    } catch (error) {
        console.error("Error validating API key:", error);
        return false;
    }
}

/**
 * Show error message
 * @param {string} message - The error message
 */
function showError(message) {
    apiKeyError.textContent = message;
    apiKeyError.classList.remove("hidden");

    // Hide error after 5 seconds
    setTimeout(() => {
        apiKeyError.classList.add("hidden");
    }, 5000);
}

/**
 * Show success message
 * @param {string} message - The success message
 */
function showSuccess(message) {
    saveStatus.textContent = message;
    saveStatus.classList.remove("hidden");

    // Hide success message after 3 seconds
    setTimeout(() => {
        saveStatus.classList.add("hidden");
    }, 3000);
}
