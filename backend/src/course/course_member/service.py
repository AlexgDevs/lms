from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.services import BaseService
from src.course.enums import CourseMemberRole
from src.course.exceptions import CourseMemberNotFoundError
from src.course.course_member.schemas import (
    CourseMemberCreateSchema,
    CourseMemberSchema,
    CourseMemberUpdateSchema,
    CourseUpdateMemberRole,
)
from src.course.course_member.unit_of_work import CourseMemberUnitOfWork


class CourseMemberService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        course_member_unit_of_work: CourseMemberUnitOfWork,
    ) -> None:
        super().__init__(session)
        self.uow = course_member_unit_of_work

    async def create_member(
        self,
        user_id: UUID,
        course_id: UUID,
        role: CourseMemberRole = CourseMemberRole.MEMBER,
        is_commit: bool = True,
    ) -> CourseMemberSchema:
        member_data = CourseMemberCreateSchema(
            course_id=course_id,
            user_id=user_id,
            role=role,
        )

        member = await self.uow.course_members.create(member_data)
        if is_commit:
            await self.uow.commit()

        return member

    async def mark_as_left(
        self, course_member_id: UUID, left_at: datetime
    ) -> CourseMemberSchema:
        member = await self.uow.course_members.get_one(
            user_id=course_member_id, left_at=None
        )
        if not member:
            raise CourseMemberNotFoundError

        update_schema = CourseMemberUpdateSchema(left_at=left_at)
        state = await self.uow.course_members.update(member.id, update_schema)
        await self.uow.commit()
        return state

    async def update_role(
        self, course_member_id: UUID, role: CourseMemberRole
    ) -> CourseMemberSchema:
        member = await self.uow.course_members.get_one(user_id=course_member_id)
        if not member:
            raise CourseMemberNotFoundError

        update_schema = CourseUpdateMemberRole(role=role)
        state = await self.uow.course_members.update(member.id, update_schema)
        await self.uow.commit()
        return state
