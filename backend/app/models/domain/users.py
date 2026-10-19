from typing import Optional

from app.models.common import DateTimeModelMixin, IDModelMixin
from app.models.domain.rwmodel import RWModel
from app.services import security


class User(RWModel):
    username: str
    email: str
    bio: str = ""
    image: Optional[str] = None


class UserInDB(IDModelMixin, DateTimeModelMixin, User):
    salt: str = ""
    hashed_password: str = ""

    def check_password(self, password: str) -> bool:
        # passlib.bcrypt хеш хранит соль внутри hash, отдельная "salt" в БД
        # здесь не участвует в проверке
        return security.verify_password(password, self.hashed_password)

    def change_password(self, password: str) -> None:
        self.salt = security.generate_salt()
        self.hashed_password = security.get_password_hash(password)
