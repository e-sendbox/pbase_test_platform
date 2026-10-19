"""
Pact Provider States Endpoint

This endpoint is called by Pact verifier to set up the required state
before verifying each interaction.
"""

from typing import Optional, Dict, Any

from asyncpg import Connection
from fastapi import APIRouter, Body, Request
from loguru import logger
from pydantic import BaseModel
from pydantic import SecretStr
from app.core.config import get_app_settings
import app.services.jwt as jwt_service 

# EntityDoesNotExist импортирован, но если не используется — Mypy может ворчать. 
# Оставим, если планируешь расширять.
from app.db.errors import EntityDoesNotExist
from app.db.repositories.articles import ArticlesRepository
from app.db.repositories.users import UsersRepository

router = APIRouter()

PACT_TEST_EMAIL = "test@example.com"
PACT_TEST_USERNAME = "testuser"
PACT_TEST_PASSWORD = "password123"
PACT_REGISTER_EMAIL = "newuser@example.com"
PACT_LIST_ARTICLE_SLUG = "how-to-train-your-dragon"

class ProviderStateRequest(BaseModel):
    state: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

async def _delete_user_by_email(conn: Connection, email: str) -> None:
    row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
    if not row:
        return
    uid = row["id"]
    # Удаляем все зависимости пользователя, чтобы избежать ошибок Foreign Key
    await conn.execute("DELETE FROM commentaries WHERE author_id = $1 OR article_id IN (SELECT id FROM articles WHERE author_id = $1)", uid)
    await conn.execute("DELETE FROM favorites WHERE user_id = $1 OR article_id IN (SELECT id FROM articles WHERE author_id = $1)", uid)
    await conn.execute("DELETE FROM articles_to_tags WHERE article_id IN (SELECT id FROM articles WHERE author_id = $1)", uid)
    await conn.execute("DELETE FROM articles WHERE author_id = $1", uid)
    await conn.execute("DELETE FROM followers_to_followings WHERE follower_id = $1 OR following_id = $1", uid)
    await conn.execute("DELETE FROM users WHERE id = $1", uid)

# ИСПРАВЛЕНО: удалена лишняя 'a' в async
async def _reset_pact_user(conn: Connection, users_repo: UsersRepository) -> None:
    """Гарантирует чистого юзера с ID=1 и паролем password123"""
    await _delete_user_by_email(conn, PACT_TEST_EMAIL)

    # КРИТИЧНО: Сбрасываем счетчик ID, чтобы наш тест-юзер всегда получал ID=1.
    # Это решает проблему, когда токен в пакте выписан на ID=1, а база выдает 2, 3 и т.д.
    await conn.execute("ALTER SEQUENCE users_id_seq RESTART WITH 1")

    await users_repo.create_user(
        username=PACT_TEST_USERNAME,
        email=PACT_TEST_EMAIL,
        password=PACT_TEST_PASSWORD,
    )

async def _reset_list_article(
    conn: Connection,
    users_repo: UsersRepository,
    articles_repo: ArticlesRepository,
) -> None:
    """Гарантирует чистую статью с правильными тегами"""
    await _reset_pact_user(conn, users_repo)
    user = await users_repo.get_user_by_username(username=PACT_TEST_USERNAME)

    await conn.execute("DELETE FROM articles WHERE slug = $1", PACT_LIST_ARTICLE_SLUG)

    await articles_repo.create_article(
        slug=PACT_LIST_ARTICLE_SLUG,
        title="How to train your dragon",
        description="Ever wonder how?",
        body="It takes a Jacobian",
        author=user,
        tags=["dragons", "training"],
    )


@router.post("/_pact/provider-states", tags=["pact"])
async def setup_provider_state(
    http_request: Request,
    state_request: ProviderStateRequest = Body(...),
) -> Dict[str, Any]:
    settings = get_app_settings()
    state = (state_request.state or "").strip()
    logger.info(f">>>> [PACT_DEBUG] Received request for state: '{state}'")

    pool = http_request.app.state.pool

    async with pool.acquire() as conn:
        users_repo = UsersRepository(conn)
        articles_repo = ArticlesRepository(conn)

        if state == "a user exists with email test@example.com":
            await _reset_pact_user(conn, users_repo)
            logger.info(f">>>> [PACT_DEBUG] User {PACT_TEST_EMAIL} created/reset.")

        elif state == "no user exists with email newuser@example.com":
            await _delete_user_by_email(conn, PACT_REGISTER_EMAIL)
            logger.info(f">>>> [PACT_DEBUG] User {PACT_REGISTER_EMAIL} deleted if existed.")

        elif state == "articles exist in the system":
            await _reset_list_article(conn, users_repo, articles_repo)
            logger.info(f">>>> [PACT_DEBUG] Articles state initialized.")

        elif state == "user is authenticated":
            await _reset_pact_user(conn, users_repo)
            user = await users_repo.get_user_by_email(email=PACT_TEST_EMAIL)
            if not user:  # pragma: no cover — defensive; reset should always create user
                logger.error(">>>> [PACT_ERROR] User not found after reset!")
                raise Exception("User not found")

            secret_set = settings.secret_key
            if hasattr(secret_set, "get_secret_value"):
                secret_val = secret_set.get_secret_value()
            else:
                secret_val = "test-secret-key-test-secret-key-00000000"
            
            token = jwt_service.create_access_token_for_user(user, secret_val)

            logger.info(f">>>> [PACT_SUCCESS] Token generated for {user.email}")
            return {"token": token}

        else: 
            logger.warning(f">>>> [PACT_DEBUG] Unknown state received: '{state}'")

    logger.info(f">>>> [PACT_DEBUG] Finished setting up state: '{state}'")
    return {"result": "success", "message": f"State '{state}' applied"}

