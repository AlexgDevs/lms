from uuid import UUID

from fastapi import APIRouter, status

from src.submissions.dependencies import BlockSubmissionServiceDep
from src.user.dependencies import UserIdDep
from src.submissions.schemas import (
    BlockSubmissionRequestCreateSchema,
    BlockSubmissionSchema,
)

router = APIRouter(
    prefix="/courses/{course_id}/lessons/{lesson_id}", tags=["Submissions"]
)


@router.post(
    "/submissions",
    response_model=list[BlockSubmissionSchema],
    status_code=status.HTTP_201_CREATED,
)
async def submit_lesson(
    course_id: UUID,
    lesson_id: UUID,
    payload: list[BlockSubmissionRequestCreateSchema],
    user_id: UserIdDep,
    service: BlockSubmissionServiceDep,
) -> list[BlockSubmissionSchema]:
    return await service.submit_blocks(
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=user_id,
        submissions=payload,
    )
