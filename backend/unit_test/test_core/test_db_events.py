from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI

from app.core.settings.app import AppSettings
from app.db.events import close_db_connection, connect_to_db
from pydantic import SecretStr


pytestmark = pytest.mark.asyncio


async def test_close_db_connection_closes_pool() -> None:
    app = FastAPI()
    pool = AsyncMock()
    pool.close = AsyncMock()
    app.state.pool = pool
    await close_db_connection(app)
    pool.close.assert_awaited_once()


async def test_connect_to_db_sets_pool() -> None:
    app = FastAPI()
    fake_pool = object()
    settings = AppSettings(
        database_url="postgresql://postgres@localhost:5432/x",
        secret_key=SecretStr("secret"),
        min_connection_count=1,
        max_connection_count=1,
    )
    with patch("app.db.events.asyncpg.create_pool", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = fake_pool
        await connect_to_db(app, settings)
    mock_create.assert_awaited_once()
    assert app.state.pool is fake_pool
