import os
import uuid
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.services import BaseService
from src.core.storage import Storage
from src.media.exceptions import (
    MediaForbiddenError,
    MediaInUseError,
    MediaNotFoundError,
    MediaTooLargeError,
    MediaTypeNotAllowedError,
)
from src.media.schemas import (
    MediaCreateSchema,
    MediaSchema,
    MediaUrlResponseSchema,
)
from src.media.unit_of_work import MediaUnitOfWork


class MediaService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        media_unit_of_work: MediaUnitOfWork,
        storage: Storage,
    ) -> None:
        self.uow = media_unit_of_work
        self.storage = storage
        super().__init__(session)

    async def create_media(
        self,
        user_id: UUID,
        *,
        data: bytes,
        original_name: str,
        content_type: str,
        is_public: bool = True,
    ) -> MediaSchema:
        self._validate_size(len(data))
        self._validate_content_type(content_type)

        media_id = uuid.uuid4()
        extension = os.path.splitext(original_name)[1].lower()
        storage_key = f"media/{media_id}{extension}"

        await self.storage.upload_bytes(storage_key, data, content_type)
        meta = await self.storage.get_metadata(storage_key)

        create_data = MediaCreateSchema(
            id=media_id,
            owner_id=user_id,
            original_name=original_name,
            storage_key=storage_key,
            content_type=content_type,
            size_bytes=len(data),
            etag=meta.etag if meta else None,
            is_public=is_public,
        )

        try:
            media = await self.uow.media.create(create_data)
            await self.uow.commit()
        except BaseException:
            await self._delete_orphaned_object(storage_key)
            raise

        return media

    async def get_media(self, media_id: UUID, user_id: UUID) -> MediaSchema:
        media = await self.uow.media.get_one(id=media_id)
        if not media:
            raise MediaNotFoundError
        if not media.is_public and media.owner_id != user_id:
            raise MediaForbiddenError
        return media

    async def list_my_media(
        self, user_id: UUID, limit: int = 100, offset: int = 0
    ) -> list[MediaSchema]:
        return list(
            await self.uow.media.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.media.model.created_at.desc(),
                owner_id=user_id,
            )
        )

    async def delete_media(self, media_id: UUID, user_id: UUID) -> None:
        media = await self._get_owned_media(media_id, user_id)
        if await self.uow.media_attachments.is_referenced(media_id):
            raise MediaInUseError
        await self.storage.delete(media.storage_key)
        await self.uow.media.delete(id_=media_id)
        await self.uow.commit()

    async def get_media_url(
        self, media_id: UUID, user_id: UUID, expires_in: int = 900
    ) -> MediaUrlResponseSchema:
        media = await self.get_media(media_id, user_id)
        url: str | None
        if media.is_public:
            url = self.storage.get_public_url(media.storage_key)
        else:
            url = await self.storage.get_presigned_url(
                media.storage_key, expires_in=expires_in
            )
        return MediaUrlResponseSchema(url=url)

    async def _get_owned_media(self, media_id: UUID, user_id: UUID) -> MediaSchema:
        media = await self.uow.media.get_one(id=media_id)
        if not media:
            raise MediaNotFoundError
        if media.owner_id != user_id:
            raise MediaForbiddenError
        return media

    async def _delete_orphaned_object(self, storage_key: str) -> None:
        try:
            await self.storage.delete(storage_key)
        except Exception:
            ...

    def _validate_size(self, size: int) -> None:
        if size > settings.media.MEDIA_MAX_SIZE_MB * 1024 * 1024:
            raise MediaTooLargeError

    def _validate_content_type(self, content_type: str) -> None:
        allowed = settings.media.MEDIA_ALLOWED_TYPES
        if content_type in allowed:
            return
        prefix = f"{content_type.split('/')[0]}/*"
        if prefix in allowed:
            return
        raise MediaTypeNotAllowedError
