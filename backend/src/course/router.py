from typing import Literal, Sequence

from fastapi import APIRouter, status
from src.course.course_member.schemas import CourseMemberSchema
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


@router.get("")
async def get_courses(
    user_id: UserIdDep,
    service: CourseServiceDep,
    filter: Literal["all", "created", "my"] = "all",
    limit: int = 10,
    offset: int = 0,
) -> Sequence[CourseSchema] | list[CourseUserBriefSchema]:
    if filter == "created":
        return await service.uow.courses.get_filtered(  # TODO: add service layer
            owner_id=user_id,
            limit=limit,
            offset=offset,
        )

    if filter == "my":
        return await service.get_courses_where_user_member(user_id)

    return await service.uow.courses.get_filtered(
        limit=limit, offset=offset
    )  # TODO: add status draft and then who has this status - become vanish


@router.get("/{course_id}")  # TODO: add course where user is member
async def get_course_by_id(
    course_id: UUID,
    user_id: UserIdDep,
    service: CourseServiceDep,
    filter: Literal["current", "author", "my"] = "current",
) -> CourseSchema | CourseUserBriefSchema:
    match filter:
        case "author":
            return await service.get_author_course_by_id(course_id, user_id)

        case "my":
            return await service.get_course_where_user_member(course_id, user_id)

        case "current" | _:
            return await service.get_course_by_id(
                course_id  # TODO: add status published/draft
            )


@router.post("/{course_id}/members")
async def create_member(
    user_id: UserIdDep, course_id: UUID, service: CourseServiceDep
) -> CourseMemberSchema:
    return await service.enroll(course_id=course_id, user_id=user_id)
