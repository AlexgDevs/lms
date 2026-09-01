from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, File, Form, UploadFile, status

from src.user.dependencies import UserIdDep
from src.block.dependencies import BlockServiceDep
from src.block.schemas import (
    BlockSchema,
    BlockCreateRequestSchema,
    BlockUpdateRequestSchema,
    BlockReorderSchema,
)

router = APIRouter(
    prefix="/courses/{course_id}/lessons/{lesson_id}/blocks", tags=["Blocks"]
)


@router.post(
    "",
    response_model=BlockSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_block(
    course_id: UUID,
    lesson_id: UUID,
    payload: BlockCreateRequestSchema,
    service: BlockServiceDep,
    user_id: UserIdDep,
) -> BlockSchema:
    return await service.create_block(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=user_id,
        payload=payload,
    )


@router.patch("/reorder", response_model=list[BlockSchema])
async def reorder_blocks(
    course_id: UUID,
    lesson_id: UUID,
    payload: BlockReorderSchema,
    service: BlockServiceDep,
    user_id: UserIdDep,
) -> list[BlockSchema]:
    return await service.reorder(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=user_id,
        payload=payload,
    )


@router.patch(
    "/{block_id}",
    response_model=BlockSchema,
)
async def update_block(
    course_id: UUID,
    lesson_id: UUID,
    block_id: UUID,
    payload: BlockUpdateRequestSchema,
    service: BlockServiceDep,
    user_id: UserIdDep,
) -> BlockSchema:
    return await service.update_block(
        block_id=block_id,
        lesson_id=lesson_id,
        course_id=course_id,
        owner_id=user_id,
        payload=payload,
    )


@router.post("/{block_id}/media", response_model=BlockSchema)
async def upload_block_media(
    course_id: UUID,
    lesson_id: UUID,
    block_id: UUID,
    service: BlockServiceDep,
    user_id: UserIdDep,
    file: Annotated[UploadFile, File()],
    is_public: Annotated[bool, Form()] = True,
) -> BlockSchema:
    return await service.upload_media(
        block_id=block_id,
        lesson_id=lesson_id,
        course_id=course_id,
        user_id=user_id,
        data=await file.read(),
        original_name=file.filename or "untitled",
        content_type=file.content_type or "application/octet-stream",
        is_public=is_public,
    )


@router.delete(
    "/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_block(
    course_id: UUID,
    lesson_id: UUID,
    block_id: UUID,
    service: BlockServiceDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_block(
        block_id=block_id,
        lesson_id=lesson_id,
        course_id=course_id,
        user_id=user_id,
    )


@router.get("")
async def get_blocks(
    course_id: UUID,
    lesson_id: UUID,
    user_id: UserIdDep,
    service: BlockServiceDep,
    only_created: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> list[BlockSchema]:
    if only_created:
        return await service.get_all_by_owner(
            course_id=course_id,
            lesson_id=lesson_id,
            user_id=user_id,
            limit=limit,
            offset=offset,
        )

    return await service.get_all(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
