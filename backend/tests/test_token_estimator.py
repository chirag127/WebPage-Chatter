import pytest
from app.services.token_estimator import estimate_tokens

def test_estimate_tokens_empty_string():
    """Test token estimation for an empty string."""
    assert estimate_tokens("") == 0

def test_estimate_tokens_short_text():
    """Test token estimation for a short text."""
    text = "This is a short test text."
    # The exact token count may vary, but it should be proportional to text length
    assert estimate_tokens(text) > 0
    assert estimate_tokens(text) <= len(text)

def test_estimate_tokens_long_text():
    """Test token estimation for a longer text."""
    # Generate a longer text
    text = "This is a test. " * 100
    # The exact token count may vary, but it should be proportional to text length
    assert estimate_tokens(text) > 0
    assert estimate_tokens(text) <= len(text)

def test_estimate_tokens_special_characters():
    """Test token estimation for text with special characters."""
    text = "Special characters: !@#$%^&*()_+{}|:<>?[]\\;',./~`"
    # The exact token count may vary, but it should be proportional to text length
    assert estimate_tokens(text) > 0
    assert estimate_tokens(text) <= len(text)
