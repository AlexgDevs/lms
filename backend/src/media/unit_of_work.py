from sqlalchemy.ext.asyncio import AsyncSession

from src.core.unit_of_work import BaseUnitOfWork
from src.media.media_attachment.repository import MediaAttachmentRepository
from src.media.repository import MediaRepository


class MediaUnitOfWork(BaseUnitOfWork):
    def __init__(
        self,
        session: AsyncSession,
        media_repository: MediaRepository,
        media_attachment_repository: MediaAttachmentRepository,
    ) -> None:
        super().__init__(session)
        self.media = media_repository
        self.media_attachments = media_attachment_repository

    def _uow_marker(self) -> None:
        pass
