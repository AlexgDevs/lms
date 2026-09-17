from uuid import UUID

from sqlalchemy import select, update

from src.core.repositories import BaseRepository
from src.user.models import User
from src.user.schemas import UserSchema
from src.user.mappers import UserMapper


class UserRepository(BaseRepository[User, UserSchema]):
    model = User
    schema = UserSchema
    mapper = UserMapper

    async def get_by_ids(self, ids: list[UUID]) -> list[UserSchema]:
        if not ids:
            return []
        query = select(self.model).where(self.model.id.in_(ids))
        result = await self.session.execute(query)
        return [self.mapper.to_schema(m) for m in result.scalars().all()]

    async def consume_ai_course_generation(self, user_id: UUID, limit: int) -> bool:
        """Atomically reserve one free AI course generation.

        Increments ``ai_course_generations`` only if it is below ``limit``.
        Returns True when the slot was reserved, False when the limit is reached.
        """
        statement = (
            update(User)
            .where(User.id == user_id, User.ai_course_generations < limit)
            .values(ai_course_generations=User.ai_course_generations + 1)
            .returning(User.id)
        )
        result = await self.session.execute(statement)
        return result.scalars().first() is not None
