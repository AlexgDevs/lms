from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.lesson.repository import LessonRepository
from src.review.repository import ReviewRepository
from src.review.service import ReviewService
from src.review.unit_of_work import ReviewUnitOfWork
from src.user.repository import UserRepository


def get_review_repository(session: SessionDep) -> ReviewRepository:
    return ReviewRepository(session)


ReviewRepositoryDep = Annotated[ReviewRepository, Depends(get_review_repository)]


def get_review_unit_of_work(
    session: SessionDep,
    review_repository: ReviewRepositoryDep,
) -> ReviewUnitOfWork:
    return ReviewUnitOfWork(
        session=session,
        review_repository=review_repository,
        course_repository=CourseRepository(session),
        lesson_repository=LessonRepository(session),
        course_member_repository=CourseMemberRepository(session),
        user_repository=UserRepository(session),
    )


ReviewUnitOfWorkDep = Annotated[ReviewUnitOfWork, Depends(get_review_unit_of_work)]


def get_review_service(
    session: SessionDep,
    review_unit_of_work: ReviewUnitOfWorkDep,
) -> ReviewService:
    return ReviewService(
        session=session,
        review_unit_of_work=review_unit_of_work,
    )


ReviewServiceDep = Annotated[ReviewService, Depends(get_review_service)]
