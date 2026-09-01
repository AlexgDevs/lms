import asyncio
import random
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from loguru import logger
from openai import APIConnectionError, APITimeoutError, InternalServerError
from redis.asyncio import Redis, from_url
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from src.ai.tgp.exceptions import TgpGeminiRateLimitError
from src.ai.gemini import GeminiService, ModuleStructure
from src.ai.tgp.repository import TgpQuestionRepository
from src.ai.tgp.schemas import (
    TgpQuestionCreateSchema,
    TgpQuestionSchema,
    TgpQuestionUpdateSchema,
)
from src.ai.tgp.unit_of_work import AiUnitOfWork
from src.block.models import Block
from src.core.celery_app import celery_app
from src.core.config import settings
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.course.schemas import CourseUpdateSchema
from src.lesson.models import Lesson
from src.module.models import Module
from src.module.repository import ModuleRepository

TGP_LOCK_KEY = "tgp:generating:{course_id}"

# Manual retry: rate limits are retried with countdown=Retry-After, transient
# network/5xx errors with an exponential backoff (mirrors previous behavior).
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

_LOCK_EXTEND_SCRIPT = """
local current = redis.call('get', KEYS[1])
if current == ARGV[1] then
    return redis.call('expire', KEYS[1], ARGV[2])
end
return 0
"""


def _build_gemini() -> GeminiService:
    return GeminiService(
        settings.ai.AI_API_KEY,
        settings.ai.AI_BASE_URL,
        settings.ai.AI_MODEL,
        timeout=settings.tgp.TGP_AI_TIMEOUT_SECONDS,
        max_retries=settings.tgp.TGP_AI_MAX_RETRIES,
    )


def _build_session_factory() -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(
        str(settings.postgres.DATABASE_URL), poolclass=NullPool
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return engine, session_factory


def _build_uow(session: AsyncSession) -> AiUnitOfWork:
    return AiUnitOfWork(
        session,
        TgpQuestionRepository(session),
        CourseRepository(session),
        ModuleRepository(session),
        CourseMemberRepository(session),
    )


async def _release_lock_if_owned(redis: Redis, key: str, token: str) -> None:
    await redis.eval(_LOCK_RELEASE_SCRIPT, 1, key, token)


async def _extend_lock_if_owned(
    redis: Redis, key: str, token: str, ttl_seconds: int
) -> None:
    await redis.eval(_LOCK_EXTEND_SCRIPT, 1, key, token, ttl_seconds)


async def _run_generate(course_id_str: str, lock_token: str | None = None) -> None:
    course_id = UUID(course_id_str)
    engine, session_factory = _build_session_factory()
    redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
    lock_key = TGP_LOCK_KEY.format(course_id=course_id)
    try:
        async with session_factory() as session:
            uow = _build_uow(session)

            course = await uow.courses.get_one(id=course_id)
            if not course:
                logger.warning("TGP generation skipped: course {} not found", course_id)
                if lock_token:
                    await _release_lock_if_owned(redis, lock_key, lock_token)
                return
            if not course.tgp_enabled:
                logger.warning(
                    "TGP generation skipped: course {} not enabled", course_id
                )
                if lock_token:
                    await _release_lock_if_owned(redis, lock_key, lock_token)
                return

            modules = list(
                await uow.modules.get_filtered(
                    limit=1000,
                    offset=0,
                    order_by=Module.order.asc(),
                    course_id=course_id,
                )
            )
            if len(modules) < settings.tgp.TGP_MIN_MODULES:
                logger.warning(
                    "TGP generation skipped: course {} has {} modules (< {})",
                    course_id,
                    len(modules),
                    settings.tgp.TGP_MIN_MODULES,
                )
                if lock_token:
                    await _release_lock_if_owned(redis, lock_key, lock_token)
                return

            structure = [
                ModuleStructure(
                    module_id=str(module.id),
                    module_title=module.title,
                    module_description=module.description,
                )
                for module in modules
            ]

            lesson_count = int(
                (
                    await session.execute(
                        select(func.count())
                        .select_from(Lesson)
                        .where(Lesson.course_id == course_id)
                    )
                ).scalar_one()
            )
            block_count = int(
                (
                    await session.execute(
                        select(func.count())
                        .select_from(Block)
                        .where(Block.course_id == course_id)
                    )
                ).scalar_one()
            )
            content_snapshot = {
                "modules": len(modules),
                "lessons": lesson_count,
                "blocks": block_count,
            }

            questions = _build_gemini().generate_questions(
                course.title,
                structure,
                min_per_module=settings.tgp.TGP_QUESTIONS_PER_MODULE_MIN,
                max_per_module=settings.tgp.TGP_QUESTIONS_PER_MODULE_MAX,
            )
            if not questions:
                logger.warning(
                    "TGP generation: no questions returned for course {}", course_id
                )
                if lock_token:
                    await _release_lock_if_owned(redis, lock_key, lock_token)
                return

            now = datetime.now(timezone.utc)

            # Patch existing questions in place (stable ids) so already-loaded
            # frontends never hit "question not found" after a regeneration.
            # New questions beyond the existing count are created, leftovers are
            # removed — all within the same transaction.
            existing = list(await uow.questions.get_by_course(course_id))
            existing_by_module: dict[UUID, list[TgpQuestionSchema]] = defaultdict(list)
            for existing_question in existing:
                existing_by_module[existing_question.module_id].append(
                    existing_question
                )

            new_by_module: dict[UUID, list[Any]] = defaultdict(list)
            for generated_question in questions:
                new_by_module[UUID(generated_question.module_id)].append(
                    generated_question
                )

            for module_id, new_questions in new_by_module.items():
                old_questions = existing_by_module.get(module_id, [])
                for index, new_question in enumerate(new_questions):
                    if index < len(old_questions):
                        await uow.questions.update(
                            old_questions[index].id,
                            TgpQuestionUpdateSchema(
                                question_text=new_question.question_text,
                                options=new_question.options,
                                correct_option=new_question.correct_option,
                                updated_at=now,
                            ),
                        )
                    else:
                        await uow.questions.create(
                            TgpQuestionCreateSchema(
                                course_id=course_id,
                                module_id=module_id,
                                question_text=new_question.question_text,
                                options=new_question.options,
                                correct_option=new_question.correct_option,
                            )
                        )
                for old_question in old_questions[len(new_questions) :]:
                    await uow.questions.delete(old_question.id)

            # Drop questions for modules that produced no new questions.
            generated_module_ids = set(new_by_module.keys())
            for module_id, old_questions in existing_by_module.items():
                if module_id not in generated_module_ids:
                    for old_question in old_questions:
                        await uow.questions.delete(old_question.id)

            await uow.courses.update(
                course_id,
                CourseUpdateSchema(
                    tgp_last_full_generated_at=now,
                    tgp_content_snapshot=content_snapshot,
                ),
            )
            await uow.commit()
            logger.info("TGP generation completed for course {}", course_id)
            if lock_token:
                await _release_lock_if_owned(redis, lock_key, lock_token)
    finally:
        await redis.aclose()
        await engine.dispose()


async def _run_regenerate_question(question_id_str: str) -> None:
    question_id = UUID(question_id_str)
    engine, session_factory = _build_session_factory()
    try:
        async with session_factory() as session:
            uow = _build_uow(session)

            question = await uow.questions.get_one(id=question_id)
            if not question:
                logger.warning(
                    "TGP question regeneration skipped: {} not found", question_id
                )
                return

            course = await uow.courses.get_one(id=question.course_id)
            module = await uow.modules.get_one(id=question.module_id)
            if not course or not module:
                logger.warning(
                    "TGP question regeneration skipped: course/module not found for question {}",
                    question_id,
                )
                return

            regenerated = _build_gemini().regenerate_question(
                course.title,
                module.title,
                question.question_text,
                question.options,
            )

            await uow.questions.update(
                question_id,
                TgpQuestionUpdateSchema(
                    question_text=regenerated.question_text,
                    options=regenerated.options,
                    correct_option=regenerated.correct_option,
                    updated_at=datetime.now(timezone.utc),
                ),
            )
            await uow.commit()
            logger.info("TGP question regenerated: {}", question_id)
    finally:
        await engine.dispose()


def _network_backoff(current_retries: int) -> int:
    backoff = settings.tgp.TGP_NETWORK_RETRY_BACKOFF * (2**current_retries)
    backoff = min(backoff, settings.tgp.TGP_NETWORK_RETRY_BACKOFF_MAX)
    return int(backoff + random.uniform(0, backoff * 0.1))


def _release_lock(course_id: str, lock_token: str | None) -> None:
    if not lock_token:
        return
    try:
        redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
        try:
            asyncio.run(
                _release_lock_if_owned(
                    redis, TGP_LOCK_KEY.format(course_id=course_id), lock_token
                )
            )
        finally:
            asyncio.run(redis.aclose())
    except Exception:
        logger.exception("TGP: failed to release lock for course {}", course_id)


def _schedule_retry(
    self: Any,
    exc: Exception,
    course_id: str,
    lock_token: str | None,
    countdown: int,
) -> None:
    if self.request.retries >= settings.tgp.TGP_RETRY_MAX_RETRIES:
        logger.warning("TGP task exhausted retries for course {}", course_id)
        _release_lock(course_id, lock_token)
        raise exc
    if lock_token:
        redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
        try:
            asyncio.run(
                _extend_lock_if_owned(
                    redis,
                    TGP_LOCK_KEY.format(course_id=course_id),
                    lock_token,
                    settings.tgp.TGP_GENERATION_LOCK_TTL_SECONDS,
                )
            )
        finally:
            asyncio.run(redis.aclose())
    raise self.retry(exc=exc, countdown=countdown)


def _schedule_question_retry(self: Any, exc: Exception, countdown: int) -> None:
    if self.request.retries >= settings.tgp.TGP_RETRY_MAX_RETRIES:
        logger.warning("TGP question regeneration exhausted retries")
        raise exc
    raise self.retry(exc=exc, countdown=countdown)


@celery_app.task(
    bind=True,
    max_retries=settings.tgp.TGP_RETRY_MAX_RETRIES,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    name="ai.tgp.generate",
)
def generate_tgp_test_task(
    self: Any, course_id: str, lock_token: str | None = None
) -> None:
    try:
        asyncio.run(_run_generate(course_id, lock_token))
    except TgpGeminiRateLimitError as exc:
        retry_after = exc.retry_after
        if (
            retry_after is not None
            and retry_after > settings.tgp.TGP_RATE_LIMIT_MAX_RETRY_COUNTDOWN
        ):
            logger.warning(
                "TGP rate limit Retry-After {}s exceeds max countdown {}s, giving up for course {}",
                retry_after,
                settings.tgp.TGP_RATE_LIMIT_MAX_RETRY_COUNTDOWN,
                course_id,
            )
            _release_lock(course_id, lock_token)
            raise
        countdown = retry_after or settings.tgp.TGP_RATE_LIMIT_DEFAULT_RETRY_SECONDS
        logger.warning(
            "TGP rate limited, retrying course {} in {}s", course_id, countdown
        )
        _schedule_retry(self, exc, course_id, lock_token, countdown)
    except NETWORK_RETRY_EXCEPTIONS as exc:
        backoff = _network_backoff(self.request.retries)
        logger.warning(
            "TGP generation network error, retrying course {} in {}s",
            course_id,
            backoff,
        )
        _schedule_retry(self, exc, course_id, lock_token, backoff)
    except Exception:
        logger.exception("TGP generation failed permanently for course {}", course_id)
        _release_lock(course_id, lock_token)
        raise


@celery_app.task(
    bind=True,
    max_retries=settings.tgp.TGP_RETRY_MAX_RETRIES,
    name="ai.tgp.regenerate_question",
)
def regenerate_single_question_task(self: Any, question_id: str) -> None:
    try:
        asyncio.run(_run_regenerate_question(question_id))
    except TgpGeminiRateLimitError as exc:
        retry_after = exc.retry_after
        if (
            retry_after is not None
            and retry_after > settings.tgp.TGP_RATE_LIMIT_MAX_RETRY_COUNTDOWN
        ):
            logger.warning(
                "TGP rate limit Retry-After {}s exceeds max countdown {}s, giving up for question {}",
                retry_after,
                settings.tgp.TGP_RATE_LIMIT_MAX_RETRY_COUNTDOWN,
                question_id,
            )
            raise
        countdown = retry_after or settings.tgp.TGP_RATE_LIMIT_DEFAULT_RETRY_SECONDS
        logger.warning(
            "TGP rate limited, retrying question {} in {}s", question_id, countdown
        )
        _schedule_question_retry(self, exc, countdown)
    except NETWORK_RETRY_EXCEPTIONS as exc:
        backoff = _network_backoff(self.request.retries)
        logger.warning(
            "TGP question regeneration network error, retrying {} in {}s",
            question_id,
            backoff,
        )
        _schedule_question_retry(self, exc, backoff)
    except Exception:
        logger.exception(
            "TGP question regeneration failed permanently for {}", question_id
        )
        raise
