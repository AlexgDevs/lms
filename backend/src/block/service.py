from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.block.enums import BlockType
from src.block.exceptions import BlockNotFoundError
from src.course.exceptions import CourseNotFoundError
from src.lesson.exceptions import LessonNotFoundError
from src.core.services.base_service import BaseService
from src.core.storage import Storage
from src.block.unit_of_work import BlockUnitOfWork
from src.media.exceptions import MediaForbiddenError, MediaNotFoundError
from src.block.schemas import (
    BlockCreateRequestSchema,
    BlockCreateSchema,
    BlockSchema,
    BlockUpdateRequestSchema,
    BlockUpdateSchema,
    BlockReorderSchema,
)

MEDIA_BLOCK_TYPES = frozenset(
    {BlockType.IMAGE, BlockType.VIDEO, BlockType.AUDIO, BlockType.FILE}
)


class BlockService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        block_unit_of_work: BlockUnitOfWork,
        storage: Storage,
    ):
        self.uow = block_unit_of_work
        self.storage = storage
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

        media_id = await self._validate_and_prepare_media(
            block_type=payload.block_type,
            payload_data=payload.payload,
            user_id=user_id,
        )

        create_data = BlockCreateSchema(
            **payload.model_dump(),
            course_id=course.id,
            lesson_id=lesson.id,
            order=next_order,
        )
        block = await self.uow.blocks.create(create_data)

        if media_id is not None:
            await self.uow.media_attachments.attach(
                media_id=media_id,
                owner_type="block",
                owner_id=block.id,
                role="content",
                position=0,
            )

        await self.uow.commit()
        return (await self._resolve_block_urls([block]))[0]

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

        effective_type = update_data.block_type or block.block_type
        effective_payload = block.payload
        if update_data.payload is not None:
            effective_payload = {**block.payload, **update_data.payload}

        media_id = await self._validate_and_prepare_media(
            block_type=effective_type,
            payload_data=effective_payload,
            user_id=owner_id,
        )

        updated_block = await self.uow.blocks.update(block_id, update_data)

        await self.uow.media_attachments.detach_all(
            owner_type="block", owner_id=block_id
        )
        if media_id is not None:
            await self.uow.media_attachments.attach(
                media_id=media_id,
                owner_type="block",
                owner_id=block_id,
                role="content",
                position=0,
            )

        await self.uow.commit()
        return (await self._resolve_block_urls([updated_block]))[0]

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

        await self.uow.media_attachments.detach_all(
            owner_type="block", owner_id=block_id
        )
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

        blocks = list(
            await self.uow.blocks.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.blocks.model.order.asc(),
                course_id=course.id,
                lesson_id=lesson.id,
            )
        )
        return await self._resolve_block_urls(blocks)

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

        blocks = list(
            await self.uow.blocks.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.blocks.model.order.asc(),
                course_id=course.id,
                lesson_id=lesson.id,
            )
        )
        return await self._resolve_block_urls(blocks)

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

        blocks = list(
            await self.uow.blocks.get_filtered(
                limit=1000,
                offset=0,
                order_by=self.uow.blocks.model.order.asc(),
                course_id=course.id,
                lesson_id=lesson.id,
            )
        )
        return await self._resolve_block_urls(blocks)

    async def _validate_and_prepare_media(
        self,
        block_type: BlockType,
        payload_data: dict[str, Any],
        user_id: UUID,
    ) -> UUID | None:
        if block_type not in MEDIA_BLOCK_TYPES:
            return None

        media_id_raw = payload_data.get("media_id")
        if not media_id_raw:
            return None

        media_id = UUID(str(media_id_raw))
        media = await self.uow.media.get_one(id=media_id)
        if not media:
            raise MediaNotFoundError
        if media.owner_id != user_id:
            raise MediaForbiddenError
        return media.id

    async def _resolve_block_urls(self, blocks: list[BlockSchema]) -> list[BlockSchema]:
        media_ids: set[UUID] = set()
        for block in blocks:
            if block.block_type not in MEDIA_BLOCK_TYPES:
                continue
            raw = block.payload.get("media_id")
            if not raw:
                continue
            try:
                media_ids.add(UUID(str(raw)))
            except ValueError:
                continue

        if not media_ids:
            return blocks

        medias = {
            media.id: media
            for media in await self.uow.media.get_by_ids(list(media_ids))
        }

        for block in blocks:
            if block.block_type not in MEDIA_BLOCK_TYPES:
                continue
            raw = block.payload.get("media_id")
            if not raw:
                continue
            try:
                media = medias.get(UUID(str(raw)))
            except ValueError:
                continue
            if media is None:
                continue
            if media.is_public:
                block.payload["url"] = self.storage.get_public_url(media.storage_key)
            else:
                block.payload["url"] = await self.storage.get_presigned_url(
                    media.storage_key
                )
        return blocks
