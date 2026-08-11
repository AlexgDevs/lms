from typing import Sequence
from uuid import UUID

from sqlalchemy import delete, func, select

from src.core.repositories import BaseRepository
from src.media.media_attachment.mappers import MediaAttachmentMapper
from src.media.media_attachment.models import MediaAttachment
from src.media.media_attachment.schemas import (
    MediaAttachmentCreateSchema,
    MediaAttachmentSchema,
)


class MediaAttachmentRepository(BaseRepository[MediaAttachment, MediaAttachmentSchema]):
    model = MediaAttachment
    schema = MediaAttachmentSchema
    mapper = MediaAttachmentMapper

    async def attach(
        self,
        media_id: UUID,
        owner_type: str,
        owner_id: UUID,
        role: str = "content",
        position: int = 0,
    ) -> MediaAttachmentSchema:
        return await self.create(
            MediaAttachmentCreateSchema(
                media_id=media_id,
                owner_type=owner_type,
                owner_id=owner_id,
                role=role,
                position=position,
            )
        )

    async def detach_all(self, owner_type: str, owner_id: UUID) -> None:
        statement = delete(self.model).where(
            self.model.owner_type == owner_type,
            self.model.owner_id == owner_id,
        )
        await self.session.execute(statement)

    async def get_for_owner(
        self, owner_type: str, owner_id: UUID
    ) -> Sequence[MediaAttachmentSchema]:
        return await self.get_filtered(
            limit=1000, offset=0, owner_type=owner_type, owner_id=owner_id
        )

    async def get_for_owners(
        self, owner_type: str, owner_ids: Sequence[UUID]
    ) -> Sequence[MediaAttachmentSchema]:
        statement = select(self.model).where(
            self.model.owner_type == owner_type,
            self.model.owner_id.in_(owner_ids),
        )
        return await self._execute_and_map_all(statement)

    async def get_media_ids_for_owner(
        self, owner_type: str, owner_id: UUID
    ) -> list[UUID]:
        attachments = await self.get_for_owner(owner_type, owner_id)
        return [attachment.media_id for attachment in attachments]

    async def is_referenced(self, media_id: UUID) -> bool:
        count = await self.session.scalar(
            select(func.count())
            .select_from(self.model)
            .where(self.model.media_id == media_id)
        )
        return bool(count)

    async def get_owners(self, media_id: UUID) -> Sequence[MediaAttachmentSchema]:
        return await self.get_filtered(limit=1000, offset=0, media_id=media_id)
