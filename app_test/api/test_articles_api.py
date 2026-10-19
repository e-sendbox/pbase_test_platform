"""
API Tests for Articles Endpoints

Tests the /api/articles endpoints using requests library.
"""

import pytest
import requests
import os

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_URL = f"{BASE_URL}/api"


class TestArticlesAPI:
    """Test articles-related API endpoints"""

    def test_get_articles_list(self):
        """Test getting list of articles"""
        response = requests.get(f"{API_URL}/articles?limit=10&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert "articlesCount" in data
        assert isinstance(data["articles"], list)

    def test_get_articles_with_pagination(self):
        """Test pagination parameters"""
        response = requests.get(f"{API_URL}/articles?limit=5&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert len(data["articles"]) <= 5

    def test_get_single_article(self):
        """Test getting a single article by slug"""
        # First get list of articles
        list_response = requests.get(f"{API_URL}/articles?limit=1")
        assert list_response.status_code == 200

        articles = list_response.json()["articles"]
        if len(articles) > 0:
            slug = articles[0]["slug"]

            # Get specific article
            response = requests.get(f"{API_URL}/articles/{slug}")
            assert response.status_code == 200

            data = response.json()
            assert "article" in data
            assert data["article"]["slug"] == slug

    def test_create_article_with_auth(self):
        """Test creating an article with authentication"""
        # Login first
        login_response = requests.post(
            f"{API_URL}/users/login",
            json={"user": {"email": "demo@example.com", "password": "password123"}},
        )
        assert login_response.status_code == 200
        token = login_response.json()["user"]["token"]

        # Create article
        import time

        response = requests.post(
            f"{API_URL}/articles",
            headers={"Authorization": f"Token {token}"},
            json={
                "article": {
                    "title": f"API Test Article {int(time.time())}",
                    "description": "This article was created by API test",
                    "body": "Test article body content",
                    "tagList": ["test", "api"],
                }
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert "article" in data
        assert "slug" in data["article"]
        assert data["article"]["title"].startswith("API Test Article")

    def test_create_article_without_auth(self):
        """Test creating article without authentication fails"""
        response = requests.post(
            f"{API_URL}/articles",
            json={
                "article": {
                    "title": "Unauthorized Article",
                    "description": "Should fail",
                    "body": "Test",
                    "tagList": [],
                }
            },
        )

        assert response.status_code in [401, 403, 422]

    def test_get_tags(self):
        """Test getting all tags"""
        response = requests.get(f"{API_URL}/tags")

        assert response.status_code == 200
        data = response.json()
        assert "tags" in data
        assert isinstance(data["tags"], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
