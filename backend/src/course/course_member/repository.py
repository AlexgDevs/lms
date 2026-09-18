from uuid import UUID

from sqlalchemy import select

from src.core.repositories import BaseRepository
from src.course.models import CourseMember
from src.course.course_member.mappers import CourseMemberMapper
from src.course.course_member.schemas import (
    CourseMemberSchema,
)


class CourseMemberRepository(BaseRepository[CourseMember, CourseMemberSchema]):
    model = CourseMember
    schema = CourseMemberSchema
    mapper = CourseMemberMapper

    async def has_ever_enrolled(self, user_id: UUID, course_id: UUID) -> bool:
        query = (
            select(self.model.id)
            .where(
                self.model.user_id == user_id,
                self.model.course_id == course_id,
            )
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalars().first() is not None
