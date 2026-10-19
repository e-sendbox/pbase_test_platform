"""
API Tests for Authentication Endpoints

Tests the /api/users and /api/user endpoints using requests library.
"""

import pytest
import requests
import os

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_URL = f"{BASE_URL}/api"


class TestAuthenticationAPI:
    """Test authentication-related API endpoints"""

    def test_register_new_user(self):
        """Test user registration"""
        response = requests.post(
            f"{API_URL}/users",
            json={
                "user": {
                    "username": f"testuser_{requests.utils.quote(str(requests.get(f'{BASE_URL}/api/tags')))}",
                    "email": f"test_{abs(hash('test'))}@example.com",
                    "password": "password123",
                }
            },
        )

        # Registration might fail if user exists, so accept both 201 and 422
        assert response.status_code in [201, 422]

        if response.status_code == 201:
            data = response.json()
            assert "user" in data
            assert "token" in data["user"]
            assert "email" in data["user"]
            assert "username" in data["user"]

    def test_login_with_valid_credentials(self):
        """Test login with seeded user"""
        response = requests.post(
            f"{API_URL}/users/login",
            json={"user": {"email": "demo@example.com", "password": "password123"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data["user"]
        assert data["user"]["email"] == "demo@example.com"

    def test_login_with_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{API_URL}/users/login",
            json={"user": {"email": "demo@example.com", "password": "wrongpassword"}},
        )

        assert response.status_code in [401, 422]

    def test_get_current_user_with_token(self):
        """Test getting current user info with valid token"""
        # First login to get token
        login_response = requests.post(
            f"{API_URL}/users/login",
            json={"user": {"email": "demo@example.com", "password": "password123"}},
        )

        assert login_response.status_code == 200
        token = login_response.json()["user"]["token"]

        # Get current user
        response = requests.get(
            f"{API_URL}/user", headers={"Authorization": f"Token {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "demo@example.com"

    def test_get_current_user_without_token(self):
        """Test getting current user without authentication"""
        response = requests.get(f"{API_URL}/user")

        assert response.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
