from app.models.domain.rwmodel import convert_field_to_camel_case
from app.models.schemas.rwschema import RWSchema


def test_convert_field_to_camel_case_single_word() -> None:
    assert convert_field_to_camel_case("user") == "user"


def test_convert_field_to_camel_case_snake() -> None:
    assert convert_field_to_camel_case("user_name") == "userName"


def test_rw_schema_config_orm_mode() -> None:
    assert RWSchema.Config.orm_mode is True
