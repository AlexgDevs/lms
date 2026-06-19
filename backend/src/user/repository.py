from src.core.repositories import BaseRepository
from src.user.models import User
from src.user.schemas import UserSchema
from src.user.mappers import UserMapper


class UserRepository(BaseRepository[User, UserSchema]):
    model = User
    schema = UserSchema
    mapper = UserMapper
