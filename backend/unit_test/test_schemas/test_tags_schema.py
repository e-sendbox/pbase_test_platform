from app.models.schemas.tags import TagsInList


def test_tags_in_list_model() -> None:
    m = TagsInList(tags=["a", "b"])
    assert m.tags == ["a", "b"]
