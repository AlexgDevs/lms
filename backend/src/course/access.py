"""Shared access rules for course content edits.

Single home for two Phase-2 invariants:
- content mutations (module/lesson/block create/update/delete + media) may only
  happen while the course is **not** published; re-publishing always reruns the
  moderation flow. ``reorder`` is exempt because it never affects student results.
- content units with student results (``lesson_progress`` / ``block_submissions``)
  cannot be deleted — only their content can be fixed.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.course.enums import CourseStatus
from src.course.exceptions import ContentHasStudentResultsError, CourseMustBeDraftError


def ensure_course_is_draft(course: Any) -> None:
    """Raise if ``course`` is published and content is being edited."""
    if course.status == CourseStatus.PUBLISHED:
        raise CourseMustBeDraftError


async def _scalar_count(session: AsyncSession, statement: Any) -> int:
    result = await session.execute(statement)
    return int(result.scalar_one())


async def ensure_block_removable(session: AsyncSession, block_id: UUID) -> None:
    """Raise if any student submitted a solution for ``block_id``."""
    from src.block.models import BlockSubmission

    count = await _scalar_count(
        session,
        select(func.count())
        .select_from(BlockSubmission)
        .where(BlockSubmission.block_id == block_id),
    )
    if count > 0:
        raise ContentHasStudentResultsError


async def ensure_lesson_removable(session: AsyncSession, lesson_id: UUID) -> None:
    """Raise if any lesson progress or any block submission exists underneath."""
    from src.block.models import BlockSubmission
    from src.lesson.models import LessonProgress

    progress = await _scalar_count(
        session,
        select(func.count())
        .select_from(LessonProgress)
        .where(LessonProgress.lesson_id == lesson_id),
    )
    submissions = await _scalar_count(
        session,
        select(func.count())
        .select_from(BlockSubmission)
        .where(BlockSubmission.lesson_id == lesson_id),
    )
    if progress + submissions > 0:
        raise ContentHasStudentResultsError


async def ensure_module_removable(session: AsyncSession, module_id: UUID) -> None:
    """Raise if any lesson under the module has progress/submissions."""
    from src.block.models import BlockSubmission
    from src.lesson.models import Lesson, LessonProgress

    lesson_ids = (
        (await session.execute(select(Lesson.id).where(Lesson.module_id == module_id)))
        .scalars()
        .all()
    )
    if not lesson_ids:
        return
    progress = await _scalar_count(
        session,
        select(func.count())
        .select_from(LessonProgress)
        .where(LessonProgress.lesson_id.in_(lesson_ids)),
    )
    submissions = await _scalar_count(
        session,
        select(func.count())
        .select_from(BlockSubmission)
        .where(BlockSubmission.lesson_id.in_(lesson_ids)),
    )
    if progress + submissions > 0:
        raise ContentHasStudentResultsError


async def course_tgp_outdated(session: AsyncSession, course: Any) -> bool:
    """Return whether the course structure drifted from the TGP generation snapshot.

    Detects added/removed modules, lessons or blocks (any mutation path, including
    AI generation). Pure text edits and reorders do not change the counts.
    """
    if not course.tgp_enabled or not course.tgp_content_snapshot:
        return False
    from src.block.models import Block
    from src.lesson.models import Lesson
    from src.module.models import Module

    module_count = await _scalar_count(
        session,
        select(func.count()).select_from(Module).where(Module.course_id == course.id),
    )
    lesson_count = await _scalar_count(
        session,
        select(func.count()).select_from(Lesson).where(Lesson.course_id == course.id),
    )
    block_count = await _scalar_count(
        session,
        select(func.count()).select_from(Block).where(Block.course_id == course.id),
    )
    snapshot: dict[str, int] = course.tgp_content_snapshot
    return (
        module_count != snapshot.get("modules")
        or lesson_count != snapshot.get("lessons")
        or block_count != snapshot.get("blocks")
    )
