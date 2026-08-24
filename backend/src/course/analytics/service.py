from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.services.base_service import BaseService
from src.course.analytics.schemas import (
    BlockPerformanceSchema,
    ContentPerformanceSchema,
    CourseOverviewSchema,
    EnrollmentTrendDaySchema,
    EnrollmentTrendSchema,
    LessonPerformanceSchema,
)
from src.course.exceptions import CourseNotFoundError
from src.course.models import Course, CourseMember
from src.lesson.models import Lesson, LessonProgress
from src.block.models import Block, BlockSubmission


class CourseAnalyticsService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _verify_owner(self, course_id: UUID, owner_id: UUID) -> None:
        course = await self.session.execute(
            select(Course).where(
                Course.id == course_id,
                Course.owner_id == owner_id,
                Course.is_deleted.is_(None),
            )
        )
        if not course.scalar_one_or_none():
            raise CourseNotFoundError

    async def get_overview(
        self, course_id: UUID, owner_id: UUID
    ) -> CourseOverviewSchema:
        await self._verify_owner(course_id, owner_id)

        total_result = await self.session.execute(
            select(func.count()).select_from(CourseMember).where(
                CourseMember.course_id == course_id,
                CourseMember.left_at.is_(None),
            )
        )
        total_enrolled = int(total_result.scalar_one())

        churned_result = await self.session.execute(
            select(func.count()).select_from(CourseMember).where(
                CourseMember.course_id == course_id,
                CourseMember.left_at.is_not(None),
            )
        )
        churned = int(churned_result.scalar_one())

        lesson_ids_result = await self.session.execute(
            select(Lesson.id).where(Lesson.course_id == course_id)
        )
        lesson_ids = [r[0] for r in lesson_ids_result.all()]

        completion_rate = 0.0
        avg_accuracy = 0.0

        if lesson_ids and total_enrolled > 0:
            completed_result = await self.session.execute(
                select(func.count()).select_from(LessonProgress).where(
                    LessonProgress.lesson_id.in_(lesson_ids),
                    LessonProgress.status == "completed",
                )
            )
            total_completed = int(completed_result.scalar_one())
            completion_rate = round(
                total_completed / (total_enrolled * len(lesson_ids)) * 100, 1
            )

        block_ids_result = await self.session.execute(
            select(Block.id).where(Block.course_id == course_id)
        )
        block_ids = [r[0] for r in block_ids_result.all()]

        if block_ids:
            correct_result = await self.session.execute(
                select(func.count()).select_from(BlockSubmission).where(
                    BlockSubmission.block_id.in_(block_ids),
                    BlockSubmission.submission_type == "correct",
                )
            )
            total_correct = int(correct_result.scalar_one())

            total_sub_result = await self.session.execute(
                select(func.count()).select_from(BlockSubmission).where(
                    BlockSubmission.block_id.in_(block_ids),
                )
            )
            total_sub = int(total_sub_result.scalar_one())

            if total_sub > 0:
                avg_accuracy = round(total_correct / total_sub * 100, 1)

        return CourseOverviewSchema(
            course_id=course_id,
            total_enrolled=total_enrolled,
            active=total_enrolled,
            churned=churned,
            completion_rate=completion_rate,
            avg_accuracy=avg_accuracy,
        )

    async def get_enrollment_trend(
        self, course_id: UUID, owner_id: UUID, days: int = 30
    ) -> EnrollmentTrendSchema:
        await self._verify_owner(course_id, owner_id)

        left_day_col = func.date(CourseMember.left_at)
        unenrolled_result = await self.session.execute(
            select(left_day_col, func.count())
            .where(
                CourseMember.course_id == course_id,
                CourseMember.left_at.is_not(None),
            )
            .group_by(left_day_col)
        )
        unenrolled_by_day = {
            str(day): count for day, count in unenrolled_result.all()
        }

        trend_days = []
        for day_str, count in unenrolled_by_day.items():
            trend_days.append(
                EnrollmentTrendDaySchema(
                    date=day_str,
                    enrolled=0,
                    unenrolled=count,
                )
            )

        return EnrollmentTrendSchema(course_id=course_id, days=trend_days)

    async def get_content_performance(
        self, course_id: UUID, owner_id: UUID
    ) -> ContentPerformanceSchema:
        await self._verify_owner(course_id, owner_id)

        lessons_result = await self.session.execute(
            select(Lesson.id, Lesson.title, Lesson.order)
            .where(Lesson.course_id == course_id)
            .order_by(Lesson.order)
        )
        lesson_rows = lessons_result.all()

        lessons_perf = []
        for lesson_id, lesson_title, _order in lesson_rows:
            started_result = await self.session.execute(
                select(func.count(func.distinct(LessonProgress.user_id))).where(
                    LessonProgress.lesson_id == lesson_id,
                )
            )
            total_started = int(started_result.scalar_one())

            completed_result = await self.session.execute(
                select(func.count(func.distinct(LessonProgress.user_id))).where(
                    LessonProgress.lesson_id == lesson_id,
                    LessonProgress.status == "completed",
                )
            )
            total_completed = int(completed_result.scalar_one())

            completion_rate = (
                round(total_completed / total_started * 100, 1)
                if total_started > 0
                else 0.0
            )

            lessons_perf.append(
                LessonPerformanceSchema(
                    lesson_id=lesson_id,
                    title=lesson_title,
                    module_title="",
                    completion_rate=completion_rate,
                    avg_time_seconds=0.0,
                    total_started=total_started,
                    total_completed=total_completed,
                )
            )

        blocks_result = await self.session.execute(
            select(
                Block.id,
                Block.title,
                Block.block_type,
                Lesson.title,
            )
            .join(Lesson, Lesson.id == Block.lesson_id)
            .where(Block.course_id == course_id)
            .order_by(Block.order)
        )
        block_rows = blocks_result.all()

        blocks_perf = []
        for block_id, block_title, block_type, lesson_title in block_rows:
            total_sub_result = await self.session.execute(
                select(func.count()).select_from(BlockSubmission).where(
                    BlockSubmission.block_id == block_id,
                )
            )
            total_sub = int(total_sub_result.scalar_one())

            correct_result = await self.session.execute(
                select(func.count()).select_from(BlockSubmission).where(
                    BlockSubmission.block_id == block_id,
                    BlockSubmission.submission_type == "correct",
                )
            )
            total_correct = int(correct_result.scalar_one())

            avg_attempts_result = await self.session.execute(
                select(func.avg(BlockSubmission.attempts)).where(
                    BlockSubmission.block_id == block_id,
                )
            )
            avg_attempts = float(avg_attempts_result.scalar_one() or 0)

            first_try_result = await self.session.execute(
                select(func.count()).select_from(BlockSubmission).where(
                    BlockSubmission.block_id == block_id,
                    BlockSubmission.is_first_try_correct.is_(True),
                )
            )
            first_try_correct = int(first_try_result.scalar_one())

            accuracy = (
                round(total_correct / total_sub * 100, 1) if total_sub > 0 else 0.0
            )
            first_try_rate = (
                round(first_try_correct / total_sub * 100, 1)
                if total_sub > 0
                else 0.0
            )

            blocks_perf.append(
                BlockPerformanceSchema(
                    block_id=block_id,
                    title=block_title,
                    block_type=block_type,
                    lesson_title=lesson_title,
                    accuracy=accuracy,
                    avg_attempts=round(avg_attempts, 2),
                    first_try_rate=first_try_rate,
                    total_submissions=total_sub,
                )
            )

        return ContentPerformanceSchema(
            course_id=course_id,
            lessons=lessons_perf,
            blocks=blocks_perf,
        )
