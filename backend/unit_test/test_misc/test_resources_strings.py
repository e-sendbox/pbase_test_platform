from app.resources import strings


def test_string_constants_are_defined() -> None:
    assert strings.USER_DOES_NOT_EXIST_ERROR
    assert strings.ARTICLE_DOES_NOT_EXIST_ERROR
    assert strings.ARTICLE_ALREADY_EXISTS
    assert strings.USER_IS_NOT_AUTHOR_OF_ARTICLE
    assert strings.INCORRECT_LOGIN_INPUT
    assert strings.USERNAME_TAKEN
    assert strings.EMAIL_TAKEN
    assert strings.UNABLE_TO_FOLLOW_YOURSELF
    assert strings.UNABLE_TO_UNSUBSCRIBE_FROM_YOURSELF
    assert strings.USER_IS_NOT_FOLLOWED
    assert strings.USER_IS_ALREADY_FOLLOWED
    assert strings.WRONG_TOKEN_PREFIX
    assert strings.MALFORMED_PAYLOAD
    assert strings.ARTICLE_IS_ALREADY_FAVORITED
    assert strings.ARTICLE_IS_NOT_FAVORITED
    assert strings.COMMENT_DOES_NOT_EXIST
    assert strings.AUTHENTICATION_REQUIRED
