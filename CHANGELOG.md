# Changelog

All notable changes to the WebPage Chatter project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-16

### Added

- Initial release of WebPage Chatter browser extension
- Backend API using FastAPI for Gemini integration
- Extension features:
  - Sidebar UI for chat interaction
  - Comprehensive webpage content extraction (text, metadata, URL, title, image alt text)
  - Integration with Gemini API via backend proxy
  - User-provided Gemini API key management
  - Primary AI Model: `gemini-2.5-flash-preview-04-17`
  - Fallback AI Model: `gemini-2.0-flash-lite` for large content
  - Text-to-Speech (TTS) for AI responses
  - TTS settings: speed (0.25x - 16x), voice selection
  - Saving chat answers/sessions to browser local storage
  - Extension activation: toolbar icon, context menu, keyboard shortcut
  - Settings page for API key and TTS configuration
- Documentation:
  - Comprehensive README with installation and usage instructions
  - Initial CHANGELOG
