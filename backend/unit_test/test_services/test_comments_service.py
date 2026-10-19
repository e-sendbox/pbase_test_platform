from app.models.domain.comments import Comment
from app.models.domain.profiles import Profile
from app.models.domain.users import User
from app.services.comments import check_user_can_modify_comment


def test_check_user_can_modify_own_comment() -> None:
    author = Profile(username="a", bio="", image=None)
    comment = Comment(body="b", author=author)
    user = User(username="a", email="a@x.com")
    assert check_user_can_modify_comment(comment, user) is True


def test_check_user_can_not_modify_foreign_comment() -> None:
    author = Profile(username="a", bio="", image=None)
    comment = Comment(body="b", author=author)
    user = User(username="b", email="b@x.com")
    assert check_user_can_modify_comment(comment, user) is False
