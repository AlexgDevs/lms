from src.core.mappers import BaseMapper
from src.user.models import User
from src.user.schemas import UserSchema


class UserMapper(BaseMapper[User, UserSchema]):
    orm_model = User
    schema_class = UserSchema
