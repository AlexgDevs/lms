from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from src.core.config import settings
from src.core.errors.base_errors import RateLimitExceededError
from src.core.rate_limit import RateLimiter
from src.course.enums import CourseStatus
from src.course.exceptions import CourseMemberNotFoundError, CourseNotFoundError
from src.lesson.lesson_progress.schemas import (
    LessonProgressCreateSchema,
    LessonProgressUpdateSchema,
)
from src.block.exceptions import BlockNotFoundError
from src.lesson.enums import LessonProgressType
from src.lesson.exceptions import LessonNotFoundError
from src.lesson.service import LessonService
from src.submissions.exceptions import (
    DuplicateBlocksInSubmissionError,
    InvalidSubmissionBlocksError,
)
from src.block.enums import BlockSubmissionType, BlockType
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
        rate_limiter: RateLimiter,
    ):
        self.uow = block_submission_unit_of_work
        self.lesson_service = lesson_service
        self._rate_limiter = rate_limiter
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
        await self._validate_course_access(course_id, user_id)

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

            if block.block_type is BlockType.CODE:
                await self._enforce_code_exec_limit(user_id)

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

        await self._recompute_lesson_progress(lesson_id, user_id)

        await self.uow.commit()
        return result

    async def submit_block(
        self,
        course_id: UUID,
        lesson_id: UUID,
        block_id: UUID,
        user_id: UUID,
        submission: BlockSubmissionRequestCreateSchema,
    ) -> BlockSubmissionSchema:
        """Processes a single step (block) submission of the current lesson.

        Intended for the step-by-step learner flow (Stepik-style), where each block is
        presented and graded individually. Validates course access, grades the block via
        the registry of checkers, persists the attempt history, and re-computes the
        lesson progress from all of the user's block submissions in this lesson.
        """
        await self._validate_course_access(course_id, user_id)

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        block = await self.uow.blocks.get_one(id=block_id, lesson_id=lesson_id)
        if not block:
            raise BlockNotFoundError

        if submission.block_id != block_id:
            raise InvalidSubmissionBlocksError

        if block.block_type is BlockType.CODE:
            await self._enforce_code_exec_limit(user_id)

        is_correct = await BlockChecker.check(block, submission)

        existing = await self.uow.submissions.get_one(
            lesson_id=lesson_id, block_id=block_id, user_id=user_id
        )

        if existing:
            already_correct = existing.submission_type == BlockSubmissionType.CORRECT

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
                    else submission.payload
                ),
            )
            updated = await self.uow.submissions.update(existing.id, update_data)
            # A re-attempt on an already solved block must report the fresh
            # evaluation to the learner, while the persisted status stays green.
            result = updated.model_copy(
                update={
                    "submission_type": (
                        BlockSubmissionType.CORRECT
                        if is_correct
                        else BlockSubmissionType.WRONG
                    )
                }
            )

        else:
            submission_data = BlockSubmissionCreateSchema(
                lesson_id=lesson_id,
                block_id=block_id,
                user_id=user_id,
                submitted_payload=submission.payload,
                submission_type=(
                    BlockSubmissionType.CORRECT
                    if is_correct
                    else BlockSubmissionType.WRONG
                ),
                attempts=1,
                is_first_try_correct=is_correct,
            )
            result = await self.uow.submissions.create(submission_data)

        await self._recompute_lesson_progress(lesson_id, user_id)

        await self.uow.commit()
        return result

    async def get_lesson_submissions(
        self,
        course_id: UUID,
        lesson_id: UUID,
        user_id: UUID,
    ) -> list[BlockSubmissionSchema]:
        """Returns the current user's submissions for every block of a lesson."""
        await self._validate_course_access(course_id, user_id)

        lesson = await self.uow.lessons.get_one(id=lesson_id, course_id=course_id)
        if not lesson:
            raise LessonNotFoundError

        return list(
            await self.uow.submissions.get_filtered(
                lesson_id=lesson_id,
                user_id=user_id,
                limit=1000,
                offset=0,
            )
        )

    async def _validate_course_access(self, course_id: UUID, user_id: UUID) -> None:
        """Ensures the course exists, is accessible, and the user is an enrolled member."""
        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
        if not course:
            raise CourseNotFoundError

        if course.status != CourseStatus.PUBLISHED:
            if course.owner_id != user_id and not await self.uow.courses.is_member(
                course_id, user_id
            ):
                raise CourseNotFoundError

        member = await self.uow.members.get_one(
            user_id=user_id, course_id=course.id, left_at=None
        )
        if not member:
            raise CourseMemberNotFoundError

    async def _enforce_code_exec_limit(self, user_id: UUID) -> None:
        """Per-user cap on CODE submissions (cheap-DoS guard on Piston)."""
        key = f"rl:codeexec:{user_id}"
        hits = await self._rate_limiter.hit(key, window_seconds=60)
        limit = settings.codeexec.CODEEXEC_MAX_CALLS_PER_USER_PER_MINUTE
        if hits > limit:
            raise RateLimitExceededError

    async def _recompute_lesson_progress(self, lesson_id: UUID, user_id: UUID) -> None:
        """Recalculates the lesson progress from the user's block submissions.

        Lesson is COMPLETED when every block has an associated CORRECT submission.
        If some attempts exist but not all blocks are correct, the status is
        IN_PROGRESS. A previously completed lesson is never downgraded
        ("persistent green checkmark" behavior).
        """
        block_ids = await self.uow.blocks.get_ids_by_lesson(lesson_id)

        submissions = list(
            await self.uow.submissions.get_filtered(
                lesson_id=lesson_id,
                user_id=user_id,
                limit=1000,
                offset=0,
            )
        )
        correct_ids = {
            s.block_id
            for s in submissions
            if s.submission_type == BlockSubmissionType.CORRECT
        }

        if not submissions:
            return

        new_status = (
            LessonProgressType.COMPLETED
            if block_ids and block_ids.issubset(correct_ids)
            else LessonProgressType.IN_PROGRESS
        )

        progress = await self.uow.lessons_progress.get_one(
            user_id=user_id, lesson_id=lesson_id
        )
        if progress and progress.status == LessonProgressType.COMPLETED:
            return

        now = datetime.now(timezone.utc)

        if progress is None:
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
            completed_at = progress.completed_at
            if new_status == LessonProgressType.COMPLETED and not completed_at:
                completed_at = now

            progress_update = LessonProgressUpdateSchema(
                status=new_status,
                completed_at=completed_at,
            )
            await self.uow.lessons_progress.update(progress.id, progress_update)
