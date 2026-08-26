from sqlalchemy.ext.asyncio import AsyncSession

from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.lesson.repository import LessonRepository
from src.review.repository import ReviewRepository
from src.user.repository import UserRepository


class ReviewUnitOfWork(BaseUnitOfWork):
    reviews: ReviewRepository
    courses: CourseRepository
    lessons: LessonRepository
    members: CourseMemberRepository
    users: UserRepository

    def __init__(
        self,
        session: AsyncSession,
        review_repository: ReviewRepository,
        course_repository: CourseRepository,
        lesson_repository: LessonRepository,
        course_member_repository: CourseMemberRepository,
        user_repository: UserRepository,
    ) -> None:
        super().__init__(session)
        self.reviews = review_repository
        self.courses = course_repository
        self.lessons = lesson_repository
        self.members = course_member_repository
        self.users = user_repository

    def _uow_marker(self) -> None:
        pass
