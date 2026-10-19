import datetime

from pydantic import BaseModel, Field, validator


class DateTimeModelMixin(BaseModel):
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

    @validator("created_at", "updated_at", pre=True)
    def default_datetime(
        cls,  # noqa: N805
        value: datetime.datetime,  # noqa: WPS110
    ) -> datetime.datetime:
        return value if value is not None else datetime.datetime.now()


class IDModelMixin(BaseModel):
    id_: int = Field(0, alias="id")
