from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.course.course_member.schemas import (
    CourseMemberCreateSchema,
    CourseMemberSchema,
)
from src.core.services.base_service import BaseService
from src.course.exceptions import CourseMemberAlredyEnrolledError, CourseNotFoundError
from src.course.schemas import (
    CourseCreateRequestSchema,
    CourseCreateSchema,
    CourseSchema,
    CourseUpdateRequestSchema,
    CourseUpdateSchema,
    CourseUserBriefSchema,
)
from src.course.unit_of_work import CourseUnitOfWork


class CourseService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        course_unit_of_work: CourseUnitOfWork,  # TODO: add payment service in uow
    ):
        self.uow = course_unit_of_work
        super().__init__(session)

    async def create_course(
        self,
        owner_id: UUID,
        payload: CourseCreateRequestSchema,
    ) -> CourseSchema:
        create_data = CourseCreateSchema(
            **payload.model_dump(exclude_unset=True),
            owner_id=owner_id,
        )

        course = await self.uow.courses.create(create_data)
        await self.uow.commit()
        return course

    async def update_course(
        self,
        course_id: UUID,
        owner_id: UUID,
        payload: CourseUpdateRequestSchema,
    ) -> CourseSchema:
        update_data_dict = payload.model_dump(exclude_unset=True)
        update_data = CourseUpdateSchema(
            **update_data_dict,
        )

        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        course = await self.uow.courses.update(course_id, update_data)
        await self.uow.commit()
        return course

    async def delete_course(self, course_id: UUID, owner_id: UUID) -> None:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        delete_data = CourseUpdateSchema(
            **course.model_dump(), is_deleted=datetime.now(timezone.utc)
        )

        await self.uow.courses.update(course_id, delete_data)
        await self.uow.commit()

    async def get_courses_where_user_member(
        self, user_id: UUID
    ) -> list[CourseUserBriefSchema]:
        return await self.uow.courses.get_courses_where_user_is_member(user_id)

    async def enroll(self, course_id: UUID, user_id: UUID) -> CourseMemberSchema:
        member = await self.uow.members.get_one(
            user_id=user_id, course_id=course_id, left_at=None
        )
        if member:
            raise CourseMemberAlredyEnrolledError

        # TODO: creating payment and other services

        data = CourseMemberCreateSchema(course_id=course_id, user_id=user_id)
        new_member = await self.uow.members.create(data=data)

        await self.uow.commit()
        return new_member
