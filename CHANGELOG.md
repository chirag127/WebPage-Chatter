# Changelog

All notable changes to the WebPage Chatter project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-05-17

### Changed

-   Switched from streaming to non-streaming mode for Gemini API responses
-   Updated backend API to use synchronous `generate_content()` method instead of `generate_content_stream()`
-   Modified frontend code to handle complete responses rather than processing chunks
-   Improved error handling for API responses

### Fixed

-   Resolved "Stream interrupted" errors by eliminating streaming-related issues

## [1.0.0] - 2025-05-16

### Added

-   Initial release of WebPage Chatter browser extension
-   Backend API using FastAPI for Gemini integration
-   Extension features:
    -   Sidebar UI for chat interaction
    -   Comprehensive webpage content extraction (text, metadata, URL, title, image alt text)
    -   Integration with Gemini API via backend proxy
    -   User-provided Gemini API key management
    -   Primary AI Model: `gemini-2.5-flash-preview-04-17`
    -   Fallback AI Model: `gemini-2.0-flash-lite` for large content
    -   Text-to-Speech (TTS) for AI responses
    -   TTS settings: speed (0.25x - 16x), voice selection
    -   Saving chat answers/sessions to browser local storage
    -   Extension activation: toolbar icon, context menu, keyboard shortcut
    -   Settings page for API key and TTS configuration
-   Documentation:
    -   Comprehensive README with installation and usage instructions
    -   Initial CHANGELOG
