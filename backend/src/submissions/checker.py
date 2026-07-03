from typing import Dict, Callable, Awaitable

from src.block.schemas import BlockSchema
from src.block.enums import BlockType
from src.submissions.schemas import (
    BlockSubmissionRequestCreateSchema,
    QuizMultipleSubmission,
    QuizSingleSubmission,
)
from src.block.schemas import (
    QuizMultipleBlockContent,
    QuizSingleBlockContent,
)

CheckerFunc = Callable[
    [BlockSchema, BlockSubmissionRequestCreateSchema], Awaitable[bool]
]


class BlockChecker:
    _checkers: dict[BlockType, CheckerFunc] = {}

    @classmethod
    def register(cls, block_type: BlockType) -> Callable[[CheckerFunc], CheckerFunc]:
        def decorator(func: CheckerFunc) -> CheckerFunc:
            cls._checkers[block_type] = func
            return func

        return decorator

    @classmethod
    async def check(
        cls, block: BlockSchema, submission: BlockSubmissionRequestCreateSchema
    ) -> bool:
        if block.block_type is None:
            return True

        checker = cls._checkers.get(block.block_type)

        if checker is None:
            return True

        try:
            return await checker(block, submission)
        except AttributeError as e:
            raise ValueError(
                f"Invalid payload structure for block type {block.block_type}"
            ) from e


@BlockChecker.register(BlockType.QUIZ_SINGLE_CHOICE)
async def check_single_choice(
    block: BlockSchema, submission: BlockSubmissionRequestCreateSchema
) -> bool:
    block_payload = QuizSingleBlockContent.model_validate(block.payload)
    sub_payload = QuizSingleSubmission.model_validate(submission.payload)

    return block_payload.correct_option_id == sub_payload.selected_option_id


@BlockChecker.register(BlockType.QUIZ_MULTIPLE_CHOICE)
async def check_multiple_choice(
    block: BlockSchema, submission: BlockSubmissionRequestCreateSchema
) -> bool:
    block_payload = QuizMultipleBlockContent.model_validate(block.payload)
    sub_payload = QuizMultipleSubmission.model_validate(submission.payload)

    correct_ids = set(block_payload.correct_option_ids)
    selected_ids = set(sub_payload.selected_option_ids)
    return correct_ids == selected_ids
