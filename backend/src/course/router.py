from typing import Annotated, Literal, Sequence

from fastapi import APIRouter, File, Form, Query, UploadFile, status
from src.course.course_member.schemas import CourseMemberSchema
from src.course.schemas import (
    CourseSchema,
    CourseCreateRequestSchema,
    CourseGenerateSchema,
    CourseGenerateResponseSchema,
    CourseModerationQueueSchema,
    CourseModerationRejectSchema,
    CourseUpdateRequestSchema,
    CourseUserBriefSchema,
)
from src.course.dependencies import CourseServiceDep
from src.user.dependencies import OptionalUserIdDep, StaffDep, UserIdDep
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


@router.post("/{course_id}/submit", response_model=CourseSchema)
async def submit_course_for_review(
    course_id: UUID,
    course_service: CourseServiceDep,
    owner_id: UserIdDep,
) -> CourseSchema:
    return await course_service.submit_for_review(
        course_id=course_id, owner_id=owner_id
    )


@router.post("/generate", response_model=CourseGenerateResponseSchema)
async def generate_course(
    generate_schema: CourseGenerateSchema,
    course_service: CourseServiceDep,
    owner_id: UserIdDep,
) -> CourseGenerateResponseSchema:
    task = await course_service.generate_course_ai(
        owner_id=owner_id, generate_schema=generate_schema
    )
    return task


@router.get("/moderation/queue", response_model=list[CourseModerationQueueSchema])
async def get_moderation_queue(
    staff: StaffDep,
    course_service: CourseServiceDep,
    limit: int = 20,
    offset: int = 0,
) -> list[CourseModerationQueueSchema]:
    return await course_service.get_moderation_queue(limit=limit, offset=offset)


@router.post("/{course_id}/moderation/approve", response_model=CourseSchema)
async def approve_course(
    course_id: UUID,
    staff: StaffDep,
    course_service: CourseServiceDep,
) -> CourseSchema:
    return await course_service.approve_course(course_id=course_id)


@router.post("/{course_id}/moderation/reject", response_model=CourseSchema)
async def reject_course(
    course_id: UUID,
    payload: CourseModerationRejectSchema,
    staff: StaffDep,
    course_service: CourseServiceDep,
) -> CourseSchema:
    return await course_service.reject_course(course_id=course_id, payload=payload)


@router.get("")
async def get_courses(
    user_id: OptionalUserIdDep,
    service: CourseServiceDep,
    filter: Literal["all", "created", "my"] = "all",
    limit: int = 10,
    offset: int = 0,
    category: str | None = None,
    q: str | None = Query(None, max_length=100),
) -> Sequence[CourseSchema] | list[CourseUserBriefSchema]:
    return await service.list_courses(
        filter=filter,
        user_id=user_id,
        limit=limit,
        offset=offset,
        category=category,
        q=q,
    )


@router.get("/{course_id}")
async def get_course_by_id(
    course_id: UUID,
    user_id: OptionalUserIdDep,
    service: CourseServiceDep,
    filter: Literal["current", "author", "my"] = "current",
) -> CourseSchema | CourseUserBriefSchema:
    return await service.get_course(filter=filter, course_id=course_id, user_id=user_id)


@router.post("/{course_id}/members")
async def create_member(
    user_id: UserIdDep, course_id: UUID, service: CourseServiceDep
) -> CourseMemberSchema:
    return await service.enroll(course_id=course_id, user_id=user_id)


@router.post("/{course_id}/media", response_model=CourseSchema)
async def upload_course_cover(
    course_id: UUID,
    owner_id: UserIdDep,
    service: CourseServiceDep,
    file: Annotated[UploadFile, File()],
    is_public: Annotated[bool, Form()] = True,
) -> CourseSchema:
    return await service.upload_cover(
        course_id=course_id,
        owner_id=owner_id,
        data=await file.read(),
        original_name=file.filename or "untitled",
        content_type=file.content_type or "application/octet-stream",
        is_public=is_public,
    )


@router.delete("/{course_id}/media", status_code=status.HTTP_204_NO_CONTENT)
async def remove_course_cover(
    course_id: UUID,
    owner_id: UserIdDep,
    service: CourseServiceDep,
) -> None:
    await service.remove_cover(course_id=course_id, owner_id=owner_id)
