// WebPage Chatter - Text-to-Speech Utilities

// Import configuration
import { Config } from "./config.js";

/**
 * Utility functions for Text-to-Speech operations
 */
const TTSUtils = {
    // Speech synthesis instance
    synth: window.speechSynthesis,

    // Current utterance
    utterance: null,

    // Current text
    text: "",

    // Current voice
    voice: null,

    // Current rate
    rate: 1.0,

    /**
     * Get available voices
     * @returns {Promise<SpeechSynthesisVoice[]>} - Array of available voices
     */
    getVoices: async function () {
        return new Promise((resolve) => {
            // Check if voices are already available
            let voices = this.synth.getVoices();

            if (voices.length > 0) {
                resolve(voices);
                return;
            }

            // If voices are not available yet, wait for voiceschanged event
            this.synth.onvoiceschanged = () => {
                voices = this.synth.getVoices();
                resolve(voices);
            };

            // Fallback in case onvoiceschanged doesn't fire
            setTimeout(() => {
                voices = this.synth.getVoices();
                if (voices.length > 0) {
                    resolve(voices);
                } else {
                    resolve([]);
                }
            }, 1000);
        });
    },

    /**
     * Set the text to be spoken
     * @param {string} text - The text to speak
     */
    setText: function (text) {
        this.text = text;
        this.createUtterance();
    },

    /**
     * Set the voice by URI
     * @param {string} voiceURI - The URI of the voice to use
     */
    setVoice: async function (voiceURI) {
        const voices = await this.getVoices();
        this.voice = voices.find((v) => v.voiceURI === voiceURI) || null;

        if (this.utterance && this.voice) {
            this.utterance.voice = this.voice;
        }
    },

    /**
     * Set the speech rate
     * @param {number} rate - The speech rate (0.25 to 16)
     */
    setRate: function (rate) {
        this.rate = Math.max(0.25, Math.min(16, rate));

        if (this.utterance) {
            this.utterance.rate = this.rate;
        }
    },

    /**
     * Create a new utterance with current settings
     */
    createUtterance: function () {
        // Cancel any ongoing speech
        this.stop();

        // Create new utterance
        this.utterance = new SpeechSynthesisUtterance(this.text);

        // Set voice if available
        if (this.voice) {
            this.utterance.voice = this.voice;
        }

        // Set rate
        this.utterance.rate = this.rate;

        // Set language to match voice if available
        if (this.voice && this.voice.lang) {
            this.utterance.lang = this.voice.lang;
        }

        // Enable word boundary events for highlighting
        this.utterance.onboundary = this.utterance.onboundary || function () {};

        // Set other properties to improve word boundary detection
        this.utterance.pitch = 1.0;
        this.utterance.volume = 1.0;
    },

    /**
     * Play speech
     */
    play: function () {
        if (!this.utterance) {
            this.createUtterance();
        }

        // If speech is paused, resume it
        if (this.synth.paused) {
            this.synth.resume();
        } else {
            // Otherwise start new speech
            this.synth.speak(this.utterance);
        }
    },

    /**
     * Pause speech
     */
    pause: function () {
        if (this.synth.speaking) {
            this.synth.pause();
        }
    },

    /**
     * Stop speech
     */
    stop: function () {
        this.synth.cancel();
    },

    /**
     * Toggle between play and pause
     * @returns {boolean} - Whether speech is now playing (true) or paused (false)
     */
    togglePlayPause: function () {
        if (this.synth.speaking) {
            if (this.synth.paused) {
                this.synth.resume();
                return true;
            } else {
                this.synth.pause();
                return false;
            }
        } else {
            // If not speaking, start speaking
            this.play();
            return true;
        }
    },

    /**
     * Check if speech synthesis is currently speaking
     * @returns {boolean} - Whether speech synthesis is speaking
     */
    isSpeaking: function () {
        return this.synth.speaking;
    },

    /**
     * Check if speech synthesis is currently paused
     * @returns {boolean} - Whether speech synthesis is paused
     */
    isPaused: function () {
        return this.synth.paused;
    },
};

// Export the TTSUtils object
export { TTSUtils };
