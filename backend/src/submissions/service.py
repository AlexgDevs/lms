from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from src.course.exceptions import CourseNotFoundError
from src.lesson.lesson_progress.schemas import (
    LessonProgressCreateSchema,
    LessonProgressUpdateSchema,
)
from src.block.exceptions import BlockNotFoundError
from src.lesson.enums import LessonProgressType
from src.lesson.service import LessonService
from src.submissions.exceptions import (
    DuplicateBlocksInSubmissionError,
    InvalidSubmissionBlocksError,
)
from src.block.enums import BlockSubmissionType
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
        lesson_service: LessonService,
    ):
        self.uow = block_submission_unit_of_work
        self.lesson_service = lesson_service
        super().__init__(session)

    async def submit_blocks(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
        submissions: list[BlockSubmissionRequestCreateSchema],
    ) -> list[BlockSubmissionSchema]:
        """Processes a bulk submission of user answers for the current lesson's blocks.

        This method performs an end-to-end validation of the incoming submission payload,
        evaluates each block's correctness using specialized strategy checkers, updates
        the user's attempt history, and dynamically recalculates the overall lesson
        progress (updating the status to either IN_PROGRESS or COMPLETED).

        Args:
            course_id (UUID): The unique identifier of the course.
            lesson_id (UUID): The unique identifier of the lesson being evaluated.
            user_id (UUID): The unique identifier of the user submitting the answers.
            submissions (list[BlockSubmissionRequestCreateSchema]): A list of schemas
                containing the user's answers mapped to specific block IDs.

        Returns:
            list[BlockSubmissionSchema]: A list of updated or newly created submission
                records containing the evaluation results for each block.

        Raises:
            DuplicateBlocksInSubmissionError: If the same `block_id` appears more than
                once in the `submissions` list.
            InvalidSubmissionBlocksError: If the set of submitted block IDs does not
                exactly match the set of block IDs associated with this lesson in the database.
            BlockNotFoundError: If a requested block cannot be retrieved from the
                repository during iteration.

        Note:
            - Implements a "persistent green checkmark" behavior (Stepik-style): if the
              lesson progress status is already `COMPLETED`, subsequent incorrect submissions
              will not revert the status back to `IN_PROGRESS` or overwrite the original
              `completed_at` timestamp.
            - All database interactions (creating/updating block submissions and lesson
              progress) are executed within a single atomic transaction and committed
              at the very end via `uow.commit()`.
        """

        # check user on course
        course = await self.uow.courses.get_course_by_lesson_where_user_is_member(
            user_id=user_id, course_id=course_id, lesson_id=lesson_id
        )
        if not course:
            raise CourseNotFoundError

        # check all blocks
        submitted_block_ids = [sub.block_id for sub in submissions]
        if len(submitted_block_ids) != len(set(submitted_block_ids)):
            raise DuplicateBlocksInSubmissionError


        existing_block_ids: set[UUID] = await self.uow.blocks.get_ids_by_lesson(
            lesson_id
        )

        # check true ids
        if set(submitted_block_ids) != existing_block_ids:
            raise InvalidSubmissionBlocksError

        blocks_map = {
            b.id: b for b in await self.uow.blocks.get_by_ids(submitted_block_ids)
        }
        existing_submissions_map = {
            s.block_id: s
            for s in await self.uow.submissions.get_filtered(
                lesson_id=lesson_id,
                user_id=user_id,
                limit=1000,
                offset=0,
            )  # TODO: add limit and offset optional
        }

        result: list[BlockSubmissionSchema] = []

        for sub_request in submissions:
            block = blocks_map.get(sub_request.block_id)
            if not block:
                raise BlockNotFoundError

            is_correct = await BlockChecker.check(block, sub_request)
            existing = existing_submissions_map.get(sub_request.block_id)

            if existing:
                already_correct = (
                    existing.submission_type == BlockSubmissionType.CORRECT
                )

                update_data = BlockSubmissionUpdateSchema(
                    attempts=existing.attempts + 1,
                    submission_type=(
                        BlockSubmissionType.CORRECT
                        if (already_correct or is_correct)
                        else BlockSubmissionType.WRONG
                    ),
                    submitted_payload=(
                        existing.submitted_payload
                        if already_correct
                        else sub_request.payload
                    ),
                )
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

        has_wrong = any(
            sub.submission_type == BlockSubmissionType.WRONG for sub in result
        )

        lesson_progress = await self.lesson_service.get_or_create_lesson_progress(
            user_id=user_id, lesson_id=lesson_id, only_get=True
        )

        already_completed = (
            lesson_progress and lesson_progress.status == LessonProgressType.COMPLETED
        )
        new_status = (
            LessonProgressType.COMPLETED
            if (already_completed or not has_wrong)
            else LessonProgressType.IN_PROGRESS
        )

        now = datetime.now(timezone.utc)

        if not lesson_progress:
            progress_data = LessonProgressCreateSchema(
                user_id=user_id,
                lesson_id=lesson_id,
                status=new_status,
                completed_at=(
                    now if new_status == LessonProgressType.COMPLETED else None
                ),
            )
            await self.uow.lessons_progress.create(progress_data)
        else:
            completed_at = lesson_progress.completed_at
            if new_status == LessonProgressType.COMPLETED and not completed_at:
                completed_at = now

            progress_update = LessonProgressUpdateSchema(
                status=new_status,
                completed_at=completed_at,
            )
            await self.uow.lessons_progress.update(lesson_progress.id, progress_update)

        await self.uow.commit()
        return result
