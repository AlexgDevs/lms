from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from src.lesson.exceptions import LessonNotFoundError
from src.course.exceptions import CourseNotFoundError
from src.module.exceptions import ModuleNotFoundError
from src.lesson.schemas import (
    LessonCreateRequestSchema,
    LessonCreateSchema,
    LessonSchema,
    LessonUpdateRequestSchema,
    LessonUpdateSchema,
)
from src.lesson.unit_of_work import LessonUnitOfWork
from src.core.services import BaseService


class LessonService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        lesson_unit_of_work: LessonUnitOfWork,
    ):
        self.uow = lesson_unit_of_work
        super().__init__(session)

    async def create_lesson(
        self,
        course_id: UUID,
        module_id: UUID,
        user_id: UUID,
        payload: LessonCreateRequestSchema,
    ) -> LessonSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        next_order = await self.uow.lessons.get_count(module_id=module.id)

        create_data = LessonCreateSchema(
            **payload.model_dump(),
            course_id=course.id,
            module_id=module.id,
            order=next_order,
        )
        lesson = await self.uow.lessons.create(create_data)
        await self.uow.commit()
        return lesson

    async def update_lesson(
        self,
        lesson_id: UUID,
        module_id: UUID,
        course_id: UUID,
        owner_id: UUID,
        payload: LessonUpdateRequestSchema,
    ) -> LessonSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        lesson = await self.uow.lessons.get_one(
            id=lesson_id, module_id=module_id, course_id=course_id
        )
        if not lesson:
            raise LessonNotFoundError

        update_data = LessonUpdateSchema(
            **payload.model_dump(exclude_unset=True),
        )

        updated_lesson = await self.uow.lessons.update(lesson_id, update_data)
        await self.uow.commit()
        return updated_lesson

    async def delete_lesson(
        self,
        lesson_id: UUID,
        module_id: UUID,
        course_id: UUID,
        user_id: UUID,
    ) -> None:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        lesson = await self.uow.lessons.get_one(
            id=lesson_id, module_id=module_id, course_id=course_id
        )
        if not lesson:
            raise LessonNotFoundError

        await self.uow.lessons.delete(id_=lesson_id)
        await self.uow.commit()
