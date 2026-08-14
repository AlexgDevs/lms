import json
from dataclasses import dataclass
from typing import Any

from loguru import logger
from openai import OpenAI, RateLimitError

from src.ai.exceptions import (
    TgpAiNotConfiguredError,
    TgpAiResponseError,
    TgpGeminiRateLimitError,
)

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
