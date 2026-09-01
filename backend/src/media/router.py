from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, Form, UploadFile, status

from src.media.dependencies import MediaServiceDep
from src.media.schemas import MediaResponseSchema, MediaUrlResponseSchema
from src.user.dependencies import AuthenticatedUserIdDep

router = APIRouter(prefix="/media", tags=["Media"])


@router.post(
    "", response_model=MediaResponseSchema, status_code=status.HTTP_201_CREATED
)
async def upload_media(
    service: MediaServiceDep,
    user_id: AuthenticatedUserIdDep,
    file: Annotated[UploadFile, File()],
    is_public: Annotated[bool, Form()] = True,
) -> MediaResponseSchema:
    data = await file.read()
    media = await service.create_media(
        user_id=user_id,
        data=data,
        original_name=file.filename or "untitled",
        content_type=file.content_type or "application/octet-stream",
        is_public=is_public,
    )
    return await service.to_response(media)


@router.get("", response_model=list[MediaResponseSchema])
async def get_my_media(
    service: MediaServiceDep,
    user_id: AuthenticatedUserIdDep,
    limit: int = 100,
    offset: int = 0,
) -> list[MediaResponseSchema]:
    medias = await service.list_my_media(user_id=user_id, limit=limit, offset=offset)
    return await service.to_response_list(medias)


@router.get("/{media_id}", response_model=MediaResponseSchema)
async def get_media(
    media_id: UUID,
    service: MediaServiceDep,
    user_id: AuthenticatedUserIdDep,
) -> MediaResponseSchema:
    media = await service.get_media(media_id=media_id, user_id=user_id)
    return await service.to_response(media)


@router.get("/{media_id}/url", response_model=MediaUrlResponseSchema)
async def get_media_url(
    media_id: UUID,
    service: MediaServiceDep,
    user_id: AuthenticatedUserIdDep,
    expires_in: int = 900,
) -> MediaUrlResponseSchema:
    return await service.get_media_url(
        media_id=media_id, user_id=user_id, expires_in=expires_in
    )


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: UUID,
    service: MediaServiceDep,
    user_id: AuthenticatedUserIdDep,
) -> None:
    await service.delete_media(media_id=media_id, user_id=user_id)
