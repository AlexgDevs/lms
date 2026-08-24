from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from src.course.analytics.schemas import (
    ContentPerformanceSchema,
    CourseOverviewSchema,
    EnrollmentTrendSchema,
)
from src.course.analytics.service import CourseAnalyticsService
from src.core.dependencies import SessionDep
from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/courses", tags=["Course Analytics"])


def get_analytics_service(session: SessionDep) -> CourseAnalyticsService:
    return CourseAnalyticsService(session)


AnalyticsServiceDep = Annotated[CourseAnalyticsService, Depends(get_analytics_service)]


@router.get(
    "/{course_id}/analytics",
    response_model=CourseOverviewSchema,
    summary="Course analytics overview",
)
async def get_course_overview(
    course_id: UUID,
    owner_id: UserIdDep,
    service: AnalyticsServiceDep,
) -> CourseOverviewSchema:
    return await service.get_overview(course_id=course_id, owner_id=owner_id)


@router.get(
    "/{course_id}/analytics/enrollments",
    response_model=EnrollmentTrendSchema,
    summary="Enrollment trend over time",
)
async def get_enrollment_trend(
    course_id: UUID,
    owner_id: UserIdDep,
    service: AnalyticsServiceDep,
    days: int = 30,
) -> EnrollmentTrendSchema:
    return await service.get_enrollment_trend(
        course_id=course_id, owner_id=owner_id, days=days
    )


@router.get(
    "/{course_id}/analytics/content",
    response_model=ContentPerformanceSchema,
    summary="Content performance (lessons + blocks)",
)
async def get_content_performance(
    course_id: UUID,
    owner_id: UserIdDep,
    service: AnalyticsServiceDep,
) -> ContentPerformanceSchema:
    return await service.get_content_performance(course_id=course_id, owner_id=owner_id)
