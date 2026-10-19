from typing import Optional

from pydantic import validator

from app.models.domain.rwmodel import RWModel


class Profile(RWModel):
    username: str
    bio: str = ""
    image: Optional[str] = None
    following: bool = False

    @validator("image", pre=True)
    def empty_image_json(cls, value: Optional[str]) -> str:
        return "" if value is None else value
