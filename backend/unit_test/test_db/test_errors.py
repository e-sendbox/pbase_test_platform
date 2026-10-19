from app.db.errors import EntityDoesNotExist


def test_entity_does_not_exist_is_exception() -> None:
    exc = EntityDoesNotExist()
    assert isinstance(exc, Exception)
