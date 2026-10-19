from unittest.mock import AsyncMock

import pytest

from app.db.errors import EntityDoesNotExist
from app.db.repositories.articles import ArticlesRepository
from app.models.domain.articles import Article
from app.models.domain.profiles import Profile
from app.models.domain.users import User
from app.services.articles import (
    check_article_exists,
    check_user_can_modify_article,
    get_slug_for_article,
)


@pytest.mark.asyncio
async def test_check_article_exists_false_when_missing() -> None:
    repo = AsyncMock(spec=ArticlesRepository)
    repo.get_article_by_slug.side_effect = EntityDoesNotExist
    assert await check_article_exists(repo, "missing-slug") is False


@pytest.mark.asyncio
async def test_check_article_exists_true_when_present() -> None:
    author = Profile(username="author", bio="", image=None)
    article = Article(
        slug="slug",
        title="t",
        description="d",
        body="b",
        tags=[],
        author=author,
        favorited=False,
        favorites_count=0,
    )
    repo = AsyncMock(spec=ArticlesRepository)
    repo.get_article_by_slug.return_value = article
    assert await check_article_exists(repo, "slug") is True


def test_get_slug_for_article_slugifies() -> None:
    assert get_slug_for_article("Hello World") == "hello-world"


def test_check_user_can_modify_article_same_author() -> None:
    author = Profile(username="a", bio="", image=None)
    article = Article(
        slug="s",
        title="t",
        description="d",
        body="b",
        tags=[],
        author=author,
        favorited=False,
        favorites_count=0,
    )
    user = User(username="a", email="a@x.com")
    assert check_user_can_modify_article(article, user) is True


def test_check_user_can_not_modify_other_user_article() -> None:
    author = Profile(username="a", bio="", image=None)
    article = Article(
        slug="s",
        title="t",
        description="d",
        body="b",
        tags=[],
        author=author,
        favorited=False,
        favorites_count=0,
    )
    user = User(username="b", email="b@x.com")
    assert check_user_can_modify_article(article, user) is False
