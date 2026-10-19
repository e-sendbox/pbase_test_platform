import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

pytestmark = pytest.mark.asyncio


async def test_frw_validation_error_format(app: FastAPI):
    @app.get("/wrong_path/{param}")
    def route_for_test(param: int) -> None:  # pragma: no cover
        pass

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/wrong_path/asd")

    assert response.status_code == HTTP_422_UNPROCESSABLE_ENTITY

    error_data = response.json()
    assert "errors" in error_data
