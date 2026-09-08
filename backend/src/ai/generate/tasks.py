"""Celery worker that generates a course structure using AI.

Two-phase generation pipeline:
  Phase 0: Generate modules and lessons (structure)
  Phase 1: For each module, generate lesson plans in batch
  Phase 2: For each lesson, generate block content in batch

Follows patterns from ai.tgp.tasks and ai.course_review.tasks.
"""

import asyncio
import random
import time
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

from src.ai.prompts import loader
from src.ai.generate.schemas import (
    BatchBlocksResponseSchema,
    BatchLessonPlanItemSchema,
    BatchLessonPlansResponseSchema,
    BlockContentSchema,
    LessonBlockPlanSchema,
    LessonPlanResponseSchema,
    LessonPlanSchema,
    LessonsResponseSchema,
    ModulePlanSchema,
    ModulesResponseSchema,
)
from src.ai.gemini import GeminiService
from src.block.enums import BlockType
from src.core.celery_app import celery_app
from src.core.config import settings
from src.course.enums import CourseStatus
from src.course.models import Course
from src.block.models import Block
from src.lesson.models import Lesson
from src.module.models import Module

COURSE_GENERATE_LOCK_KEY = "course_generate:{course_id}"

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

STR_MAX_LEN = 128
MIN_TEXT_LENGTH = 300
AI_CALL_DELAY = 0.3


def _truncate(value: str, max_len: int = STR_MAX_LEN) -> str:
    if len(value) <= max_len:
        return value
    return value[: max_len - 3] + "..."


def _build_gemini() -> GeminiService:
    return GeminiService(
        settings.ai.AI_API_KEY,
        settings.ai.AI_BASE_URL,
        settings.ai.AI_MODEL,
        timeout=settings.course_generate.COURSE_GENERATE_AI_TIMEOUT_SECONDS,
        max_retries=settings.course_generate.COURSE_GENERATE_AI_MAX_RETRIES,
    )


def _build_session_factory() -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(
        str(settings.postgres.DATABASE_URL), poolclass=NullPool
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return engine, session_factory


async def _release_lock_if_owned(redis: Redis, key: str, token: str) -> None:
    await redis.eval(_LOCK_RELEASE_SCRIPT, 1, key, token)


async def _extend_lock_if_owned(
    redis: Redis, key: str, token: str, ttl_seconds: int
) -> None:
    await redis.eval(_LOCK_EXTEND_SCRIPT, 1, key, token, ttl_seconds)


def _network_backoff(current_retries: int) -> int:
    backoff = settings.course_generate.COURSE_GENERATE_NETWORK_RETRY_BACKOFF * (
        2**current_retries
    )
    backoff = min(
        backoff, settings.course_generate.COURSE_GENERATE_NETWORK_RETRY_BACKOFF_MAX
    )
    return int(backoff + random.uniform(0, backoff * 0.1))


def _ai_call_delay() -> None:
    time.sleep(AI_CALL_DELAY)


# ---------------------------------------------------------------------------
# Prompt builders (delegate to the template loader in src/ai/prompts)
# ---------------------------------------------------------------------------


def _course_meta_prompt(topic: str) -> str:
    return loader.render("course_meta", topic=topic)


def _modules_prompt(topic: str, modules_count: int) -> str:
    return loader.render("modules", topic=topic, modules_count=modules_count)


def _lessons_prompt(
    topic: str,
    module_title: str,
    module_description: str,
    lessons_count: int,
) -> str:
    return loader.render(
        "lessons",
        topic=topic,
        module_title=module_title,
        module_description=module_description,
        lessons_count=lessons_count,
    )


def _lesson_plans_prompt(
    course_topic: str,
    module_title: str,
    lessons: list[dict[str, str]],
    blocks_per_lesson: int,
) -> str:
    lessons_list = "\n".join(
        f'  {i + 1}. "{les["title"]}" — {les.get("description", "")}'
        for i, les in enumerate(lessons)
    )
    return loader.render(
        "lesson_plans",
        course_topic=course_topic,
        module_title=module_title,
        lessons_list=lessons_list,
        blocks_per_lesson=blocks_per_lesson,
    )


def _blocks_prompt(
    course_topic: str,
    module_title: str,
    lesson_title: str,
    lesson_type: str,
    blocks: list[dict[str, str]],
) -> str:
    blocks_list = "\n".join(
        f'  {i + 1}. Type: {b["type"]}, Purpose: {b["purpose"]}'
        for i, b in enumerate(blocks)
    )
    return loader.render(
        "blocks",
        course_topic=course_topic,
        module_title=module_title,
        lesson_title=lesson_title,
        lesson_type=lesson_type,
        blocks_list=blocks_list,
    )


def _get_block_rules(block_type: str) -> str:
    return loader.render_rules(block_type)


def _single_block_prompt(
    course_topic: str,
    module_title: str,
    lesson_title: str,
    lesson_type: str,
    block_type: str,
    block_purpose: str,
    block_index: int,
    blocks_total: int,
    previous_blocks_summary: str,
) -> str:
    position_hint = ""
    if block_index == 0:
        position_hint = "This is the FIRST block — introduce the topic clearly."
    elif block_index == blocks_total - 1:
        position_hint = "This is the LAST block — summarize the lesson."
    else:
        position_hint = (
            f"This is block {block_index + 1} of {blocks_total} — "
            "continue developing the previous content."
        )
    return loader.render(
        "single_block",
        course_topic=course_topic,
        module_title=module_title,
        lesson_title=lesson_title,
        lesson_type=lesson_type,
        block_index=block_index + 1,
        blocks_total=blocks_total,
        block_type=block_type,
        block_purpose=block_purpose,
        position_hint=position_hint,
        previous_blocks_summary=previous_blocks_summary,
        block_rules=_get_block_rules(block_type),
    )


# ---------------------------------------------------------------------------
# AI generation helpers
# ---------------------------------------------------------------------------


def _generate_course_meta(gemini: GeminiService, topic: str) -> tuple[str, str]:
    """Generate a concise, keyword-based course title and description."""
    try:
        data = gemini._generate_json(_course_meta_prompt(topic))
        title = str(data.get("title", "")).strip() or topic
        description = str(data.get("description", "")).strip()
        if not description:
            description = f"Автоматически сгенерированный курс: {topic}"
        return _truncate(title, 120), _truncate(description, 300)
    except Exception as exc:
        logger.warning("Course meta generation failed, using topic as title: {}", exc)
        return _truncate(topic, 120), _truncate(
            f"Автоматически сгенерированный курс: {topic}", 300
        )


def _generate_modules(
    gemini: GeminiService, topic: str, modules_count: int
) -> list[ModulePlanSchema]:
    prompt = _modules_prompt(topic, modules_count)
    data = gemini._generate_json(prompt)
    resp = ModulesResponseSchema(**data)
    modules = resp.modules[:modules_count]
    while len(modules) < modules_count:
        idx = len(modules) + 1
        modules.append(
            ModulePlanSchema(title=f"Раздел {idx}", description=f"Раздел {idx}")
        )
    return modules


def _generate_lessons(
    gemini: GeminiService,
    topic: str,
    module_title: str,
    module_description: str,
    lessons_count: int,
) -> list[LessonPlanSchema]:
    prompt = _lessons_prompt(topic, module_title, module_description, lessons_count)
    data = gemini._generate_json(prompt)
    resp = LessonsResponseSchema(**data)
    lessons = resp.lessons[:lessons_count]
    while len(lessons) < lessons_count:
        idx = len(lessons) + 1
        lessons.append(LessonPlanSchema(title=f"Урок {idx}", description=f"Урок {idx}"))
    return lessons


def _generate_lesson_plans_batch(
    gemini: GeminiService,
    course_topic: str,
    module_title: str,
    lessons: list[dict[str, str]],
    blocks_per_lesson: int,
) -> list[BatchLessonPlanItemSchema]:
    """Generate lesson plans for ALL lessons in a module in a single AI call."""
    prompt = _lesson_plans_prompt(
        course_topic, module_title, lessons, blocks_per_lesson
    )
    try:
        data = gemini._generate_json(prompt)
        resp = BatchLessonPlansResponseSchema(**data)
        return resp.plans
    except Exception as exc:
        logger.warning(
            "Batch lesson plan generation failed for module '{}', using fallback: {}",
            module_title,
            exc,
        )
        return [
            BatchLessonPlanItemSchema(
                lesson_title=les["title"],
                lesson_type="theory",
                blocks=[
                    LessonBlockPlanSchema(
                        type=BlockType.TEXT,
                        purpose=f"Введение и основные концепции: {les['title']}",
                    ),
                    LessonBlockPlanSchema(
                        type=BlockType.TEXT,
                        purpose=f"Подробное объяснение: {les['title']}",
                    ),
                    LessonBlockPlanSchema(
                        type=BlockType.QUIZ_SINGLE_CHOICE,
                        purpose=f"Проверка понимания: {les['title']}",
                    ),
                ],
            )
            for les in lessons
        ]


def _generate_blocks_batch(
    gemini: GeminiService,
    course_topic: str,
    module_title: str,
    lesson_title: str,
    lesson_type: str,
    blocks: list[dict[str, str]],
) -> list[BlockContentSchema]:
    """Generate content for ALL blocks in a lesson in a single AI call."""
    prompt = _blocks_prompt(
        course_topic, module_title, lesson_title, lesson_type, blocks
    )
    try:
        data = gemini._generate_json(prompt)
        resp = BatchBlocksResponseSchema(**data)
        result = []
        for block in resp.blocks:
            payload = _normalize_payload(
                blocks[block.block_index - 1]["type"], block.payload
            )
            result.append(
                BlockContentSchema(
                    block_index=block.block_index,
                    title=block.title,
                    payload=payload,
                )
            )
        return result
    except Exception as exc:
        logger.warning(
            "Batch block generation failed for lesson '{}', using fallback: {}",
            lesson_title,
            exc,
        )
        return [
            BlockContentSchema(
                block_index=i + 1,
                title=b.get("purpose", f"Блок {i + 1}")[:100],
                payload=_fallback_payload(b["type"], b.get("purpose", "")),
            )
            for i, b in enumerate(blocks)
        ]


def _generate_single_block_content(
    gemini: GeminiService,
    course_topic: str,
    module_title: str,
    lesson_title: str,
    lesson_type: str,
    block_plan: LessonBlockPlanSchema,
    block_index: int,
    blocks_total: int,
    generated_blocks: list[dict[str, Any]],
) -> dict[str, Any]:
    """Fallback: generate a single block when batch fails."""
    previous_summary = _build_previous_blocks_summary(generated_blocks, lesson_title)

    prompt = _single_block_prompt(
        course_topic=course_topic,
        module_title=module_title,
        lesson_title=lesson_title,
        lesson_type=lesson_type,
        block_type=block_plan.type.value,
        block_purpose=block_plan.purpose,
        block_index=block_index,
        blocks_total=blocks_total,
        previous_blocks_summary=previous_summary,
    )

    try:
        data = gemini._generate_json(prompt)
        result = BlockContentSchema(**data)
        payload = _normalize_payload(block_plan.type.value, result.payload)
        return {
            "lesson_title": lesson_title,
            "block_type": block_plan.type.value,
            "title": result.title,
            "payload": payload,
        }
    except Exception as exc:
        logger.warning(
            "Single block generation failed for '{}' block {}, using fallback: {}",
            lesson_title,
            block_index,
            exc,
        )
        return {
            "lesson_title": lesson_title,
            "block_type": block_plan.type.value,
            "title": (
                block_plan.purpose[:100]
                if block_plan.purpose
                else f"Блок {block_index}"
            ),
            "payload": _fallback_payload(block_plan.type.value, block_plan.purpose),
        }


def _build_previous_blocks_summary(
    generated_blocks: list[dict[str, Any]], current_lesson_title: str
) -> str:
    lesson_blocks = [
        b for b in generated_blocks if b["lesson_title"] == current_lesson_title
    ]
    if not lesson_blocks:
        return "Нет предыдущих блоков (это первый блок урока)."

    lines: list[str] = []
    for b in lesson_blocks:
        bt = b["block_type"]
        title = b.get("title", bt)
        if bt == "text":
            text = b["payload"].get("text", "")
            preview = text[:300] + "..." if len(text) > 300 else text
            lines.append(f"- [{bt}] {title}: {preview}")
        elif bt.startswith("quiz"):
            lines.append(f"- [{bt}] {title} (тестовый вопрос)")
        elif bt == "code":
            lang = b["payload"].get("language", "code")
            lines.append(f"- [{bt}] {title} (пример кода на {lang})")
        else:
            lines.append(f"- [{bt}] {title}")

    return "\n".join(lines) if lines else "Нет предыдущих блоков."


def _fallback_payload(block_type: str, purpose: str) -> dict[str, Any]:
    if block_type == "text":
        return {
            "text": purpose if len(purpose) > 50 else f"Содержание блока: {purpose}"
        }
    if block_type in ("quiz_single_choice", "quiz_multiple_choice"):
        return {
            "options": [
                {"id": 1, "text": "Вариант А"},
                {"id": 2, "text": "Вариант Б"},
                {"id": 3, "text": "Вариант В"},
                {"id": 4, "text": "Вариант Г"},
            ],
            **(
                {"correct_option_id": 1}
                if block_type == "quiz_single_choice"
                else {"correct_option_ids": [1]}
            ),
        }
    if block_type == "code":
        return {
            "code": "# Пример\nprint('Привет, мир!')",
            "language": "python",
            "test_cases": [{"input": "", "output": "Привет, мир!"}],
        }
    if block_type == "image":
        return {
            "url": None,
            "alt_text": purpose if purpose else "Иллюстрация",
        }
    if block_type == "video":
        return {"url": None, "duration": 120}
    if block_type == "audio":
        return {"url": None}
    if block_type == "file":
        return {"url": None, "file_name": purpose if purpose else "Файл"}
    return {"text": purpose if purpose else "Содержание блока"}


# ---------------------------------------------------------------------------
# Text validation
# ---------------------------------------------------------------------------


def _validate_text_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Ensure text blocks have substantial content."""
    text = payload.get("text", "")
    if len(text) < MIN_TEXT_LENGTH:
        logger.warning(
            "Text block too short ({} chars), keeping as-is (AI quality issue)",
            len(text),
        )
    return payload


# ---------------------------------------------------------------------------
# Payload normalization
# ---------------------------------------------------------------------------


def _normalize_payload(block_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    if block_type == "text":
        if "text" not in payload and "html" not in payload:
            payload["text"] = payload.get("text", "Содержание")
        payload = _validate_text_payload(payload)
    elif block_type == "quiz_single_choice":
        options = payload.get("options", [])
        normalized: list[dict[str, Any]] = []
        for i, opt in enumerate(options):
            if isinstance(opt, dict):
                normalized.append(
                    {
                        "id": i + 1,
                        "text": str(opt.get("text", f"Вариант {i + 1}")),
                    }
                )
            else:
                normalized.append({"id": i + 1, "text": str(opt)})
        payload["options"] = normalized
        if "correct_option_id" not in payload:
            if "correct_option" in payload:
                payload["correct_option_id"] = payload.pop("correct_option")
            else:
                payload["correct_option_id"] = 1
        # Ensure correct_option_id is valid (1-based)
        valid_ids = {opt["id"] for opt in normalized}
        if payload["correct_option_id"] not in valid_ids:
            payload["correct_option_id"] = normalized[0]["id"] if normalized else 1
    elif block_type == "quiz_multiple_choice":
        options = payload.get("options", [])
        normalized_mc: list[dict[str, Any]] = []
        for i, opt in enumerate(options):
            if isinstance(opt, dict):
                normalized_mc.append(
                    {
                        "id": i + 1,
                        "text": str(opt.get("text", f"Вариант {i + 1}")),
                    }
                )
            else:
                normalized_mc.append({"id": i + 1, "text": str(opt)})
        payload["options"] = normalized_mc
        if "correct_option_ids" not in payload:
            payload["correct_option_ids"] = [1]
        # Ensure all correct_option_ids are valid (1-based)
        valid_ids = {opt["id"] for opt in normalized_mc}
        payload["correct_option_ids"] = [
            cid for cid in payload["correct_option_ids"] if cid in valid_ids
        ]
        if not payload["correct_option_ids"] and normalized_mc:
            payload["correct_option_ids"] = [normalized_mc[0]["id"]]
    elif block_type == "code":
        if "code" not in payload:
            payload["code"] = "# Решение\nprint('Привет')"
        if "language" not in payload:
            payload["language"] = "python"
        if "test_cases" not in payload or not payload["test_cases"]:
            payload["test_cases"] = [{"input": "", "output": "Привет"}]
    elif block_type == "image":
        if "alt_text" not in payload:
            payload["alt_text"] = "Иллюстрация"
        payload.setdefault("url", None)
    elif block_type == "video":
        payload.setdefault("url", None)
        payload.setdefault("duration", 120)
    elif block_type == "audio":
        payload.setdefault("url", None)
    elif block_type == "file":
        payload.setdefault("url", None)
        payload.setdefault("file_name", "Файл")
    return payload


def _get_block_title(block_type: str, payload: dict[str, Any], index: int) -> str:
    if block_type == "text":
        text = str(payload.get("text", ""))
        if text:
            return text[:100] + "..." if len(text) > 100 else text
    elif block_type in ("quiz_single_choice", "quiz_multiple_choice"):
        options = payload.get("options", [])
        if options:
            texts = []
            for opt in options[:3]:
                if isinstance(opt, dict):
                    texts.append(str(opt.get("text", ""))[:30])
                else:
                    texts.append(str(opt)[:30])
            return "Тест: " + " / ".join(texts)
    elif block_type == "code":
        language = str(payload.get("language", "code"))
        return f"Код ({language})"
    elif block_type == "image":
        alt = str(payload.get("alt_text", "Изображение"))
        return alt[:100]
    elif block_type == "video":
        return "Видео"
    elif block_type == "audio":
        return "Аудио"
    elif block_type == "file":
        name = str(payload.get("file_name", "Файл"))
        return name[:100]
    return f"Блок {index + 1}"


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Main generation pipeline
# ---------------------------------------------------------------------------


async def _run_generate_course(
    course_id: UUID,
    topic: str,
    modules_count: int,
    lessons_per_module: int,
    blocks_per_lesson: int,
) -> None:
    engine, session_factory = _build_session_factory()
    redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
    lock_key = COURSE_GENERATE_LOCK_KEY.format(course_id=course_id)
    lock_token = uuid4().hex

    try:
        acquired = await redis.set(
            lock_key,
            lock_token,
            nx=True,
            ex=settings.course_generate.COURSE_GENERATE_LOCK_TTL_SECONDS,
        )
        if not acquired:
            logger.info("Course generation already in progress for {}", course_id)
            return

        async with session_factory() as session:
            async with session.begin():
                course = (
                    await session.execute(select(Course).where(Course.id == course_id))
                ).scalar_one_or_none()

                if not course:
                    logger.warning("Course generation skipped: {} not found", course_id)
                    return
                if course.status != CourseStatus.DRAFT:
                    logger.warning(
                        "Course generation skipped: {} not in DRAFT ({})",
                        course_id,
                        course.status,
                    )
                    return

                logger.info(
                    "Generating course {}: topic='{}', modules={}, lessons={}, blocks={}",
                    course_id,
                    topic,
                    modules_count,
                    lessons_per_module,
                    blocks_per_lesson,
                )

                gemini = _build_gemini()

                # ---- Phase 0: Generate course meta + structure (modules + lessons) ----

                course_title, course_description = _generate_course_meta(gemini, topic)
                logger.info("Phase 0: course meta generated: {}", course_title)
                _ai_call_delay()

                modules_list = _generate_modules(gemini, topic, modules_count)
                logger.info("Phase 0: generated {} modules", len(modules_list))
                _ai_call_delay()

                # Build lessons per module
                all_lessons: list[dict[str, Any]] = []
                for mod in modules_list:
                    lessons = _generate_lessons(
                        gemini,
                        topic,
                        mod.title,
                        mod.description,
                        lessons_per_module,
                    )
                    for les in lessons:
                        all_lessons.append(
                            {
                                "module_title": mod.title,
                                "module_description": mod.description,
                                "lesson_title": les.title,
                                "lesson_description": les.description,
                            }
                        )
                    _ai_call_delay()
                logger.info("Phase 0: generated {} total lessons", len(all_lessons))

                # ---- Phase 1: Generate lesson plans (batched per module) ----

                # Group lessons by module
                lessons_by_module: dict[str, list[dict[str, Any]]] = {}
                for lesson_item in all_lessons:
                    mt = lesson_item["module_title"]
                    lessons_by_module.setdefault(mt, []).append(
                        {
                            "title": lesson_item["lesson_title"],
                            "description": lesson_item["lesson_description"],
                        }
                    )

                # Map from lesson_title -> plan
                plans_by_lesson: dict[str, BatchLessonPlanItemSchema] = {}

                for mod in modules_list:
                    mod_lessons = lessons_by_module.get(mod.title, [])
                    if not mod_lessons:
                        continue
                    plans = _generate_lesson_plans_batch(
                        gemini, topic, mod.title, mod_lessons, blocks_per_lesson
                    )
                    # Match plans to lessons by title
                    for plan in plans:
                        plans_by_lesson[plan.lesson_title] = plan
                    _ai_call_delay()

                # Assign plans to all_lessons, fallback if missing
                for lesson_info in all_lessons:
                    lt = lesson_info["lesson_title"]
                    if lt in plans_by_lesson:
                        lesson_info["plan"] = plans_by_lesson[lt]
                    else:
                        lesson_info["plan"] = BatchLessonPlanItemSchema(
                            lesson_title=lt,
                            lesson_type="theory",
                            blocks=[
                                LessonBlockPlanSchema(
                                    type=BlockType.TEXT,
                                    purpose=f"Введение в тему: {lt}",
                                ),
                                LessonBlockPlanSchema(
                                    type=BlockType.TEXT,
                                    purpose=f"Подробное объяснение: {lt}",
                                ),
                                LessonBlockPlanSchema(
                                    type=BlockType.QUIZ_SINGLE_CHOICE,
                                    purpose=f"Проверка знаний: {lt}",
                                ),
                            ],
                        )
                    logger.info(
                        "Phase 1: plan for '{}' — type={}, {} blocks",
                        lt,
                        lesson_info["plan"].lesson_type,
                        len(lesson_info["plan"].blocks),
                    )

                # ---- Phase 2: Generate block content (batched per lesson) ----

                all_blocks: list[dict[str, Any]] = []

                for lesson_info in all_lessons:
                    plan = lesson_info["plan"]
                    block_dicts = [
                        {"type": b.type.value, "purpose": b.purpose}
                        for b in plan.blocks
                    ]

                    # Try batch generation
                    batch_result = _generate_blocks_batch(
                        gemini,
                        course_topic=topic,
                        module_title=lesson_info["module_title"],
                        lesson_title=lesson_info["lesson_title"],
                        lesson_type=plan.lesson_type,
                        blocks=block_dicts,
                    )

                    if batch_result:
                        for block_schema in batch_result:
                            bt = block_dicts[block_schema.block_index - 1]["type"]
                            all_blocks.append(
                                {
                                    "lesson_title": lesson_info["lesson_title"],
                                    "block_type": bt,
                                    "title": block_schema.title,
                                    "payload": block_schema.payload,
                                }
                            )
                    else:
                        # Fallback: generate blocks one by one
                        for block_idx, block_plan in enumerate(plan.blocks):
                            content = _generate_single_block_content(
                                gemini,
                                course_topic=topic,
                                module_title=lesson_info["module_title"],
                                lesson_title=lesson_info["lesson_title"],
                                lesson_type=plan.lesson_type,
                                block_plan=block_plan,
                                block_index=block_idx,
                                blocks_total=len(plan.blocks),
                                generated_blocks=all_blocks,
                            )
                            content["lesson_title"] = lesson_info["lesson_title"]
                            all_blocks.append(content)

                    _ai_call_delay()
                    logger.debug(
                        "Phase 2: {} blocks for '{}'",
                        len(plan.blocks),
                        lesson_info["lesson_title"],
                    )

                logger.info("Phase 2: generated {} total blocks", len(all_blocks))

                # ---- Phase 3: Create DB records (single transaction) ----

                course.title = _truncate(course_title, 128)
                course.description = _truncate(course_description, 300)
                session.add(course)

                # Index blocks by lesson_title
                blocks_by_lesson: dict[str, list[dict[str, Any]]] = {}
                for block in all_blocks:
                    lt = block["lesson_title"]
                    blocks_by_lesson.setdefault(lt, []).append(block)

                lesson_order_counter: dict[str, int] = {}

                for mod_idx, mod in enumerate(modules_list):
                    module_row = Module(
                        course_id=course_id,
                        title=_truncate(mod.title, 128),
                        description=_truncate(mod.description, 300),
                        order=mod_idx,
                    )
                    session.add(module_row)
                    await session.flush()
                    logger.info(
                        "Module created: {} ({})", module_row.title, module_row.id
                    )

                    for lesson_info in all_lessons:
                        if lesson_info["module_title"] != mod.title:
                            continue
                        lesson_key = lesson_info["lesson_title"]
                        current_order = lesson_order_counter.get(lesson_key, 0)
                        lesson_row = Lesson(
                            course_id=course_id,
                            module_id=module_row.id,
                            title=_truncate(lesson_info["lesson_title"], 128),
                            description=_truncate(
                                lesson_info["lesson_description"], 300
                            ),
                            order=current_order,
                        )
                        session.add(lesson_row)
                        await session.flush()
                        lesson_order_counter[lesson_key] = current_order + 1
                        logger.info(
                            "Lesson created: {} ({})",
                            lesson_row.title,
                            lesson_row.id,
                        )

                        lesson_blocks = blocks_by_lesson.get(lesson_key, [])
                        for blk_idx, block_info in enumerate(lesson_blocks):
                            block_title = block_info.get("title") or _get_block_title(
                                block_info["block_type"],
                                block_info["payload"],
                                blk_idx,
                            )
                            block_row = Block(
                                course_id=course_id,
                                lesson_id=lesson_row.id,
                                block_type=block_info["block_type"],
                                title=_truncate(block_title),
                                order=blk_idx,
                                payload=block_info["payload"],
                            )
                            session.add(block_row)
                            logger.info(
                                "Block created: {} ({})",
                                block_row.block_type,
                                block_row.id,
                            )

                await session.commit()
                logger.info("Course generation completed: {}", course_id)

    except Exception as exc:
        logger.error(
            "Course generation failed for {}; keeping course in DRAFT: {}",
            course_id,
            exc,
        )
        raise
    finally:
        await _release_lock_if_owned(redis, lock_key, lock_token)
        await redis.aclose()
        await engine.dispose()


def _release_lock(course_id: str, lock_token: str | None) -> None:
    if not lock_token:
        return
    try:
        redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
        try:
            asyncio.run(
                _release_lock_if_owned(
                    redis,
                    COURSE_GENERATE_LOCK_KEY.format(course_id=course_id),
                    lock_token,
                )
            )
        finally:
            asyncio.run(redis.aclose())
    except Exception:
        logger.exception("Course generation: failed to release lock for {}", course_id)


def _schedule_retry(
    self: Any,
    exc: Exception,
    course_id: str,
    lock_token: str | None,
    countdown: int,
) -> None:
    if self.request.retries >= settings.course_generate.COURSE_GENERATE_MAX_RETRIES:
        logger.warning("Course generation exhausted retries for {}", course_id)
        _release_lock(course_id, lock_token)
        raise exc
    if lock_token:
        redis = from_url(settings.redis.REDIS_URL, decode_responses=True)
        try:
            asyncio.run(
                _extend_lock_if_owned(
                    redis,
                    COURSE_GENERATE_LOCK_KEY.format(course_id=course_id),
                    lock_token,
                    settings.course_generate.COURSE_GENERATE_LOCK_TTL_SECONDS,
                )
            )
        finally:
            asyncio.run(redis.aclose())
    raise self.retry(exc=exc, countdown=countdown)


@celery_app.task(
    bind=True,
    max_retries=settings.course_generate.COURSE_GENERATE_MAX_RETRIES,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    name="course.generate_ai",
)
def course_generate_task(
    self: Any,
    course_id: str,
    topic: str,
    modules_count: int,
    lessons_per_module: int,
    blocks_per_lesson: int,
) -> None:
    lock_token = uuid4().hex
    try:
        asyncio.run(
            _run_generate_course(
                UUID(course_id),
                topic,
                modules_count,
                lessons_per_module,
                blocks_per_lesson,
            )
        )
    except NETWORK_RETRY_EXCEPTIONS as exc:
        backoff = _network_backoff(self.request.retries)
        logger.warning(
            "Course generation network error, retrying {} in {}s",
            course_id,
            backoff,
        )
        _schedule_retry(self, exc, course_id, lock_token, backoff)
    except Exception:
        logger.exception("Course generation failed permanently for {}", course_id)
        _release_lock(course_id, lock_token)
        raise
