import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test the root endpoint returns the expected response."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to WebPage Chatter API", "status": "active"}

def test_health_check():
    """Test the health check endpoint returns a healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_chat_endpoint_missing_api_key():
    """Test the chat endpoint returns an error when API key is missing."""
    response = client.post(
        "/api/chat",
        json={
            "api_key": "",
            "webpage_content": "Test content",
            "query": "Test query"
        }
    )
    assert response.status_code == 401
    assert "Invalid API key" in response.text

def test_chat_endpoint_invalid_request():
    """Test the chat endpoint returns an error when request is invalid."""
    response = client.post(
        "/api/chat",
        json={
            # Missing required fields
            "api_key": "test_key"
        }
    )
    assert response.status_code == 422  # Unprocessable Entity
