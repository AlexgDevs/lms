from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.sql import Select

from src.lesson.enums import LessonProgressType
from src.lesson.models import Lesson, LessonProgress
from src.core.repositories.base_repository import BaseRepository
from src.course.mapper import CourseMapper, CourseUserBriefMapper
from src.course.models import Course, CourseMember
from src.course.schemas import CourseSchema, CourseUserBriefSchema


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

    def _member_statement(self, user_id: UUID) -> Select[tuple[Any, ...]]:
        total_subq = (
            select(Lesson.course_id, func.count(Lesson.id).label("total_lessons"))
            .group_by(Lesson.course_id)
            .subquery()
        )
        completed_subq = (
            select(
                Lesson.course_id,
                func.count(LessonProgress.id).label("completed_lessons"),
            )
            .join(LessonProgress, LessonProgress.lesson_id == Lesson.id)
            .where(
                LessonProgress.user_id == user_id,
                LessonProgress.status == LessonProgressType.COMPLETED,
            )
            .group_by(Lesson.course_id)
            .subquery()
        )

        return (
            select(
                Course.id,
                Course.title,
                Course.cover_url,
                Course.description,
                Course.owner_id,
                Course.price,
                Course.created_at,
                Course.member_count,
                Course.status,
                CourseMember.role,
                func.coalesce(
                    completed_subq.c.completed_lessons
                    * 100
                    / total_subq.c.total_lessons,
                    0,
                ).label("progress"),
            )
            .join(CourseMember, CourseMember.course_id == Course.id)
            .outerjoin(total_subq, total_subq.c.course_id == Course.id)
            .outerjoin(completed_subq, completed_subq.c.course_id == Course.id)
        )

    async def get_member_course_ids(self, user_id: UUID) -> set[UUID]:
        statement = select(CourseMember.course_id).where(
            CourseMember.user_id == user_id,
            CourseMember.left_at.is_(None),
        )
        result = await self.session.execute(statement)
        return set(result.scalars().all())

    async def increment_member_count(self, course_id: UUID) -> None:
        statement = (
            update(Course)
            .where(Course.id == course_id)
            .values(member_count=Course.member_count + 1)
        )
        await self.session.execute(statement)

    async def get_courses_where_user_is_member(
        self, user_id: UUID
    ) -> list[CourseUserBriefSchema]:
        statement = self._member_statement(user_id).where(
            CourseMember.user_id == user_id, CourseMember.left_at.is_(None)
        )

        result = await self.session.execute(statement)
        return [CourseUserBriefMapper.to_schema(model) for model in result.all()]

    async def get_course_where_user_is_member(
        self, course_id: UUID, user_id: UUID
    ) -> CourseUserBriefSchema | None:
        statement = self._member_statement(user_id).where(
            Course.id == course_id,
            CourseMember.user_id == user_id,
            CourseMember.left_at.is_(None),
        )

        result = await self.session.execute(statement)
        row = result.one_or_none()
        if not row:
            return None

        return CourseUserBriefMapper.to_schema(row)
