from fastapi import APIRouter, Query, status
from src.course.schemas import (
    CourseSchema,
    CourseCreateRequestSchema,
    CourseUpdateRequestSchema,
    CourseUserBriefSchema,
)
from src.course.dependencies import CourseServiceDep
from src.user.dependencies import UserIdDep
from uuid import UUID

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreateRequestSchema,
    course_service: CourseServiceDep,
    owner_id: UserIdDep,
) -> CourseSchema:
    return await course_service.create_course(owner_id=owner_id, payload=payload)


@router.patch("/{course_id}", response_model=CourseSchema)
async def update_course(
    course_id: UUID,
    payload: CourseUpdateRequestSchema,
    course_service: CourseServiceDep,
    owner_id: UserIdDep,
) -> CourseSchema:
    return await course_service.update_course(
        course_id=course_id, owner_id=owner_id, payload=payload
    )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    course_service: CourseServiceDep,
    owner_id: UserIdDep,
) -> None:
    await course_service.delete_course(course_id=course_id, owner_id=owner_id)


@router.get("/created")
async def get_created_courses(
    user_id: UserIdDep,
    service: CourseServiceDep,
    limit: int = 10,
    offset: int = 0,
) -> list[CourseSchema]:
    return await service.uow.courses.get_filtered(  # TODO: add local method they don't viled SOLID layers
        owner_id=user_id,
        limit=limit,
        offset=offset,
    )


@router.get("")
async def get_my_courses(
    user_id: UserIdDep, service: CourseServiceDep
) -> list[CourseUserBriefSchema]:
    return await service.get_courses_where_user_member(user_id)
