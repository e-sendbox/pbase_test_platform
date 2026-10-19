import pytest
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from httpx import AsyncClient
from pydantic import BaseModel, ValidationError
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from app.api.errors.validation_error import http422_error_handler

pytestmark = pytest.mark.asyncio


class _Sample(BaseModel):
    n: int


async def test_http422_handler_with_request_validation_error() -> None:
    try:
        _Sample(n="not-int")  # type: ignore[arg-type]
    except ValidationError as pydantic_exc:
        exc = RequestValidationError(
            pydantic_exc.raw_errors,
            body=getattr(pydantic_exc, "model", None),
        )
        resp = await http422_error_handler(None, exc)  # type: ignore[arg-type]
        assert resp.status_code == HTTP_422_UNPROCESSABLE_ENTITY
        body = resp.body.decode()
        assert "errors" in body


async def test_http422_handler_with_pydantic_validation_error() -> None:
    try:
        _Sample(n="not-int")  # type: ignore[arg-type]
    except ValidationError as exc:
        resp = await http422_error_handler(None, exc)
    assert resp.status_code == HTTP_422_UNPROCESSABLE_ENTITY
