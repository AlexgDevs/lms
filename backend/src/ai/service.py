import asyncio
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

from loguru import logger
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.enums import TgpDecision
from src.ai.exceptions import (
    NotEnoughModulesError,
    TgpAiNotConfiguredError,
    TgpCooldownError,
    TgpGenerationInProgressError,
    TgpInvalidAnswersError,
    TgpNoQuestionsError,
    TgpNotEnabledError,
    TgpQuestionNotFoundError,
)
from src.ai.gemini import (
    EvaluationResult,
    GeminiService,
    ModuleRecommendation,
    ModuleStat,
)
from src.ai.schemas import (
    TgpGenerateResponseSchema,
    TgpModuleRecommendationSchema,
    TgpQuestionSchema,
    TgpSubmitRequestSchema,
    TgpSubmitResponseSchema,
)
from src.ai.tasks import (
    TGP_LOCK_KEY,
    generate_tgp_test_task,
    regenerate_single_question_task,
)
from src.ai.unit_of_work import AiUnitOfWork
from src.core.config import settings
from src.core.services import BaseService
from src.course.enums import CourseStatus
from src.course.exceptions import CourseMemberNotFoundError, CourseNotFoundError

DECISION_BY_VALUE: dict[str, TgpDecision] = {
    TgpDecision.RECOMMENDED.value: TgpDecision.RECOMMENDED,
    TgpDecision.OPTIONAL.value: TgpDecision.OPTIONAL,
}

LOCAL_THRESHOLD_SCORE = 60


def _local_decision(score: int) -> TgpDecision:
    return (
        TgpDecision.RECOMMENDED
        if score < LOCAL_THRESHOLD_SCORE
        else TgpDecision.OPTIONAL
    )


class AiService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        ai_unit_of_work: AiUnitOfWork,
        redis: Redis,
    ) -> None:
        self.uow = ai_unit_of_work
        self.redis = redis
        self.gemini = GeminiService(
            settings.ai.AI_API_KEY,
            settings.ai.AI_BASE_URL,
            settings.ai.AI_MODEL,
            timeout=settings.tgp.TGP_AI_TIMEOUT_SECONDS,
            max_retries=settings.tgp.TGP_AI_MAX_RETRIES,
        )
        super().__init__(session)

    async def generate(
        self, course_id: UUID, owner_id: UUID
    ) -> TgpGenerateResponseSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError
        if not course.tgp_enabled:
            raise TgpNotEnabledError
        if not settings.ai.AI_API_KEY:
            raise TgpAiNotConfiguredError

        now = datetime.now(timezone.utc)
        if course.tgp_last_full_generated_at:
            cooldown_end = course.tgp_last_full_generated_at + timedelta(
                hours=course.tgp_cooldown_hours
            )
            if now < cooldown_end:
                retry_after = int((cooldown_end - now).total_seconds())
                raise TgpCooldownError(
                    f"TGP was already generated. Retry-After: {retry_after} seconds"
                )

        module_count = await self.uow.modules.get_count(course_id)
        if module_count < settings.tgp.TGP_MIN_MODULES:
            raise NotEnoughModulesError

        lock_key = TGP_LOCK_KEY.format(course_id=course_id)
        lock_token = str(uuid4())
        acquired = await self.redis.set(
            lock_key,
            lock_token,
            nx=True,
            ex=settings.tgp.TGP_GENERATION_LOCK_TTL_SECONDS,
        )
        if not acquired:
            raise TgpGenerationInProgressError

        task = generate_tgp_test_task.delay(str(course_id), lock_token)
        return TgpGenerateResponseSchema(task_id=task.id, course_id=course_id)

    async def regenerate_question(
        self, question_id: UUID, owner_id: UUID
    ) -> TgpGenerateResponseSchema:
        question = await self.uow.questions.get_one(id=question_id)
        if not question:
            raise TgpQuestionNotFoundError

        course = await self.uow.courses.get_one(
            id=question.course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError
        if not course.tgp_enabled:
            raise TgpNotEnabledError
        if not settings.ai.AI_API_KEY:
            raise TgpAiNotConfiguredError

        now = datetime.now(timezone.utc)
        cooldown_end = question.updated_at + timedelta(
            hours=settings.tgp.TGP_QUESTION_REGENERATION_COOLDOWN_HOURS
        )
        if now < cooldown_end:
            retry_after = int((cooldown_end - now).total_seconds())
            raise TgpCooldownError(
                f"Question was already regenerated recently. "
                f"Retry-After: {retry_after} seconds"
            )

        task = regenerate_single_question_task.delay(str(question_id))
        return TgpGenerateResponseSchema(task_id=task.id, course_id=course.id)

    async def submit(
        self, course_id: UUID, user_id: UUID, payload: TgpSubmitRequestSchema
    ) -> TgpSubmitResponseSchema:
        course = await self.uow.courses.get_one(id=course_id)
        if not course:
            raise CourseNotFoundError
        if not course.tgp_enabled:
            raise TgpNotEnabledError
        if course.status != CourseStatus.PUBLISHED and course.owner_id != user_id:
            raise CourseNotFoundError

        member = await self.uow.members.get_one(
            user_id=user_id, course_id=course.id, left_at=None
        )
        if not member:
            raise CourseMemberNotFoundError

        questions = await self.uow.questions.get_by_course(course_id)
        if not questions:
            raise TgpNoQuestionsError

        answers_map = {
            answer.question_id: answer.answer_index for answer in payload.answers
        }
        if len(answers_map) != len(questions) or not all(
            question.id in answers_map for question in questions
        ):
            raise TgpInvalidAnswersError

        questions_by_module: dict[UUID, list[TgpQuestionSchema]] = defaultdict(list)
        for question in questions:
            questions_by_module[question.module_id].append(question)

        modules = list(
            await self.uow.modules.get_filtered(
                limit=1000, offset=0, course_id=course_id
            )
        )
        module_titles = {module.id: module.title for module in modules}

        module_stats: list[ModuleStat] = []
        for module_id, module_questions in questions_by_module.items():
            correct = sum(
                1
                for question in module_questions
                if answers_map.get(question.id) == question.correct_option
            )
            score = round(correct * 100 / len(module_questions))
            module_stats.append(
                ModuleStat(
                    module_id=str(module_id),
                    module_title=module_titles.get(module_id, ""),
                    score=score,
                )
            )

        result = await self._evaluate_with_fallback(course, module_stats)
        recommendations = self._build_recommendations(module_stats, result)

        return TgpSubmitResponseSchema(
            course_id=course_id,
            modules=recommendations,
            verdict=result.verdict,
        )

    async def _evaluate_with_fallback(
        self,
        course: Any,
        module_stats: list[ModuleStat],
    ) -> EvaluationResult:
        try:
            return await asyncio.to_thread(
                self.gemini.evaluate_submission, course.title, module_stats
            )
        except Exception:
            logger.exception("TGP AI evaluation failed; using deterministic fallback")
            return self._local_evaluation(module_stats)

    def _local_evaluation(self, module_stats: list[ModuleStat]) -> EvaluationResult:
        recommendations = [
            ModuleRecommendation(
                module_id=stat.module_id,
                decision=_local_decision(stat.score).value,
                reasoning=(
                    "Результат ниже 60%: рекомендуется изучить с нуля"
                    if stat.score < LOCAL_THRESHOLD_SCORE
                    else "Результат от 60%: модуль можно изучать выборочно"
                ),
            )
            for stat in module_stats
        ]
        return EvaluationResult(
            modules=recommendations,
            verdict="",
        )

    def _build_recommendations(
        self,
        module_stats: list[ModuleStat],
        result: EvaluationResult,
    ) -> list[TgpModuleRecommendationSchema]:
        by_module_id = {
            recommendation.module_id: recommendation
            for recommendation in result.modules
        }
        recommendations: list[TgpModuleRecommendationSchema] = []
        for index, stat in enumerate(module_stats):
            recommendation = by_module_id.get(stat.module_id)
            if not recommendation:
                # Fall back to AI decision by list position (AI may reorder/rename),
                # otherwise apply the local threshold.
                fallback = (
                    result.modules[index] if index < len(result.modules) else None
                )
                if fallback and fallback.module_id in {
                    s.module_id for s in module_stats
                }:
                    recommendation = fallback
                else:
                    recommendation = ModuleRecommendation(
                        module_id=stat.module_id,
                        decision=_local_decision(stat.score).value,
                        reasoning="",
                    )
            decision = DECISION_BY_VALUE.get(
                recommendation.decision.upper(), _local_decision(stat.score)
            )
            reasoning = recommendation.reasoning
            if not reasoning:
                reasoning = (
                    "Результат ниже 60%: рекомендуется изучить с нуля"
                    if stat.score < LOCAL_THRESHOLD_SCORE
                    else "Результат от 60%: модуль можно изучать выборочно"
                )
            recommendations.append(
                TgpModuleRecommendationSchema(
                    module_id=UUID(stat.module_id),
                    module_title=stat.module_title,
                    score=stat.score,
                    decision=decision,
                    reasoning=reasoning,
                )
            )
        return recommendations
