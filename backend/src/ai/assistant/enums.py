from enum import StrEnum


class AssistantFocus(StrEnum):
    CONFUSED = "confused"
    THEORY = "theory"
    CODE_ERROR = "code_error"
    STEP_BY_STEP = "steps"


class AssistantAngle(StrEnum):
    SIMPLER = "simpler"
    MORE_EXAMPLES = "more_examples"
    DIFFERENT_EXAMPLE = "different_example"
    ANOTHER_APPROACH = "another_approach"


class AssistantAction(StrEnum):
    SIMPLER_EXAMPLE = "simpler_example"
    DIAGNOSE_CODE = "diagnose_code"
    WHY_WRONG = "why_wrong"
    FIRST_STEP = "first_step"
    EXPLAIN_AGAIN = "explain_again"
