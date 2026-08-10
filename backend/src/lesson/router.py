from uuid import UUID
from fastapi import APIRouter, status

from src.user.dependencies import UserIdDep
from src.lesson.dependencies import LessonServiceDep
from src.lesson.schemas import (
    LessonSchema,
    LessonCreateRequestSchema,
    LessonUpdateRequestSchema,
    LessonReorderSchema,
)

router = APIRouter(
    prefix="/courses/{course_id}/modules/{module_id}/lessons", tags=["Lessons"]
)


@router.post(
    "",
    response_model=LessonSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    course_id: UUID,
    module_id: UUID,
    payload: LessonCreateRequestSchema,
    service: LessonServiceDep,
    user_id: UserIdDep,
) -> LessonSchema:
    return await service.create_lesson(
        course_id=course_id,
        module_id=module_id,
        user_id=user_id,
        payload=payload,
    )


@router.patch("/reorder", response_model=list[LessonSchema])
async def reorder_lessons(
    course_id: UUID,
    module_id: UUID,
    payload: LessonReorderSchema,
    service: LessonServiceDep,
    user_id: UserIdDep,
) -> list[LessonSchema]:
    return await service.reorder(
        course_id=course_id,
        module_id=module_id,
        user_id=user_id,
        payload=payload,
    )


@router.patch(
    "/{lesson_id}",
    response_model=LessonSchema,
)
async def update_lesson(
    course_id: UUID,
    module_id: UUID,
    lesson_id: UUID,
    payload: LessonUpdateRequestSchema,
    service: LessonServiceDep,
    user_id: UserIdDep,
) -> LessonSchema:
    return await service.update_lesson(
        lesson_id=lesson_id,
        module_id=module_id,
        course_id=course_id,
        owner_id=user_id,
        payload=payload,
    )


@router.delete(
    "/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_lesson(
    course_id: UUID,
    module_id: UUID,
    lesson_id: UUID,
    service: LessonServiceDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_lesson(
        lesson_id=lesson_id,
        module_id=module_id,
        course_id=course_id,
        user_id=user_id,
    )


@router.get("")
async def get_lessons(
    course_id: UUID,
    module_id: UUID,
    user_id: UserIdDep,
    service: LessonServiceDep,
    only_created: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> list[LessonSchema]:
    if only_created:
        return await service.get_all_by_owner(
            course_id=course_id,
            module_id=module_id,
            user_id=user_id,
            limit=limit,
            offset=offset,
        )

    return await service.get_all(
        course_id=course_id,
        module_id=module_id,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
