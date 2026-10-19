from app.models.schemas.users import UserWithToken


def test_user_with_token_coerces_null_image_to_default() -> None:
    user = UserWithToken(
        username="u",
        email="u@e.com",
        token="tok",
        image=None,
    )
    assert user.image == "/avatar.svg"
