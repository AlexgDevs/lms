import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any, cast

from loguru import logger
from openai import AsyncOpenAI, OpenAI, RateLimitError

from src.ai.tgp.exceptions import (
    TgpAiNotConfiguredError,
    TgpAiResponseError,
    TgpGeminiRateLimitError,
)
from src.core.config import settings

MIN_OPTIONS = 2


@dataclass(frozen=True)
class ModuleStructure:
    module_id: str
    module_title: str
    module_description: str | None = None


@dataclass(frozen=True)
class GeneratedQuestion:
    module_id: str
    question_text: str
    options: list[str]
    correct_option: int


@dataclass(frozen=True)
class ModuleStat:
    module_id: str
    module_title: str
    score: int


@dataclass(frozen=True)
class ModuleRecommendation:
    module_id: str
    decision: str
    reasoning: str


@dataclass(frozen=True)
class EvaluationResult:
    modules: list[ModuleRecommendation]
    verdict: str


@dataclass(frozen=True)
class CourseReviewResult:
    approved: bool
    flags: list[str]


def _parse_json(text: str | None) -> dict[str, Any]:
    if not text:
        raise TgpAiResponseError("AI model returned an empty response")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise TgpAiResponseError("AI model returned malformed JSON") from exc
    if not isinstance(data, dict):
        raise TgpAiResponseError("AI model response is not a JSON object")
    return data


def _extract_retry_after(exc: RateLimitError) -> int | None:
    headers = exc.response.headers
    raw = headers.get("Retry-After") or headers.get("retry-after")
    if not raw:
        return None
    try:
        return max(1, int(float(raw)))
    except ValueError:
        return None


def _validate_question(
    question_text: str, options: list[str], correct_option: int
) -> None:
    if not question_text.strip():
        raise TgpAiResponseError("Question text is empty")
    if len(options) < MIN_OPTIONS or any(not opt.strip() for opt in options):
        raise TgpAiResponseError("Question options are empty or malformed")
    if not 0 <= correct_option < len(options):
        raise TgpAiResponseError(
            f"correct_option {correct_option} out of range (0..{len(options) - 1})"
        )


def _normalize_question(item: dict[str, Any]) -> dict[str, Any] | None:
    question_text = str(item.get("question_text", "")).strip()
    options = [str(opt).strip() for opt in item.get("options", [])]
    try:
        correct_option = int(item.get("correct_option", 0))
    except TypeError, ValueError:
        correct_option = 0
    if not question_text or len(options) < MIN_OPTIONS or not all(options):
        logger.warning("TGP: skipping malformed question {}", item)
        return None
    if not 0 <= correct_option < len(options):
        logger.warning(
            "TGP: correct_option {} out of range, clamping to 0", correct_option
        )
        correct_option = 0
    return {
        "question_text": question_text,
        "options": options,
        "correct_option": correct_option,
    }


class GeminiService:
    def __init__(
        self,
        api_key: str | None,
        base_url: str,
        model: str,
        timeout: float = 60.0,
        max_retries: int = 2,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._timeout = timeout
        self._max_retries = max_retries
        self._client: OpenAI | None = None
        self._async_client: AsyncOpenAI | None = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            if not self._api_key:
                raise TgpAiNotConfiguredError
            self._client = OpenAI(
                base_url=self._base_url,
                api_key=self._api_key,
                timeout=self._timeout,
                max_retries=self._max_retries,
            )
        return self._client

    def _get_async_client(self) -> AsyncOpenAI:
        if self._async_client is None:
            if not self._api_key:
                raise TgpAiNotConfiguredError
            self._async_client = AsyncOpenAI(
                base_url=self._base_url,
                api_key=self._api_key,
                timeout=self._timeout,
                max_retries=self._max_retries,
            )
        return self._async_client

    def _generate_json(self, prompt: str) -> dict[str, Any]:
        client = self._get_client()
        try:
            response = client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.4,
            )
        except RateLimitError as exc:
            raise TgpGeminiRateLimitError(
                retry_after=_extract_retry_after(exc)
            ) from exc
        return _parse_json(response.choices[0].message.content)

    def generate_questions(
        self,
        course_title: str,
        structure: list[ModuleStructure],
        min_per_module: int = 2,
        max_per_module: int = 3,
    ) -> list[GeneratedQuestion]:
        modules_block = "\n".join(
            f'- "{m.module_title}"'
            + (f" ({m.module_description})" if m.module_description else "")
            for m in structure
        )
        prompt = (
            "You are an AI course assistant building a pre-course placement test "
            '(the "Golden Path").\n'
            f'Course: "{course_title}"\n'
            "Modules:\n"
            f"{modules_block}\n\n"
            "For EACH listed module generate between "
            f"{min_per_module} and {max_per_module} multiple-choice questions that "
            "assess readiness to study that module. All question text and options "
            "must be in Russian.\n"
            "Return strictly valid JSON in the shape:\n"
            '{"questions": [{"module_title": "<exact module title from the list>", '
            '"question_text": "...", "options": ["...", "..."], '
            '"correct_option": <int index of the correct option>}]}'
        )
        data = self._generate_json(prompt)

        title_to_id = {m.module_title: m.module_id for m in structure}
        by_module: dict[str, list[dict[str, Any]]] = {
            m.module_id: [] for m in structure
        }
        for item in data.get("questions", []):
            normalized = _normalize_question(item)
            if not normalized:
                continue
            module_id = title_to_id.get(item.get("module_title"))
            if not module_id:
                logger.warning(
                    "TGP: unknown module title {!r}, skipping question",
                    item.get("module_title"),
                )
                continue
            by_module[module_id].append(normalized)

        result: list[GeneratedQuestion] = []
        for module_id, questions in by_module.items():
            result.extend(
                GeneratedQuestion(
                    module_id=module_id,
                    question_text=q["question_text"],
                    options=q["options"],
                    correct_option=q["correct_option"],
                )
                for q in questions[:max_per_module]
            )
        return result

    def regenerate_question(
        self,
        course_title: str,
        module_title: str,
        question_text: str,
        options: list[str],
    ) -> GeneratedQuestion:
        prompt = (
            "You are an AI course assistant. Rewrite the following quiz question "
            "into a new variant of equal difficulty on the same topic. Question "
            "text and options must be in Russian.\n"
            f'Course: "{course_title}"\n'
            f'Module: "{module_title}"\n'
            f'Current question: "{question_text}"\n'
            f"Current options: {json.dumps(options, ensure_ascii=False)}\n"
            "Return strictly valid JSON in the shape:\n"
            '{"question_text": "...", "options": ["...", "..."], '
            '"correct_option": <int index of the correct option>}'
        )
        data = self._generate_json(prompt)
        normalized = _normalize_question(data)
        if not normalized:
            raise TgpAiResponseError("AI model returned a malformed question")
        return GeneratedQuestion(
            module_id="",
            question_text=normalized["question_text"],
            options=normalized["options"],
            correct_option=normalized["correct_option"],
        )

    def review_course(
        self,
        course_title: str,
        description: str | None,
        category_title: str | None,
        modules: list[str],
        lessons: list[str],
        text_content: str,
    ) -> CourseReviewResult:
        """Reviews a course for policy violations and quality problems.

        The reviewer never hard-rejects: an ``approved`` result can be
        auto-published, otherwise the returned flags are handed to a human
        moderator. All flags are one-line descriptions in Russian.
        """
        prompt = (
            "You are a course moderation reviewer for a learning platform. A "
            "course has been submitted for publication and must be checked for "
            "policy violations and obvious quality problems.\n"
            f'Course title: "{course_title}"\n'
            f'Description: "{description or ""}"\n'
            f'Category: "{category_title or ""}"\n'
            f"Modules: {json.dumps(modules, ensure_ascii=False)}\n"
            f"Lessons: {json.dumps(lessons, ensure_ascii=False)}\n"
            "Course content text:\n"
            f"{text_content or '(no text content)'}\n\n"
            "Check for: offensive or insulting language, spam or promotional "
            "links, personal data (emails, phones, names of real people), "
            "malicious instructions, placeholder/lorem-ipsum content, or a "
            "course that is practically empty. Approve (approved=true) only "
            "when the course looks legitimate and complete. If there are any "
            "issues, set approved=false and list each one as a short one-line "
            "flag in Russian.\n"
            "Return strictly valid JSON in the shape:\n"
            '{"approved": <true|false>, "flags": ["<issue>", ...]}'
        )
        data = self._generate_json(prompt)
        approved = bool(data.get("approved", False))
        flags = [
            str(flag).strip()
            for flag in data.get("flags", [])
            if isinstance(flag, str) and flag.strip()
        ]
        if data.get("approved") is None and not flags:
            raise TgpAiResponseError("AI model returned a malformed review")
        return CourseReviewResult(approved=approved, flags=flags)

    def evaluate_submission(
        self, course_title: str, module_stats: list[ModuleStat]
    ) -> EvaluationResult:
        stats_block = "\n".join(
            f'- "{stat.module_title}": {stat.score}% correct' for stat in module_stats
        )
        prompt = (
            "You are an AI academic advisor. A student took a placement test for "
            f'course "{course_title}". For each module the student scored:\n'
            f"{stats_block}\n\n"
            "Decide for each module whether the student should study it from the "
            "beginning (RECOMMENDED) or may treat it as optional (OPTIONAL). "
            "Threshold guidance: score below 60% -> RECOMMENDED, 60% and above -> "
            "OPTIONAL.\n"
            "Return strictly valid JSON in the shape:\n"
            '{"modules": [{"module_title": "<exact title>", '
            '"decision": "RECOMMENDED|OPTIONAL", '
            '"reasoning": "<short reasoning in Russian>"}], '
            '"verdict": "<overall verdict in Russian, 2-3 sentences>"}'
        )
        data = self._generate_json(prompt)

        title_to_id = {stat.module_title: stat.module_id for stat in module_stats}
        recommendations = []
        for item in data.get("modules", []):
            module_id = title_to_id.get(item.get("module_title", ""))
            if not module_id:
                continue
            recommendations.append(
                ModuleRecommendation(
                    module_id=module_id,
                    decision=str(item.get("decision", "OPTIONAL")).upper(),
                    reasoning=str(item.get("reasoning", "")),
                )
            )
        return EvaluationResult(
            modules=recommendations,
            verdict=str(data.get("verdict", "")),
        )

    def generate_ladder(self, prompt: str) -> list[str]:
        """Generates the 5-level scaffolding ladder for the assistant.

        Returns a list of exactly ``levels`` strings ordered from the simplest
        idea to the full solution. Levels are guaranteed to be non-empty and
        trimmed; malformed responses raise ``TgpAiResponseError``.
        """
        levels = settings.assistant.ASSISTANT_LEVELS_COUNT
        data = self._generate_json(prompt)
        raw_levels = data.get("levels")
        if not isinstance(raw_levels, list):
            raise TgpAiResponseError("AI model returned a malformed ladder")
        normalized = [
            str(level).strip()
            for level in raw_levels[:levels]
            if isinstance(level, str) and level.strip()
        ]
        if len(normalized) < levels:
            raise TgpAiResponseError("AI model returned too few ladder levels")
        return normalized[:levels]

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.5,
    ) -> AsyncIterator[str]:
        """Streams a chat completion as plain text chunks."""
        client = self._get_async_client()
        stream = await client.chat.completions.create(
            model=self._model,
            messages=cast(Any, messages),
            stream=True,
            temperature=temperature,
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content

    def regenerate_level(self, prompt: str) -> str:
        """Rephrases a single ladder level differently.

        Returns the trimmed, non-empty rephrased level text. Malformed or empty
        responses raise ``TgpAiResponseError``.
        """
        data = self._generate_json(prompt)
        level = data.get("level")
        if not isinstance(level, str) or not level.strip():
            raise TgpAiResponseError("AI model returned a malformed level")
        return level.strip()
