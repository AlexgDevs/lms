from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from src.auth.exceptions import InvalidAccessTokenError
from src.lesson.lesson_progress.schemas import (
    LessonProgressCreateSchema,
    LessonProgressSchema,
)
from src.lesson.enums import LessonProgressType
from src.lesson.exceptions import LessonNotFoundError, LessonProgressNotFoundError
from src.course.exceptions import CourseNotFoundError
from src.course.enums import CourseStatus
from src.module.exceptions import ModuleNotFoundError
from src.lesson.schemas import (
    LessonCreateRequestSchema,
    LessonCreateSchema,
    LessonSchema,
    LessonUpdateRequestSchema,
    LessonUpdateSchema,
    LessonReorderSchema,
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

    async def get_or_create_lesson_progress(
        self,
        user_id: UUID,
        lesson_id: UUID,
        only_get: bool = False,
    ) -> LessonProgressSchema:
        lesson = await self.uow.lessons_progress.get_one(
            user_id=user_id, lesson_id=lesson_id
        )

        if only_get:
            if not lesson:
                raise LessonProgressNotFoundError

            return lesson

        if lesson:
            return lesson

        data = LessonProgressCreateSchema(
            user_id=user_id,
            lesson_id=lesson_id,
            status=LessonProgressType.NOT_STARTED,
        )

        try:
            lesson_progress = await self.uow.lessons_progress.create(data)
            await self.uow.commit()
            return lesson_progress
        except IntegrityError:
            await self.uow.rollback()
            existing_progress = await self.uow.lessons_progress.get_one(
                user_id=user_id, lesson_id=lesson_id
            )

            if not existing_progress:
                raise LessonProgressNotFoundError

            return existing_progress

    async def get_all(
        self,
        course_id: UUID,
        module_id: UUID,
        user_id: UUID | None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[LessonSchema]:
        course = await self.uow.courses.get_one(
            id=course_id,
            is_deleted=None,
        )

        if not course:
            raise CourseNotFoundError

        if course.status != CourseStatus.PUBLISHED:
            if user_id is None or course.owner_id != user_id:
                raise CourseNotFoundError

        module = await self.uow.modules.get_one(
            id=module_id,
            course_id=course_id,
        )

        if not module:
            raise ModuleNotFoundError

        return list(
            await self.uow.lessons.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.lessons.model.order.asc(),
                course_id=course.id,
                module_id=module.id,
            )
        )

    async def get_all_by_owner(
        self,
        course_id: UUID,
        module_id: UUID,
        user_id: UUID | None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[LessonSchema]:
        if user_id is None:
            raise InvalidAccessTokenError

        course = await self.uow.courses.get_one(
            id=course_id,
            owner_id=user_id,
            is_deleted=None,
        )

        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(
            id=module_id,
            course_id=course_id,
        )

        if not module:
            raise ModuleNotFoundError

        return list(
            await self.uow.lessons.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.lessons.model.order.asc(),
                course_id=course.id,
                module_id=module.id,
            )
        )

    async def reorder(
        self,
        course_id: UUID,
        module_id: UUID,
        user_id: UUID,
        payload: LessonReorderSchema,
    ) -> list[LessonSchema]:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        await self.uow.lessons.set_order_bulk(
            module_id=module_id, course_id=course_id, ordered_ids=payload.ordered_ids
        )
        await self.uow.commit()

        return list(
            await self.uow.lessons.get_filtered(
                limit=1000,
                offset=0,
                order_by=self.uow.lessons.model.order.asc(),
                course_id=course.id,
                module_id=module.id,
            )
        )
