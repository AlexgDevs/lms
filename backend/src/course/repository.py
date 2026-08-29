from typing import Any, Sequence
from uuid import UUID

from sqlalchemy import ColumnElement, Integer, case, cast, func, or_, select, update
from sqlalchemy.sql import Select

from src.lesson.enums import LessonProgressType
from src.lesson.models import Lesson, LessonProgress
from src.course.enums import CourseStatus
from src.core.repositories.base_repository import BaseRepository
from src.course.mapper import CourseMapper, CourseUserBriefMapper
from src.course.models import Course, CourseMember
from src.course.schemas import CourseSchema, CourseUserBriefSchema


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _search_order(search_term: str) -> tuple[Any, ...]:
    escaped = _escape_like(search_term)
    search_vector = func.to_tsvector(
        "simple",
        func.concat(Course.title, " ", func.coalesce(Course.description, "")),
    )
    return (
        case((Course.title.ilike(f"{escaped}%", escape="\\"), 0), else_=1),
        func.ts_rank(
            search_vector,
            func.plainto_tsquery("simple", search_term),
        ).desc(),
        func.word_similarity(Course.title, search_term).desc(),
        Course.member_count.desc(),
    )


class CourseRepository(BaseRepository[Course, CourseSchema]):
    model = Course
    schema = CourseSchema
    mapper = CourseMapper

    async def get_filtered(
        self,
        limit: int,
        offset: int,
        order_by: ColumnElement[Any] | None = None,
        category_ids: Sequence[UUID] | None = None,
        search_term: str | None = None,
        certificate_enabled: bool | None = None,
        **filter_by: Any,
    ) -> Sequence[CourseSchema]:
        query = select(self.model).filter_by(**filter_by)
        if category_ids:
            query = query.where(self.model.category_id.in_(list(category_ids)))
        if certificate_enabled is not None:
            query = query.where(self.model.certificate_enabled == certificate_enabled)
        if search_term:
            escaped = _escape_like(search_term)
            query = query.where(
                or_(
                    self.model.title.ilike(f"%{escaped}%", escape="\\"),
                    self.model.description.ilike(f"%{escaped}%", escape="\\"),
                )
            )
            query = query.order_by(*_search_order(search_term))
        elif order_by is not None:
            query = query.order_by(order_by)
        query = query.limit(limit).offset(offset)
        return await self._execute_and_map_all(query)

    def _rating_subquery(self) -> Any:
        # circular: review/__init__ imports src.course.repository
        from src.review.enums import ReviewTargetType
        from src.review.models import Review

        return (
            select(
                Review.target_id.label("course_id"),
                func.round(func.avg(Review.rating), 2).label("rating"),
                func.count(Review.id).label("rating_count"),
            )
            .where(
                Review.target_type == ReviewTargetType.COURSE,
                Review.target_id.is_not(None),
                Review.parent_id.is_(None),
                Review.is_deleted.is_(None),
                Review.rating.is_not(None),
            )
            .group_by(Review.target_id)
            .subquery()
        )

    async def get_published_catalog(
        self,
        limit: int,
        offset: int,
        category_ids: Sequence[UUID] | None = None,
        search_term: str | None = None,
        certificate_enabled: bool | None = None,
        sort: str = "popular",
        min_rating: int | None = None,
        price: str = "all",
    ) -> Sequence[CourseSchema]:
        rating_subq = self._rating_subquery()

        query = (
            select(Course, rating_subq.c.rating, rating_subq.c.rating_count)
            .outerjoin(rating_subq, rating_subq.c.course_id == Course.id)
            .where(Course.status == CourseStatus.PUBLISHED, Course.is_deleted.is_(None))
        )

        if category_ids:
            query = query.where(Course.category_id.in_(list(category_ids)))
        if certificate_enabled is not None:
            query = query.where(Course.certificate_enabled == certificate_enabled)
        if min_rating is not None:
            query = query.where(rating_subq.c.rating >= min_rating)
        if price == "free":
            query = query.where(Course.price == 0)
        elif price == "paid":
            query = query.where(Course.price > 0)

        if search_term:
            search_term = search_term[:100]
            escaped = _escape_like(search_term)
            query = query.where(
                or_(
                    Course.title.ilike(f"%{escaped}%", escape="\\"),
                    Course.description.ilike(f"%{escaped}%", escape="\\"),
                )
            )
            query = query.order_by(*_search_order(search_term))
        else:
            if sort == "newest":
                query = query.order_by(Course.created_at.desc())
            elif sort == "rating":
                query = query.order_by(rating_subq.c.rating.desc().nullslast())
            else:
                query = query.order_by(Course.member_count.desc())

        query = query.limit(limit).offset(offset)
        result = await self.session.execute(query)
        rows = result.all()

        courses: list[CourseSchema] = []
        for course_model, rating, rating_count in rows:
            schema = self.mapper.to_schema(course_model)
            courses.append(
                schema.model_copy(
                    update={
                        "rating": float(rating) if rating is not None else None,
                        "rating_count": (
                            int(rating_count) if rating_count is not None else None
                        ),
                    }
                )
            )
        return courses

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
                    cast(
                        func.round(
                            completed_subq.c.completed_lessons
                            * 100.0
                            / total_subq.c.total_lessons
                        ),
                        Integer,
                    ),
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

    async def is_member(self, course_id: UUID, user_id: UUID) -> bool:
        """Return whether ``user_id`` is an active member (left_at is NULL) of ``course_id``.

        Single source of truth for the "member can read course content even when
        it is not published" rule. In the upcoming draft-over-live stage this is
        the seam that will resolve membership against the course's live branch.
        """
        statement = (
            select(CourseMember.id)
            .where(
                CourseMember.course_id == course_id,
                CourseMember.user_id == user_id,
                CourseMember.left_at.is_(None),
            )
            .limit(1)
        )
        result = await self.session.execute(statement)
        return result.scalars().first() is not None

    async def increment_member_count(self, course_id: UUID) -> None:
        statement = (
            update(Course)
            .where(Course.id == course_id)
            .values(member_count=Course.member_count + 1)
        )
        await self.session.execute(statement)

    async def decrement_member_count(self, course_id: UUID) -> None:
        statement = (
            update(Course)
            .where(Course.id == course_id, Course.member_count > 0)
            .values(member_count=Course.member_count - 1)
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
