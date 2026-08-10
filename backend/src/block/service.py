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
    BlockReorderSchema,
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

        next_order = await self.uow.blocks.get_count(lesson_id=lesson.id)

        create_data = BlockCreateSchema(
            **payload.model_dump(),
            course_id=course.id,
            lesson_id=lesson.id,
            order=next_order,
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

    async def get_all(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> list[BlockSchema]:
        course = await self.uow.courses.get_one(
            id=course_id,
            is_deleted=None,  # TODO: add draft type
        )

        if not course:
            raise CourseNotFoundError

        member = await self.uow.courses.get_course_where_user_is_member(
            course_id=course_id,
            user_id=user_id,
        )

        if not member:
            raise CourseNotFoundError

        lesson = await self.uow.lessons.get_one(
            id=lesson_id,
            course_id=course_id,
        )

        if not lesson:
            raise LessonNotFoundError

        return list(
            await self.uow.blocks.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.blocks.model.order.asc(),
                course_id=course.id,
                lesson_id=lesson.id,
            )
        )

    async def get_all_by_owner(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> list[BlockSchema]:
        course = await self.uow.courses.get_one(
            id=course_id,
            owner_id=user_id,
            is_deleted=None,
        )

        if not course:
            raise CourseNotFoundError

        lesson = await self.uow.lessons.get_one(
            id=lesson_id,
            course_id=course_id,
        )

        if not lesson:
            raise LessonNotFoundError

        return list(
            await self.uow.blocks.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.blocks.model.order.asc(),
                course_id=course.id,
                lesson_id=lesson.id,
            )
        )

    async def reorder(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
        payload: BlockReorderSchema,
    ) -> list[BlockSchema]:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        await self.uow.blocks.set_order_bulk(
            lesson_id=lesson_id, ordered_ids=payload.ordered_ids
        )
        await self.uow.commit()

        return list(
            await self.uow.blocks.get_filtered(
                limit=1000,
                offset=0,
                order_by=self.uow.blocks.model.order.asc(),
                course_id=course.id,
                lesson_id=lesson.id,
            )
        )
