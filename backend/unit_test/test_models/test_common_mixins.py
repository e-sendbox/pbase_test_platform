import datetime

from app.models.common import DateTimeModelMixin, IDModelMixin


def test_datetime_mixin_uses_now_when_missing() -> None:
    class M(DateTimeModelMixin):
        pass

    m = M()
    assert m.created_at is not None
    assert m.updated_at is not None
    assert isinstance(m.created_at, datetime.datetime)


def test_datetime_mixin_preserves_explicit_values() -> None:
    class M(DateTimeModelMixin):
        pass

    dt = datetime.datetime(2020, 1, 2, 3, 4, 5)
    m = M(created_at=dt, updated_at=dt)
    assert m.created_at == dt
    assert m.updated_at == dt


def test_id_model_mixin_default() -> None:
    class M(IDModelMixin):
        pass

    m = M()
    assert m.id_ == 0
