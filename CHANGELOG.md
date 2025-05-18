# Changelog

All notable changes to the WebPage Chatter project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-05-24

### Added

-   Added visual timer that displays elapsed processing time in seconds
-   Enhanced loading indicator with animated clock icon for better user feedback
-   Improved user experience by providing clear feedback during long-running operations

## [1.6.0] - 2025-05-23

### Added

-   Added manual refresh button to the webpage info section for explicit context refreshing
-   Improved text-to-speech functionality to consistently apply speed settings from user preferences
-   Enhanced visual feedback when manually refreshing the context

### Fixed

-   Fixed issue where text-to-speech speed settings weren't consistently applied when clicking TTS buttons in responses

## [1.5.0] - 2025-05-22

### Added

-   Added automatic context refresh when:
    -   Switching between browser tabs
    -   Refreshing the current webpage
    -   Navigating to a new URL within the same tab
-   Added webpage info display in the chat interface showing current URL and title
-   Added visual indicator when context is being refreshed
-   Added system messages to notify users when context has been updated

### Changed

-   Improved user experience by eliminating the need for manual refresh when navigating
-   Enhanced the sidebar UI with a dedicated section for webpage information

## [1.4.0] - 2025-05-21

### Added

-   Added "Load Chat" button to each chat history entry
-   Implemented functionality to load historical chats into the current chat interface
-   Added visual indicator when a historical chat is loaded
-   Added "New Chat" button to easily start a fresh chat after loading a historical one
-   Enhanced error handling for chat loading operations

## [1.3.1] - 2025-05-20

### Fixed

-   Fixed UI issue with "Clear All" button in Chat History modal being cut off
-   Improved responsive layout of the Chat History search and actions area
-   Enhanced button styling for better visibility and usability

## [1.3.0] - 2025-05-19

### Added

-   Implemented automatic chat history saving feature
-   Added Chat History button with count badge in the sidebar header
-   Created comprehensive Chat History modal with:
    -   Chronological list of past conversations organized by date and webpage title
    -   Expandable conversation view to see full content
    -   Search functionality to find conversations by keyword or website
    -   Pagination for browsing through extensive history
    -   Individual and bulk deletion options
-   Added storage usage indicator with warnings when approaching limits
-   Implemented error handling for storage limitations

### Changed

-   Improved storage management with automatic saving of chat sessions
-   Enhanced UI with new icons and visual indicators

## [1.2.0] - 2025-05-18

### Added

-   Added direct link to the official Gemini API key page in the settings
-   Added TTS button at the top of each assistant response message
-   Added Markdown rendering for Gemini API responses
-   Increased maximum TTS speed option from 4x to 16x

### Changed

-   Updated backend to format Gemini API responses as Markdown
-   Enhanced UI with better styling for Markdown elements (headings, code blocks, lists, etc.)

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
