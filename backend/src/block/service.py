from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.block.enums import BlockType
from src.block.exceptions import BlockNotFoundError, BlockTypeNotMediaError
from src.course.exceptions import CourseNotFoundError
from src.lesson.exceptions import LessonNotFoundError
from src.core.services.base_service import BaseService
from src.core.storage import Storage
from src.block.unit_of_work import BlockUnitOfWork
from src.media.exceptions import MediaForbiddenError, MediaNotFoundError
from src.media.media_attachment.enums import MediaOwnerType
from src.media.schemas import MediaSchema
from src.media.service import MediaService
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
        media_service: MediaService,
    ):
        self.uow = block_unit_of_work
        self.storage = storage
        self.media_service = media_service
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

        old_media_ids = [
            attachment.media_id
            for attachment in await self.uow.media_attachments.get_for_owner(
                "block", block_id
            )
        ]

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

        if old_media_ids:
            await self.media_service.cleanup_unreferenced(old_media_ids)
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

        media_ids = [
            attachment.media_id
            for attachment in await self.uow.media_attachments.get_for_owner(
                "block", block_id
            )
        ]

        await self.uow.media_attachments.detach_all(
            owner_type="block", owner_id=block_id
        )
        await self.uow.blocks.delete(id_=block_id)
        await self.uow.commit()

        if media_ids:
            await self.media_service.cleanup_unreferenced(media_ids)
            await self.uow.commit()

    async def upload_media(
        self,
        block_id: UUID,
        lesson_id: UUID,
        course_id: UUID,
        user_id: UUID,
        *,
        data: bytes,
        original_name: str,
        content_type: str,
        is_public: bool = True,
    ) -> BlockSchema:
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

        if block.block_type not in MEDIA_BLOCK_TYPES:
            raise BlockTypeNotMediaError

        old_media_ids = [
            attachment.media_id
            for attachment in await self.uow.media_attachments.get_for_owner(
                "block", block_id
            )
        ]

        media = await self.media_service.create_media(
            user_id=user_id,
            data=data,
            original_name=original_name,
            content_type=content_type,
            is_public=is_public,
            commit=False,
        )

        try:
            await self.uow.media_attachments.detach_all(
                owner_type="block", owner_id=block_id
            )
            await self.uow.media_attachments.attach(
                media_id=media.id,
                owner_type="block",
                owner_id=block_id,
                role="content",
                position=0,
            )

            payload = self._media_payload(block.block_type, block.payload, media)
            updated_block = await self.uow.blocks.update(
                block_id, BlockUpdateSchema(payload=payload)
            )

            await self.uow.commit()
        except BaseException:
            await self.media_service.delete_media_file(media.storage_key)
            raise

        if old_media_ids:
            await self.media_service.cleanup_unreferenced(old_media_ids)
            await self.uow.commit()

        return (await self._resolve_block_urls([updated_block]))[0]

    def _media_payload(
        self,
        block_type: BlockType,
        current_payload: dict[str, Any],
        media: MediaSchema,
    ) -> dict[str, Any]:
        payload = {**current_payload}
        payload["media_id"] = str(media.id)
        payload["url"] = self._media_url(media)
        if block_type is BlockType.FILE:
            payload["file_name"] = media.original_name
            payload["file_size"] = media.size_bytes
        return payload

    def _media_url(self, media: MediaSchema) -> str | None:
        if media.is_public:
            return self.storage.get_public_url(media.storage_key)
        return None

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
        media_blocks = [
            block for block in blocks if block.block_type in MEDIA_BLOCK_TYPES
        ]
        if not media_blocks:
            return blocks

        attachments = await self.uow.media_attachments.get_for_owners(
            MediaOwnerType.BLOCK.value, [block.id for block in media_blocks]
        )
        media_ids = {attachment.media_id for attachment in attachments}
        if not media_ids:
            return blocks

        medias = {
            media.id: media
            for media in await self.uow.media.get_by_ids(list(media_ids))
        }

        block_media_ids = {
            attachment.owner_id: attachment.media_id for attachment in attachments
        }

        for block in media_blocks:
            media_id = block_media_ids.get(block.id)
            if media_id is None:
                continue
            media = medias.get(media_id)
            if media is None:
                continue
            if media.is_public:
                block.payload["url"] = self.storage.get_public_url(media.storage_key)
            else:
                block.payload["url"] = await self.storage.get_presigned_url(
                    media.storage_key
                )
        return blocks
