from uuid import UUID

from sqlalchemy import select

from src.lesson.models import Lesson
from src.core.repositories.base_repository import BaseRepository
from src.course.mapper import CourseMapper
from src.course.models import Course, CourseMember
from src.course.schemas import CourseSchema


class CourseRepository(BaseRepository[Course, CourseSchema]):
    model = Course
    schema = CourseSchema
    mapper = CourseMapper

    async def get_course_by_lesson_where_user_is_member(
        self, user_id: UUID, course_id: UUID, lesson_id: UUID
    ) -> CourseSchema | None:
        statement = (
            select(Course)
            .join(CourseMember, CourseMember.course_id == Course.id)
            .join(Lesson, Lesson.course_id == Course.id)
            .where(
                Course.id == course_id,
                CourseMember.user_id == user_id,
                CourseMember.left_at.is_(None),
                Lesson.course_id == lesson_id,
            )
        )

        return await self._execute_and_map_one_or_none(statement)
