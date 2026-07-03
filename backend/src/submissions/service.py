from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from src.submissions.exceptions import InvalidSubmissionCountError
from src.block.enums import BlockSubmissionType
from src.block.exceptions import BlockNotFoundError
from src.submissions.checker import BlockChecker
from src.submissions.schemas import (
    BlockSubmissionCreateSchema,
    BlockSubmissionRequestCreateSchema,
    BlockSubmissionSchema,
    BlockSubmissionUpdateSchema,
)
from src.submissions.unit_of_work import BlockSubmissionUnitOfWork
from src.core.services.base_service import BaseService


class BlockSubmissionService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        block_submission_unit_of_work: BlockSubmissionUnitOfWork,
    ):
        self.uow = block_submission_unit_of_work
        super().__init__(session)

    async def submit_blocks(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
        submissions: list[BlockSubmissionRequestCreateSchema],
    ) -> list[BlockSubmissionSchema]:

        result: list[BlockSubmissionSchema] = []

        # TODO: add check for course and lesson existence ; course by lesson ; user by courserecord
        block_count = await self.uow.blocks.get_count(lesson_id)
        if len(submissions) != block_count:
            raise InvalidSubmissionCountError

        for sub_request in submissions:
            block = await self.uow.blocks.get_one(  # TODO: add bulk request
                id=sub_request.block_id, lesson_id=lesson_id
            )
            if not block:
                raise BlockNotFoundError(f"Block {sub_request.block_id} not found")

            is_correct = await BlockChecker.check(block, sub_request)

            existing = await self.uow.submissions.get_one(
                block_id=sub_request.block_id,
                user_id=user_id,
            )

            if existing:
                if existing.submission_type == BlockSubmissionType.CORRECT:
                    update_data = BlockSubmissionUpdateSchema(
                        attempts=existing.attempts + 1,
                        submission_type=BlockSubmissionType.CORRECT,
                        submitted_payload=existing.submitted_payload,
                    )
                else:
                    update_data = BlockSubmissionUpdateSchema(
                        submitted_payload=sub_request.payload,
                        submission_type=(
                            BlockSubmissionType.CORRECT
                            if is_correct
                            else BlockSubmissionType.WRONG
                        ),
                        attempts=existing.attempts + 1,
                    )

                if existing.is_first_try_correct is None:
                    update_data.is_first_try_correct = is_correct

                updated = await self.uow.submissions.update(
                    id_=existing.id, data=update_data
                )
                result.append(updated)

            else:
                submission_data = BlockSubmissionCreateSchema(
                    lesson_id=lesson_id,
                    block_id=sub_request.block_id,
                    user_id=user_id,
                    submitted_payload=sub_request.payload,
                    submission_type=(
                        BlockSubmissionType.CORRECT
                        if is_correct
                        else BlockSubmissionType.WRONG
                    ),
                    attempts=1,
                    is_first_try_correct=is_correct,
                )
                created = await self.uow.submissions.create(submission_data)
                result.append(created)

        await self.uow.commit()
        return result


# TODO: add LESSON TYPE CHECKER
