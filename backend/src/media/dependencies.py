from typing import Annotated, AsyncGenerator

from fastapi import Depends

from src.core.dependencies import SessionDep, StorageDep
from src.media.media_attachment.repository import MediaAttachmentRepository
from src.media.repository import MediaRepository
from src.media.service import MediaService
from src.media.unit_of_work import MediaUnitOfWork


def get_media_repository(session: SessionDep) -> MediaRepository:
    return MediaRepository(session)


MediaRepositoryDep = Annotated[MediaRepository, Depends(get_media_repository)]


def get_media_attachment_repository(
    session: SessionDep,
) -> MediaAttachmentRepository:
    return MediaAttachmentRepository(session)


MediaAttachmentRepositoryDep = Annotated[
    MediaAttachmentRepository, Depends(get_media_attachment_repository)
]


async def get_media_uow(
    session: SessionDep,
    media_repository: MediaRepositoryDep,
    media_attachment_repository: MediaAttachmentRepositoryDep,
) -> AsyncGenerator[MediaUnitOfWork]:
    async with MediaUnitOfWork(
        session=session,
        media_repository=media_repository,
        media_attachment_repository=media_attachment_repository,
    ) as uow:
        yield uow


MediaUnitOfWorkDep = Annotated[MediaUnitOfWork, Depends(get_media_uow)]


def get_media_service(
    session: SessionDep,
    uow: MediaUnitOfWorkDep,
    storage: StorageDep,
) -> MediaService:
    return MediaService(
        session=session,
        media_unit_of_work=uow,
        storage=storage,
    )


MediaServiceDep = Annotated[MediaService, Depends(get_media_service)]
