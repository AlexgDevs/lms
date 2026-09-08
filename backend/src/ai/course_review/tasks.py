"""Celery worker that reviews a course submitted for publication.

Auto-publishes courses the AI (or heuristic fallback) approves; courses with
flags stay in ``under_review`` so a human moderator can decide.
"""

# TODO: the AI review prompt lives in src/ai/gemini.review_course — move it to
# src/ai/prompts/; the heuristic flags below are user-facing moderation reasons.
import asyncio
import random
import re
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from loguru import logger
from openai import APIConnectionError, APITimeoutError, InternalServerError
from redis.asyncio import Redis, from_url
from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from src.ai.exceptions import AiRateLimitError
from src.ai.gemini import CourseReviewResult, GeminiService
from src.block.enums import BlockType
from src.block.models import Block
from src.core.celery_app import celery_app
from src.core.config import settings
from src.course.category.models import Category
from src.course.enums import CourseStatus
from src.course.models import Course
from src.founder.service import grant_founder_if_eligible
from src.lesson.models import Lesson
from src.module.models import Module

COURSE_REVIEW_LOCK_KEY = "course_review:{course_id}"

# Transient failures that warrant a retry with backoff.
NETWORK_RETRY_EXCEPTIONS: tuple[type[Exception], ...] = (
    APIConnectionError,
    APITimeoutError,
    InternalServerError,
)

_LOCK_RELEASE_SCRIPT = """
local current = redis.call('get', KEYS[1])
if current == ARGV[1] then
    return redis.call('del', KEYS[1])
end
return 0
"""

_PLACEHOLDER_PATTERNS = (
    "lorem",
    "ipsum",
    "заглушк",
    "placeholder",
    "введите текст",
    "здесь должен быть",
    "test",
    "тест",
    "asdf",
    "qwerty",
)

_PROFANITY = (
    "блядь",
    "нахуй",
    "хуй",
    "пиздец",
    "ебать",
    "fuck",
    "shit",
    "bitch",
    "asshole",
)

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _build_gemini() -> GeminiService:
    return GeminiService(
        settings.ai.AI_API_KEY,
        settings.ai.AI_BASE_URL,
        settings.ai.AI_MODEL,
        timeout=settings.course_review.COURSE_REVIEW_AI_TIMEOUT_SECONDS,
        max_retries=settings.course_review.COURSE_REVIEW_AI_MAX_RETRIES,
    )


def _build_session_factory() -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(
        str(settings.postgres.DATABASE_URL), poolclass=NullPool
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return engine, session_factory


async def _release_lock_if_owned(redis: Redis, key: str, token: str) -> None:
    await redis.eval(_LOCK_RELEASE_SCRIPT, 1, key, token)


async def _gather_content(
    session: AsyncSession, course: Course
) -> tuple[list[str], list[str], str]:
    modules = (
        (
            await session.execute(
                select(Module)
                .where(Module.course_id == course.id)
                .order_by(Module.order.asc())
            )
        )
        .scalars()
        .all()
    )
    lessons = (
        (
            await session.execute(
                select(Lesson)
                .where(Lesson.course_id == course.id)
                .order_by(Lesson.order.asc())
            )
        )
        .scalars()
        .all()
    )
    blocks = (
        (
            await session.execute(
                select(Block)
                .where(Block.course_id == course.id)
                .order_by(Block.order.asc())
            )
        )
        .scalars()
        .all()
    )

    text_parts: list[str] = []
    for block in blocks:
        payload = block.payload or {}
        if block.block_type == BlockType.TEXT:
            raw = payload.get("text") or payload.get("html") or ""
            text_parts.append(_HTML_TAG_RE.sub(" ", raw))
        elif block.block_type in {
            BlockType.QUIZ_SINGLE_CHOICE,
            BlockType.QUIZ_MULTIPLE_CHOICE,
        }:
            for option in payload.get("options", []):
                text_parts.append(str(option.get("text", "")))
        elif block.block_type == BlockType.CODE:
            text_parts.append(str(payload.get("code") or ""))

    text_content = " ".join(part for part in text_parts if part)
    text_content = text_content[: settings.course_review.COURSE_REVIEW_MAX_TEXT_CHARS]
    return [m.title for m in modules], [l.title for l in lessons], text_content


def _heuristic_review(
    course: Course,
    module_titles: list[str],
    lesson_titles: list[str],
    text_content: str,
) -> CourseReviewResult:
    flags: list[str] = []
    haystack = " ".join(
        [
            course.title,
            course.description or "",
            *module_titles,
            *lesson_titles,
            text_content,
        ]
    ).lower()

    if not course.description:
        flags.append("Отсутствует описание курса")
    if len(lesson_titles) < settings.course_review.COURSE_REVIEW_MIN_LESSONS:
        flags.append("Курс содержит слишком мало уроков")
    if not text_content.strip():
        flags.append("Курс не содержит текстового контента")
    elif len(text_content.strip()) < 80:
        flags.append("Курс содержит очень мало текстового контента")

    for pattern in _PLACEHOLDER_PATTERNS:
        if pattern in haystack:
            flags.append("Найден плейсхолдер или тестовый текст")
            break
    for word in _PROFANITY:
        if word in haystack:
            flags.append("Содержимое может содержать нецензурную лексику")
            break

    if flags:
        return CourseReviewResult(approved=False, flags=flags)
    return CourseReviewResult(approved=True, flags=[])


async def _run_review(course_id: UUID) -> None:
    engine, session_factory = _build_session_factory()
    redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
    lock_key = COURSE_REVIEW_LOCK_KEY.format(course_id=course_id)
    lock_token = uuid4().hex
    acquired = await redis.set(
        lock_key,
        lock_token,
        nx=True,
        ex=settings.course_review.COURSE_REVIEW_LOCK_TTL_SECONDS,
    )
    if not acquired:
        logger.info("Course review already in progress for {}", course_id)
        await redis.aclose()
        await engine.dispose()
        return
    try:
        async with session_factory() as session:
            course = (
                await session.execute(select(Course).where(Course.id == course_id))
            ).scalar_one_or_none()
            if not course or course.status != CourseStatus.UNDER_REVIEW:
                logger.info(
                    "Course review skipped: {} not found or not under review",
                    course_id,
                )
                return

            module_titles, lesson_titles, text_content = await _gather_content(
                session, course
            )
            category_title: str | None = None
            if course.category_id:
                category = (
                    await session.execute(
                        select(Category).where(Category.id == course.category_id)
                    )
                ).scalar_one_or_none()
                category_title = category.name if category else None

            if settings.ai.AI_API_KEY:
                result = _build_gemini().review_course(
                    course.title,
                    course.description,
                    category_title,
                    module_titles,
                    lesson_titles,
                    text_content,
                )
            else:
                result = _heuristic_review(
                    course, module_titles, lesson_titles, text_content
                )

            course.updated_at = datetime.now(timezone.utc)
            if result.approved:
                course.status = CourseStatus.PUBLISHED
                course.moderation_reason = None
                logger.info("Course review approved: {}", course_id)
            else:
                course.status = CourseStatus.UNDER_REVIEW
                flags = result.flags or ["Не удалось определить причину отклонения"]
                course.moderation_reason = "; ".join(flags)
                logger.info(
                    "Course review flagged {}: {}", course_id, course.moderation_reason
                )
            await session.commit()
            if result.approved:
                await grant_founder_if_eligible(session, course.owner_id)
    finally:
        await _release_lock_if_owned(redis, lock_key, lock_token)
        await redis.aclose()
        await engine.dispose()


def _network_backoff(current_retries: int) -> int:
    backoff = settings.course_review.COURSE_REVIEW_NETWORK_RETRY_BACKOFF * (
        2**current_retries
    )
    backoff = min(
        backoff, settings.course_review.COURSE_REVIEW_NETWORK_RETRY_BACKOFF_MAX
    )
    return int(backoff + random.uniform(0, backoff * 0.1))


@celery_app.task(
    bind=True,
    max_retries=settings.course_review.COURSE_REVIEW_RETRY_MAX_RETRIES,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    name="ai.course_review.review",
)
def review_course_task(self: Any, course_id: str) -> None:
    try:
        asyncio.run(_run_review(UUID(course_id)))
    except AiRateLimitError as exc:
        retry_after = exc.retry_after
        if (
            retry_after is not None
            and retry_after
            > settings.course_review.COURSE_REVIEW_RATE_LIMIT_MAX_RETRY_COUNTDOWN
        ):
            logger.warning(
                "Course review rate limit Retry-After {}s exceeds max countdown, "
                "giving up for course {}",
                retry_after,
                course_id,
            )
            raise
        countdown = (
            retry_after
            or settings.course_review.COURSE_REVIEW_RATE_LIMIT_DEFAULT_RETRY_SECONDS
        )
        logger.warning(
            "Course review rate limited, retrying {} in {}s", course_id, countdown
        )
        raise self.retry(exc=exc, countdown=countdown)
    except NETWORK_RETRY_EXCEPTIONS as exc:
        backoff = _network_backoff(self.request.retries)
        logger.warning(
            "Course review network error, retrying {} in {}s", course_id, backoff
        )
        raise self.retry(exc=exc, countdown=backoff)
    except Exception:
        logger.exception("Course review failed permanently for {}", course_id)
        raise
