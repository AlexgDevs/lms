from uuid import UUID

from fastapi import APIRouter, status

from src.user.dependencies import UserIdDep
from src.lesson.dependencies import LessonServiceDep
from src.lesson.lesson_progress.schemas import LessonProgressSchema

router = APIRouter(prefix="/lessons/{lesson_id}/progress", tags=["Lessons Progress"])
course_progress_router = APIRouter(
    prefix="/courses/{course_id}/progress", tags=["Lessons Progress"]
)


@router.post(
    "",
    response_model=LessonProgressSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    service: LessonServiceDep,
    lesson_id: UUID,
    user_id: UserIdDep,
) -> LessonProgressSchema:
    return await service.get_or_create_lesson_progress(
        lesson_id=lesson_id, user_id=user_id
    )


@course_progress_router.get("", response_model=list[LessonProgressSchema])
async def get_course_progress(
    course_id: UUID,
    service: LessonServiceDep,
    user_id: UserIdDep,
) -> list[LessonProgressSchema]:
    return await service.get_course_progress(course_id=course_id, user_id=user_id)
