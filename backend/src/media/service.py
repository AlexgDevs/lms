import mimetypes
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
    MediaResponseSchema,
    MediaSchema,
    MediaUrlResponseSchema,
)
from src.media.unit_of_work import MediaUnitOfWork

# Server-side extension assignment per allowed content type. The client-supplied
# filename extension is never used for the storage key, so a spoofed `.html`/
# `.php` upload cannot be served as an executable content type.
_MEDIA_EXTENSION_BY_TYPE: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
}

# Leading-byte signatures of active content that must never be served as an
# uploaded "media" file (defense-in-depth against spoofed content types).
_DANGEROUS_SIGNATURES: tuple[bytes, ...] = (
    b"<!doctype html",
    b"<html",
    b"<?php",
    b"<script",
    b"<svg",
)


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
        commit: bool = True,
    ) -> MediaSchema:
        """Upload a file and persist a ``Media`` row.

        With ``commit=False`` the row is added to the session but not committed;
        the caller owns the transaction and must clean up the file on failure
        (via :meth:`delete_media_file`).
        """
        self._validate_size(len(data))
        self._validate_content_type(content_type)
        self._reject_dangerous_bytes(data)

        media_id = uuid.uuid4()
        extension = self._safe_extension(content_type)
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
            if commit:
                await self.uow.commit()
        except BaseException:
            await self.delete_media_file(storage_key)
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
        url = await self._resolve_url(media, expires_in=expires_in)
        return MediaUrlResponseSchema(url=url)

    async def to_response(self, media: MediaSchema) -> MediaResponseSchema:
        return MediaResponseSchema(
            id=media.id,
            owner_id=media.owner_id,
            original_name=media.original_name,
            url=await self._resolve_url(media),
            content_type=media.content_type,
            size_bytes=media.size_bytes,
            etag=media.etag,
            is_public=media.is_public,
            created_at=media.created_at,
            updated_at=media.updated_at,
        )

    async def to_response_list(
        self, medias: list[MediaSchema]
    ) -> list[MediaResponseSchema]:
        return [await self.to_response(media) for media in medias]

    async def _resolve_url(
        self, media: MediaSchema, expires_in: int = 900
    ) -> str | None:
        if media.is_public:
            return self.storage.get_public_url(media.storage_key)
        return await self.storage.get_presigned_url(
            media.storage_key, expires_in=expires_in
        )

    async def _get_owned_media(self, media_id: UUID, user_id: UUID) -> MediaSchema:
        media = await self.uow.media.get_one(id=media_id)
        if not media:
            raise MediaNotFoundError
        if media.owner_id != user_id:
            raise MediaForbiddenError
        return media

    async def delete_media_file(self, storage_key: str) -> None:
        """Best-effort deletion of an uploaded file (orphan cleanup)."""
        try:
            await self.storage.delete(storage_key)
        except Exception:
            ...

    async def cleanup_unreferenced(self, media_ids: list[UUID]) -> None:
        """Delete media (file + row) that is no longer referenced by any
        attachment. Does not commit — the caller commits."""
        for media_id in media_ids:
            if await self.uow.media_attachments.is_referenced(media_id):
                continue
            media = await self.uow.media.get_one(id=media_id)
            if not media:
                continue
            await self.storage.delete(media.storage_key)
            await self.uow.media.delete(id_=media_id)

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

    def _reject_dangerous_bytes(self, data: bytes) -> None:
        head = data[:512].lstrip().lower()
        if any(head.startswith(sig) for sig in _DANGEROUS_SIGNATURES):
            raise MediaTypeNotAllowedError

    def _safe_extension(self, content_type: str) -> str:
        extension = _MEDIA_EXTENSION_BY_TYPE.get(content_type)
        if extension is not None:
            return extension
        return mimetypes.guess_extension(content_type) or ".bin"
