import json
from typing import Any

from src.ai.assistant.schemas import AssistantAction, AssistantAngle, AssistantFocus
from src.block.enums import BlockType
from src.block.schemas import BlockSchema
from src.submissions.schemas import BlockSubmissionSchema

FOCUS_DESCRIPTIONS: dict[AssistantFocus, str] = {
    AssistantFocus.CONFUSED: "the learner is confused by the task statement",
    AssistantFocus.THEORY: (
        "the learner knows the theory but does not know how to start solving"
    ),
    AssistantFocus.CODE_ERROR: "the learner has an error somewhere in their code",
    AssistantFocus.STEP_BY_STEP: "the learner wants a step-by-step walkthrough",
}

LADDER_LEVEL_RULES = """\
Level 0 — reframe the task in simple words and name the key concept. Do NOT give the answer.
Level 1 — give a general step-by-step plan (an orientation), still no solution.
Level 2 — give a simplified ANALOGOUS example on DIFFERENT data that demonstrates the
    technique. Do not copy the task's own numbers/data.
Level 3 — apply the technique to THIS task, almost solving it. If the learner's last
    attempt is provided, explain here why that attempt was wrong.
Level 4 — give the full solution with a brief explanation of why it works.
"""

SYSTEM_PERSONA = """\
You are "Irbis", a friendly AI tutor on an online learning platform. You help a learner \
who is stuck on a lesson step. You speak Russian, write short, warm messages (2-4 short \
sentences per level, code snippets allowed where relevant), and always rely ONLY on the \
lesson material and the task given in the context. You never invent facts outside the \
lesson. You teach the learner to solve the task themselves instead of just doing it for \
them: you never reveal the final answer before the scaffolding guides them to it.\
"""

ANGLE_RULES: dict[AssistantAngle, str] = {
    AssistantAngle.SIMPLER: (
        "rephrase the level in simpler words, use an everyday analogy, cut any jargon"
    ),
    AssistantAngle.MORE_EXAMPLES: (
        "keep the explanation but add one or two short clarifying examples (on DIFFERENT "
        "data, never the task's own numbers)"
    ),
    AssistantAngle.DIFFERENT_EXAMPLE: (
        "replace the example(s) with a completely different, simpler one that illustrates "
        "the same idea"
    ),
    AssistantAngle.ANOTHER_APPROACH: (
        "explain the same idea using a different method or viewpoint than before"
    ),
}

ACTION_RULES: dict[AssistantAction, str] = {
    AssistantAction.SIMPLER_EXAMPLE: (
        "Give a SIMPLER extra example (on different data, never the task's own numbers) "
        "that illustrates the technique in action. 2-4 short sentences. Do NOT solve the "
        "learner's task."
    ),
    AssistantAction.DIAGNOSE_CODE: (
        "Analyze the learner's current code shown in the context (marked as CURRENT CODE). "
        "Find the error, explain WHY it happens in 2-3 sentences, and give a hint on how to "
        "fix it themselves. Do NOT paste the full fixed solution — at most a tiny fragment "
        "that illustrates the fix."
    ),
    AssistantAction.WHY_WRONG: (
        "Explain WHY the learner's last submitted answer was wrong (the wrong answer is in "
        "the context). 2-4 short sentences, kind and specific. Point toward the right idea "
        "without spelling out the final answer."
    ),
    AssistantAction.FIRST_STEP: (
        "Give ONLY the very first step of solving, the minimal nudge to get started. "
        "1-2 short sentences. Do NOT reveal any further steps or the solution."
    ),
    AssistantAction.EXPLAIN_AGAIN: (
        "The learner did not understand the previous explanation. Rephrase it from scratch, "
        "in simpler words and a different angle. 2-4 short sentences. Keep the same level of "
        "detail and DO NOT reveal more than the previously revealed hints/solution allow."
    ),
}


def _truncate(text: str, limit: int = 1200) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "…"


def _lesson_material(blocks: list[BlockSchema]) -> str:
    lines: list[str] = []
    for block in blocks:
        if block.block_type != BlockType.TEXT:
            continue
        payload = block.payload or {}
        content = payload.get("text") or payload.get("html") or ""
        text = _truncate(str(content), 800)
        if text:
            lines.append(f"- {text}")
    return "\n".join(lines) if lines else "—"


def _describe_quiz(block: BlockSchema) -> str:
    payload: dict[str, Any] = block.payload or {}
    options = payload.get("options", [])
    if block.block_type == BlockType.QUIZ_MULTIPLE_CHOICE:
        secret = payload.get("correct_option_ids", [])
        lines = [
            f"Select ALL correct options from the list. SECRET correct ids: {secret}."
        ]
    else:
        secret = payload.get("correct_option_id")
        lines = [f"Select the correct option. SECRET correct id: {secret}."]
    for option in options:
        if isinstance(option, dict):
            lines.append(f'  - [{option.get("id")}] {option.get("text")}')
    return "\n".join(lines)


def _describe_code(block: BlockSchema) -> str:
    payload: dict[str, Any] = block.payload or {}
    language = payload.get("language", "")
    starter = _truncate(str(payload.get("code", "")), 1200)
    test_cases = payload.get("test_cases", [])
    cases = "\n".join(
        f'  - input: {json.dumps(case.get("input", ""), ensure_ascii=False)} -> '
        f'expected output: {json.dumps(case.get("output", ""), ensure_ascii=False)}'
        for case in test_cases
        if isinstance(case, dict)
    )
    return (
        f"Language: {language}\n"
        f"Starter code:\n```\n{starter}\n```\n"
        f"Test cases:\n{cases or '  (none)'}"
    )


def _describe_block(block: BlockSchema) -> str:
    payload: dict[str, Any] = block.payload or {}
    base = f'Task ({block.block_type.value}): "{block.title}".\n'
    if block.block_type in (
        BlockType.QUIZ_SINGLE_CHOICE,
        BlockType.QUIZ_MULTIPLE_CHOICE,
    ):
        return base + _describe_quiz(block)
    if block.block_type == BlockType.CODE:
        return base + _describe_code(block)
    return base + _truncate(
        str(payload.get("text") or payload.get("html") or payload), 800
    )


def _describe_attempt(block: BlockSchema, submission: BlockSubmissionSchema) -> str:
    payload: dict[str, Any] = submission.submitted_payload or {}
    if block.block_type == BlockType.CODE:
        code = _truncate(str(payload.get("code", "")), 1500)
        return f"Learner's last code (WRONG):\n```\n{code}\n```"
    if block.block_type == BlockType.QUIZ_SINGLE_CHOICE:
        return f"Learner's last selected option id (WRONG): {payload.get('selected_option_id')}"
    if block.block_type == BlockType.QUIZ_MULTIPLE_CHOICE:
        return (
            "Learner's last selected option ids (WRONG): "
            f"{payload.get('selected_option_ids')}"
        )
    return "—"


def build_ladder_prompt(
    course_title: str,
    module_title: str,
    lesson_title: str,
    lesson_description: str | None,
    material: list[BlockSchema],
    block: BlockSchema,
    submission: BlockSubmissionSchema | None,
    focus: AssistantFocus,
) -> str:
    material_text = _lesson_material(material)
    attempt_text = _describe_attempt(block, submission) if submission else "—"
    attempts = submission.attempts if submission else 0
    focus_text = FOCUS_DESCRIPTIONS[focus]

    return f"""{SYSTEM_PERSONA}

Context:
- Course: "{course_title}"
- Module: "{module_title}"
- Lesson: "{lesson_title}"{f' — {_truncate(lesson_description or "", 400)}' if lesson_description else ""}
- Lesson material (source of truth, rely on it):
{material_text}

{_describe_block(block)}

Attempts so far: {attempts}
{attempt_text}

Learner's stated difficulty: {focus_text}.

Build a scaffolding ladder of exactly 5 levels that guides the learner from the simplest
idea to the full solution.
{LADDER_LEVEL_RULES}
Rules:
- Answer in Russian. Keep each level concise (2-4 short sentences).
- The SECRET (correct answer / solution) must never appear at levels 0-1, and should be
  revealed only gradually from level 3 onward.
- At level 2 use a DIFFERENT, simpler example, never the task's own data.
- At level 4 a short code snippet is allowed for code tasks.
Return strictly valid JSON in the shape:
{{"levels": ["<level 0 text>", "<level 1 text>", "<level 2 text>", "<level 3 text>", "<level 4 text>"]}}"""


def _build_context_block(
    course_title: str,
    module_title: str,
    lesson_title: str,
    lesson_description: str | None,
    material: list[BlockSchema],
    block: BlockSchema,
    submission: BlockSubmissionSchema | None,
    current_code: str | None = None,
) -> str:
    material_text = _lesson_material(material)
    attempt_text = _describe_attempt(block, submission) if submission else "—"
    attempts = submission.attempts if submission else 0

    block_text = (
        f"{SYSTEM_PERSONA}\n\n"
        f"Context:\n"
        f'- Course: "{course_title}"\n'
        f'- Module: "{module_title}"\n'
        f'- Lesson: "{lesson_title}"'
        f'{f" — {_truncate(lesson_description or "", 400)}" if lesson_description else ""}\n'
        f"- Lesson material (source of truth, rely on it):\n"
        f"{material_text}\n\n"
        f"{_describe_block(block)}\n\n"
        f"Attempts so far: {attempts}\n"
        f"{attempt_text}\n"
    )
    if current_code and current_code.strip():
        code = _truncate(current_code.strip(), 2000)
        block_text += f"\nCURRENT CODE (the learner's code in the editor right now):\n```\n{code}\n```\n"
    return block_text


def build_ask_prompt(
    course_title: str,
    module_title: str,
    lesson_title: str,
    lesson_description: str | None,
    material: list[BlockSchema],
    block: BlockSchema,
    submission: BlockSubmissionSchema | None,
    ladder: list[str] | None,
    revealed_count: int,
    history: list[tuple[str, str]],
    question: str,
    action: AssistantAction | None = None,
    current_code: str | None = None,
) -> list[dict[str, str]]:
    context_block = _build_context_block(
        course_title=course_title,
        module_title=module_title,
        lesson_title=lesson_title,
        lesson_description=lesson_description,
        material=material,
        block=block,
        submission=submission,
        current_code=current_code,
    )

    if ladder:
        shown = ladder[:revealed_count]
        if shown:
            context_block += "\nHints already shown to the learner:\n" + "\n".join(
                f"- {level}" for level in shown
            )

    messages: list[dict[str, str]] = [{"role": "system", "content": context_block}]
    for role, content in history:
        messages.append({"role": role, "content": content})
    if action:
        messages.append(
            {
                "role": "user",
                "content": f"Action for you: {ACTION_RULES[action]}\nAnswer in Russian.",
            }
        )
    else:
        messages.append({"role": "user", "content": question})

    return messages


def build_regenerate_prompt(
    course_title: str,
    module_title: str,
    lesson_title: str,
    lesson_description: str | None,
    material: list[BlockSchema],
    block: BlockSchema,
    submission: BlockSubmissionSchema | None,
    ladder: list[str],
    level_index: int,
    angle: AssistantAngle,
) -> str:
    context_block = _build_context_block(
        course_title=course_title,
        module_title=module_title,
        lesson_title=lesson_title,
        lesson_description=lesson_description,
        material=material,
        block=block,
        submission=submission,
    )

    ladder_block = "\n".join(f"{index}. {level}" for index, level in enumerate(ladder))
    current_level = ladder[level_index]
    angle_rule = ANGLE_RULES[angle]

    return f"""{context_block}

The scaffolding ladder of hints shown/available to the learner:
{ladder_block}

The learner did not understand level {level_index}:
"{current_level}"

Rephrase ONLY level {level_index}. Keep its place in the ladder: respect the same
level rules ({LADDER_LEVEL_RULES.strip()}) — do not reveal the solution earlier than
this level allows. The rephrasing must stay consistent with the other levels.

How to rephrase: {angle_rule}.

Answer in Russian, 2-4 short sentences.
Return strictly valid JSON in the shape:
{{"level": "<the rephrased level text>"}}"""
