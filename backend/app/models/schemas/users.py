from typing import Optional, Any

from pydantic import BaseModel, EmailStr, HttpUrl, root_validator

from app.models.domain.users import User
from app.models.schemas.rwschema import RWSchema


class UserInLogin(RWSchema):
    email: EmailStr
    password: str


class UserInCreate(UserInLogin):
    username: str


class UserInUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    bio: Optional[str] = None
    image: Optional[HttpUrl] = None


class UserWithToken(User):
    token: str

    @root_validator(pre=True)
    def coerce_null_image(cls, values: dict[str, Any]) -> dict[str, Any]: #FIX
        # Pact / RealWorld expect "" for unset profile image, not JSON null
        if isinstance(values, dict) and values.get("image") is None:
            values["image"] = "/avatar.svg" # FIX
        return values


class UserInResponse(RWSchema):
    user: UserWithToken