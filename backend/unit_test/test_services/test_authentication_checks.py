from unittest.mock import AsyncMock

import pytest

from app.db.errors import EntityDoesNotExist
from app.db.repositories.users import UsersRepository
from app.models.domain.users import UserInDB
from app.services.authentication import check_email_is_taken, check_username_is_taken

pytestmark = pytest.mark.asyncio


async def test_check_username_is_taken_false() -> None:
    repo = AsyncMock(spec=UsersRepository)
    repo.get_user_by_username.side_effect = EntityDoesNotExist
    assert await check_username_is_taken(repo, "nobody") is False


async def test_check_username_is_taken_true() -> None:
    repo = AsyncMock(spec=UsersRepository)
    repo.get_user_by_username.return_value = UserInDB(
        username="u",
        email="u@e.com",
        hashed_password="h",
    )
    assert await check_username_is_taken(repo, "u") is True


async def test_check_email_is_taken_false() -> None:
    repo = AsyncMock(spec=UsersRepository)
    repo.get_user_by_email.side_effect = EntityDoesNotExist
    assert await check_email_is_taken(repo, "x@y.z") is False


async def test_check_email_is_taken_true() -> None:
    repo = AsyncMock(spec=UsersRepository)
    repo.get_user_by_email.return_value = UserInDB(
        username="u",
        email="u@e.com",
        hashed_password="h",
    )
    assert await check_email_is_taken(repo, "u@e.com") is True
