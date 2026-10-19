from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI

from app.core.events import create_start_app_handler, create_stop_app_handler

pytestmark = pytest.mark.asyncio


async def test_start_app_handler_calls_connect_to_db() -> None:
    app = FastAPI()
    settings = object()
    handler = create_start_app_handler(app, settings)  # type: ignore[arg-type]
    with patch("app.core.events.connect_to_db", new_callable=AsyncMock) as mock_connect:
        await handler()
    mock_connect.assert_awaited_once_with(app, settings)


async def test_stop_app_handler_calls_close_db() -> None:
    app = FastAPI()
    handler = create_stop_app_handler(app)
    with patch("app.core.events.close_db_connection", new_callable=AsyncMock) as mock_close:
        await handler()
    mock_close.assert_awaited_once_with(app)
