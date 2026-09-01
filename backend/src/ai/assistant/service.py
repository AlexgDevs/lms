import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.assistant.exceptions import (
    AssistantAiNotConfiguredError,
    AssistantGenerationInProgressError,
    AssistantLadderNotFoundError,
    AssistantLimitExceededError,
)
from src.ai.assistant.prompts import (
    build_ask_prompt,
    build_ladder_prompt,
    build_regenerate_prompt,
)
from src.ai.assistant.schemas import (
    AssistantAskRequestSchema,
    AssistantHintRequestSchema,
    AssistantHintResponseSchema,
    AssistantLevelResponseSchema,
    AssistantRegenerateRequestSchema,
)
from src.ai.assistant.unit_of_work import AssistantUnitOfWork
from src.ai.gemini import GeminiService
from src.block.exceptions import BlockNotFoundError
from src.block.models import Block
from src.block.schemas import BlockSchema
from src.core.config import settings
from src.core.services import BaseService
from src.course.enums import CourseStatus
from src.course.exceptions import CourseMemberNotFoundError, CourseNotFoundError
from src.lesson.exceptions import LessonNotFoundError
from src.submissions.schemas import BlockSubmissionSchema

LADDER_CACHE_KEY = "assistant:ladder:{user_id}:{block_id}"
LADDER_LOCK_KEY = "assistant:ladder:lock:{user_id}:{block_id}"
DAILY_CALLS_KEY = "assistant:calls:{user_id}:{block_id}:{date}"


@dataclass
class AssistantContext:
    course_title: str
    module_title: str
    lesson_title: str
    lesson_description: str | None
    material: list[BlockSchema]
    block: BlockSchema
    submission: BlockSubmissionSchema | None


@dataclass
class AssistantAskContext:
    messages: list[dict[str, str]] = field(default_factory=list)


class AssistantService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        assistant_unit_of_work: AssistantUnitOfWork,
        redis: Redis,
    ) -> None:
        self.uow = assistant_unit_of_work
        self.redis = redis
        self.gemini = GeminiService(
            settings.ai.AI_API_KEY,
            settings.ai.AI_BASE_URL,
            settings.ai.AI_MODEL,
            timeout=settings.assistant.ASSISTANT_AI_TIMEOUT_SECONDS,
            max_retries=settings.assistant.ASSISTANT_AI_MAX_RETRIES,
        )
        super().__init__(session)

    # ------------------------------------------------------------------ hint ladder

    async def get_hint(
        self, payload: AssistantHintRequestSchema, user_id: UUID
    ) -> AssistantHintResponseSchema:
        if not settings.ai.AI_API_KEY:
            raise AssistantAiNotConfiguredError

        context = await self._build_context(
            payload.course_id, payload.lesson_id, payload.block_id, user_id
        )

        cached = await self._get_cached_ladder(user_id, payload.block_id)
        if cached:
            return AssistantHintResponseSchema(levels=cached)

        await self._enforce_daily_limit(user_id, payload.block_id)

        lock_key = LADDER_LOCK_KEY.format(user_id=user_id, block_id=payload.block_id)
        acquired = await self.redis.set(
            lock_key,
            "1",
            nx=True,
            ex=settings.assistant.ASSISTANT_GENERATION_LOCK_TTL_SECONDS,
        )
        if not acquired:
            raise AssistantGenerationInProgressError

        try:
            cached = await self._get_cached_ladder(user_id, payload.block_id)
            if cached:
                return AssistantHintResponseSchema(levels=cached)

            prompt = build_ladder_prompt(
                course_title=context.course_title,
                module_title=context.module_title,
                lesson_title=context.lesson_title,
                lesson_description=context.lesson_description,
                material=context.material,
                block=context.block,
                submission=context.submission,
                focus=payload.focus,
            )
            levels = await asyncio.to_thread(self.gemini.generate_ladder, prompt)
        finally:
            await self.redis.delete(lock_key)

        await self._cache_ladder(user_id, payload.block_id, levels)
        await self._increment_daily_calls(user_id, payload.block_id)
        return AssistantHintResponseSchema(levels=levels)

    # ------------------------------------------------------------------ free question

    async def regenerate_level(
        self, payload: AssistantRegenerateRequestSchema, user_id: UUID
    ) -> AssistantLevelResponseSchema:
        if not settings.ai.AI_API_KEY:
            raise AssistantAiNotConfiguredError

        context = await self._build_context(
            payload.course_id, payload.lesson_id, payload.block_id, user_id
        )

        ladder = await self._get_cached_ladder(user_id, payload.block_id)
        if not ladder:
            raise AssistantLadderNotFoundError

        await self._enforce_daily_limit(user_id, payload.block_id)

        prompt = build_regenerate_prompt(
            course_title=context.course_title,
            module_title=context.module_title,
            lesson_title=context.lesson_title,
            lesson_description=context.lesson_description,
            material=context.material,
            block=context.block,
            submission=context.submission,
            ladder=ladder,
            level_index=payload.level_index,
            angle=payload.angle,
        )
        level = await asyncio.to_thread(self.gemini.regenerate_level, prompt)

        await self._update_cached_level(
            user_id, payload.block_id, payload.level_index, level
        )
        await self._increment_daily_calls(user_id, payload.block_id)
        return AssistantLevelResponseSchema(level=level)

    async def build_ask_context(
        self, payload: AssistantAskRequestSchema, user_id: UUID
    ) -> AssistantAskContext:
        if not settings.ai.AI_API_KEY:
            raise AssistantAiNotConfiguredError

        context = await self._build_context(
            payload.course_id, payload.lesson_id, payload.block_id, user_id
        )

        await self._enforce_daily_limit(user_id, payload.block_id)
        await self._increment_daily_calls(user_id, payload.block_id)

        ladder = await self._get_cached_ladder(user_id, payload.block_id)
        history = [
            (message.role, message.content)
            for message in payload.history[
                -settings.assistant.ASSISTANT_MAX_HISTORY_MESSAGES :
            ]
        ]

        messages = build_ask_prompt(
            course_title=context.course_title,
            module_title=context.module_title,
            lesson_title=context.lesson_title,
            lesson_description=context.lesson_description,
            material=context.material,
            block=context.block,
            submission=context.submission,
            ladder=ladder,
            revealed_count=payload.revealed_levels,
            history=history,
            question=payload.question,
            action=payload.action,
            current_code=payload.current_code,
        )
        return AssistantAskContext(messages=messages)

    async def stream_answer(self, context: AssistantAskContext) -> AsyncIterator[str]:
        async for chunk in self.gemini.stream_chat(context.messages):
            yield chunk

    # ------------------------------------------------------------------ shared helpers

    async def _build_context(
        self, course_id: UUID, lesson_id: UUID, block_id: UUID, user_id: UUID
    ) -> AssistantContext:
        course = await self.uow.courses.get_one(id=course_id)
        if not course:
            raise CourseNotFoundError
        if course.status != CourseStatus.PUBLISHED and course.owner_id != user_id:
            raise CourseNotFoundError
        member = await self.uow.members.get_one(
            user_id=user_id, course_id=course.id, left_at=None
        )
        if not member:
            raise CourseMemberNotFoundError

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        module = await self.uow.modules.get_one(id=lesson.module_id)

        material = list(
            await self.uow.blocks.get_filtered(
                limit=1000,
                offset=0,
                order_by=Block.order.asc(),
                lesson_id=lesson_id,
            )
        )

        block = await self.uow.blocks.get_one(id=block_id, lesson_id=lesson_id)
        if not block:
            raise BlockNotFoundError

        submission = await self.uow.submissions.get_one(
            user_id=user_id, block_id=block_id
        )

        return AssistantContext(
            course_title=course.title,
            module_title=module.title if module else "",
            lesson_title=lesson.title,
            lesson_description=lesson.description,
            material=material,
            block=block,
            submission=submission,
        )

    async def _get_cached_ladder(
        self, user_id: UUID, block_id: UUID
    ) -> list[str] | None:
        key = LADDER_CACHE_KEY.format(user_id=user_id, block_id=block_id)
        raw = await self.redis.get(key)
        if not raw:
            return None
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            await self.redis.delete(key)
            return None
        if not isinstance(data, list) or not all(
            isinstance(level, str) for level in data
        ):
            await self.redis.delete(key)
            return None
        return data

    async def _cache_ladder(
        self, user_id: UUID, block_id: UUID, levels: list[str]
    ) -> None:
        key = LADDER_CACHE_KEY.format(user_id=user_id, block_id=block_id)
        ttl = int(settings.assistant.ASSISTANT_LADDER_TTL_HOURS * 3600)
        await self.redis.set(key, json.dumps(levels, ensure_ascii=False), ex=ttl)

    async def _update_cached_level(
        self, user_id: UUID, block_id: UUID, level_index: int, level: str
    ) -> None:
        ladder = await self._get_cached_ladder(user_id, block_id)
        if not ladder:
            return
        ladder[level_index] = level
        await self._cache_ladder(user_id, block_id, ladder)

    async def _enforce_daily_limit(self, user_id: UUID, block_id: UUID) -> None:
        key = DAILY_CALLS_KEY.format(
            user_id=user_id, block_id=block_id, date=self._today()
        )
        count = await self.redis.get(key)
        if (
            count is not None
            and int(count) >= settings.assistant.ASSISTANT_DAILY_CALL_LIMIT
        ):
            raise AssistantLimitExceededError

    async def _increment_daily_calls(self, user_id: UUID, block_id: UUID) -> None:
        key = DAILY_CALLS_KEY.format(
            user_id=user_id, block_id=block_id, date=self._today()
        )
        count = await self.redis.incr(key)
        if count == 1:
            await self.redis.expire(key, self._seconds_until_midnight())

    def _today(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _seconds_until_midnight(self) -> int:
        now = datetime.now(timezone.utc)
        tomorrow = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return max(1, int((tomorrow - now).total_seconds()))
