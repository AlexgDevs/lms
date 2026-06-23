from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.block.exceptions import BlockNotFoundError
from src.course.exceptions import CourseNotFoundError
from src.lesson.exceptions import LessonNotFoundError
from src.core.services.base_service import BaseService
from src.block.unit_of_work import BlockUnitOfWork
from src.block.schemas import (
    BlockCreateRequestSchema,
    BlockCreateSchema,
    BlockSchema,
    BlockUpdateRequestSchema,
    BlockUpdateSchema,
)


class BlockService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        block_unit_of_work: BlockUnitOfWork,
    ):
        self.uow = block_unit_of_work
        super().__init__(session)

    async def create_block(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
        payload: BlockCreateRequestSchema,
    ) -> BlockSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        create_data = BlockCreateSchema(
            **payload.model_dump(),
            course_id=course.id,
            lesson_id=lesson.id,
        )
        block = await self.uow.blocks.create(create_data)
        await self.uow.commit()
        return block

    async def update_block(
        self,
        block_id: UUID,
        lesson_id: UUID,
        course_id: UUID,
        owner_id: UUID,
        payload: BlockUpdateRequestSchema,
    ) -> BlockSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        block = await self.uow.blocks.get_one(
            id=block_id, lesson_id=lesson_id, course_id=course_id
        )
        if not block:
            raise BlockNotFoundError

        update_data = BlockUpdateSchema(
            **payload.model_dump(exclude_unset=True),
        )

        updated_block = await self.uow.blocks.update(block_id, update_data)
        await self.uow.commit()
        return updated_block

    async def delete_block(
        self,
        block_id: UUID,
        lesson_id: UUID,
        course_id: UUID,
        user_id: UUID,
    ) -> None:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        block = await self.uow.blocks.get_one(
            id=block_id, lesson_id=lesson_id, course_id=course_id
        )
        if not block:
            raise BlockNotFoundError

        await self.uow.blocks.delete(id_=block_id)
        await self.uow.commit()
