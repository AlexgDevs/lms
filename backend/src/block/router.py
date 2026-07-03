from uuid import UUID
from fastapi import APIRouter, status

from src.submissions.schemas import BlockSubmissionRequestCreateSchema
from src.user.dependencies import UserIdDep
from src.block.dependencies import BlockServiceDep
from src.block.schemas import (
    BlockSchema,
    BlockCreateRequestSchema,
    BlockUpdateRequestSchema,
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
