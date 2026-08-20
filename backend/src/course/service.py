from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Literal, Sequence
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.course.course_member.schemas import (
    CourseMemberCreateSchema,
    CourseMemberSchema,
)
from src.auth.exceptions import InvalidAccessTokenError
from src.core.config import settings
from src.core.services.base_service import BaseService
from src.course.enums import CourseStatus
from src.course.exceptions import (
    CourseAlreadyPublishedError,
    CourseIncompleteError,
    CourseMemberAlredyEnrolledError,
    CourseNotFoundError,
    CourseNotPublishedError,
    CourseNotUnderReviewError,
    CourseOwnerCannotEnrollError,
    CourseStatusNotAllowedError,
)
from src.course.schemas import (
    CourseCreateRequestSchema,
    CourseCreateSchema,
    CourseModerationQueueSchema,
    CourseModerationRejectSchema,
    CourseSchema,
    CourseUpdateRequestSchema,
    CourseUpdateSchema,
    CourseUserBriefSchema,
)
from src.course.unit_of_work import CourseUnitOfWork
from src.media.service import MediaService

if TYPE_CHECKING:
    from src.block.models import Block
    from src.lesson.models import Lesson
    from src.module.models import Module
    from src.user.models import User

COVER_ROLE = "cover"


class CourseService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        course_unit_of_work: CourseUnitOfWork,  # TODO: add payment service in uow
        media_service: MediaService,
    ):
        self.uow = course_unit_of_work
        self.media_service = media_service
        super().__init__(session)

    async def create_course(
        self,
        owner_id: UUID,
        payload: CourseCreateRequestSchema,
    ) -> CourseSchema:
        create_data = CourseCreateSchema(
            **payload.model_dump(exclude_unset=True),
            owner_id=owner_id,
        )

        course = await self.uow.courses.create(create_data)
        await self.uow.commit()
        return course

    async def update_course(
        self,
        course_id: UUID,
        owner_id: UUID,
        payload: CourseUpdateRequestSchema,
    ) -> CourseSchema:
        update_data_dict = payload.model_dump(exclude_unset=True)
        update_data = CourseUpdateSchema(
            **update_data_dict,
        )

        if payload.status is not None and payload.status != CourseStatus.DRAFT:
            raise CourseStatusNotAllowedError

        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        course = await self.uow.courses.update(
            course_id, update_data, exclude_none=False
        )
        await self.uow.commit()
        return course

    async def delete_course(self, course_id: UUID, owner_id: UUID) -> None:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        delete_data = CourseUpdateSchema(
            **course.model_dump(), is_deleted=datetime.now(timezone.utc)
        )

        await self.uow.courses.update(course_id, delete_data)
        await self.uow.commit()

    async def get_courses_where_user_member(
        self, user_id: UUID
    ) -> list[CourseUserBriefSchema]:
        return await self.uow.courses.get_courses_where_user_is_member(user_id)

    async def _count(self, model: Any, course_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(model).where(model.course_id == course_id)
        )
        return int(result.scalar_one())

    async def submit_for_review(self, course_id: UUID, owner_id: UUID) -> CourseSchema:
        from src.block.models import Block
        from src.lesson.models import Lesson
        from src.module.models import Module

        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError
        if course.status == CourseStatus.PUBLISHED:
            raise CourseAlreadyPublishedError
        if not (course.description or "").strip():
            raise CourseIncompleteError(detail="Course description is required")

        module_count = await self._count(Module, course_id)
        lesson_count = await self._count(Lesson, course_id)
        block_count = await self._count(Block, course_id)
        missing: list[str] = []
        if module_count < settings.course_review.COURSE_REVIEW_MIN_MODULES:
            missing.append("at least 1 module")
        if lesson_count < settings.course_review.COURSE_REVIEW_MIN_LESSONS:
            missing.append("at least 1 lesson")
        if block_count < settings.course_review.COURSE_REVIEW_MIN_BLOCKS:
            missing.append("at least 3 content blocks")
        if missing:
            raise CourseIncompleteError(
                detail=f"Course is missing: {', '.join(missing)}"
            )

        course = await self.uow.courses.update(
            course_id,
            CourseUpdateSchema(
                status=CourseStatus.UNDER_REVIEW,
                moderation_reason=None,
            ),
            exclude_none=False,
        )
        await self.uow.commit()

        from src.ai.course_review.tasks import review_course_task

        review_course_task.delay(str(course_id))
        return course

    async def approve_course(self, course_id: UUID) -> CourseSchema:
        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
        if not course:
            raise CourseNotFoundError
        if course.status != CourseStatus.UNDER_REVIEW:
            raise CourseNotUnderReviewError
        course = await self.uow.courses.update(
            course_id,
            CourseUpdateSchema(
                status=CourseStatus.PUBLISHED,
                moderation_reason=None,
            ),
            exclude_none=False,
        )
        await self.uow.commit()
        return course

    async def reject_course(
        self, course_id: UUID, payload: CourseModerationRejectSchema
    ) -> CourseSchema:
        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
        if not course:
            raise CourseNotFoundError
        if course.status != CourseStatus.UNDER_REVIEW:
            raise CourseNotUnderReviewError
        course = await self.uow.courses.update(
            course_id,
            CourseUpdateSchema(
                status=CourseStatus.REJECTED,
                moderation_reason=payload.reason,
            ),
            exclude_none=False,
        )
        await self.uow.commit()
        return course

    async def get_moderation_queue(
        self, limit: int, offset: int
    ) -> list[CourseModerationQueueSchema]:
        from src.block.models import Block
        from src.lesson.models import Lesson
        from src.module.models import Module
        from src.user.models import User

        courses = list(
            await self.uow.courses.get_filtered(
                status=CourseStatus.UNDER_REVIEW,
                is_deleted=None,
                limit=limit,
                offset=offset,
            )
        )
        if not courses:
            return []

        course_ids = [course.id for course in courses]
        owner_ids = {course.owner_id for course in courses}

        users = (
            (await self.session.execute(select(User).where(User.id.in_(owner_ids))))
            .scalars()
            .all()
        )
        usernames = {user.id: user.username for user in users}

        module_rows = (
            await self.session.execute(
                select(Module.course_id, func.count())
                .where(Module.course_id.in_(course_ids))
                .group_by(Module.course_id)
            )
        ).all()
        lesson_rows = (
            await self.session.execute(
                select(Lesson.course_id, func.count())
                .where(Lesson.course_id.in_(course_ids))
                .group_by(Lesson.course_id)
            )
        ).all()
        block_rows = (
            await self.session.execute(
                select(Block.course_id, func.count())
                .where(Block.course_id.in_(course_ids))
                .group_by(Block.course_id)
            )
        ).all()

        module_counts = {row[0]: int(row[1]) for row in module_rows}
        lesson_counts = {row[0]: int(row[1]) for row in lesson_rows}
        block_counts = {row[0]: int(row[1]) for row in block_rows}

        return [
            CourseModerationQueueSchema(
                id=course.id,
                title=course.title,
                description=course.description,
                cover_url=course.cover_url,
                owner_id=course.owner_id,
                owner_username=usernames.get(course.owner_id, ""),
                status=course.status,
                moderation_reason=course.moderation_reason,
                created_at=course.created_at,
                module_count=module_counts.get(course.id, 0),
                lesson_count=lesson_counts.get(course.id, 0),
                block_count=block_counts.get(course.id, 0),
            )
            for course in courses
        ]

    async def list_courses(
        self,
        filter: Literal["all", "created", "my"],
        user_id: UUID | None,
        limit: int = 10,
        offset: int = 0,
        category: str | None = None,
        q: str | None = None,
    ) -> Sequence[CourseSchema] | list[CourseUserBriefSchema]:
        search_term = q.strip()[:100] if q and q.strip() else None
        match filter:
            case "created":
                if user_id is None:
                    raise InvalidAccessTokenError
                return list(
                    await self.uow.courses.get_filtered(
                        owner_id=user_id,
                        is_deleted=None,
                        limit=limit,
                        offset=offset,
                    )
                )
            case "my":
                if user_id is None:
                    raise InvalidAccessTokenError
                return await self.get_courses_where_user_member(user_id)
            case "all" | _:
                category_ids = await self._resolve_category_ids(category)
                if category is not None and not category_ids:
                    return []
                courses = list(
                    await self.uow.courses.get_filtered(
                        limit=limit,
                        offset=offset,
                        category_ids=category_ids,
                        search_term=search_term,
                        status=CourseStatus.PUBLISHED,
                        is_deleted=None,
                    )
                )
                if user_id is not None:
                    member_ids = await self.uow.courses.get_member_course_ids(user_id)
                    return [
                        course.model_copy(update={"is_member": course.id in member_ids})
                        for course in courses
                    ]
                return courses

    async def _resolve_category_ids(
        self, category: str | None
    ) -> Sequence[UUID] | None:
        if category is None:
            return None
        found = await self.uow.categories.get_one(slug=category)
        if not found:
            return []
        children = await self.uow.categories.get_by_parent_id(found.id)
        return [found.id, *[child.id for child in children]]

    async def get_course(
        self,
        filter: Literal["current", "author", "my"],
        course_id: UUID,
        user_id: UUID | None,
    ) -> CourseSchema | CourseUserBriefSchema:
        match filter:
            case "author":
                if user_id is None:
                    raise InvalidAccessTokenError
                return await self.get_author_course_by_id(course_id, user_id)
            case "my":
                if user_id is None:
                    raise InvalidAccessTokenError
                return await self.get_course_where_user_member(course_id, user_id)
            case "current" | _:
                course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
                if not course or course.status != CourseStatus.PUBLISHED:
                    raise CourseNotFoundError
                if user_id is not None:
                    member_ids = await self.uow.courses.get_member_course_ids(user_id)
                    course = course.model_copy(
                        update={"is_member": course.id in member_ids}
                    )
                return course

    async def enroll(self, course_id: UUID, user_id: UUID) -> CourseMemberSchema:
        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)

        if not course:
            raise CourseNotFoundError

        if course.status != CourseStatus.PUBLISHED:
            raise CourseNotPublishedError

        if course.owner_id == user_id:
            raise CourseOwnerCannotEnrollError

        member = await self.uow.members.get_one(
            user_id=user_id, course_id=course_id, left_at=None
        )
        if member:
            raise CourseMemberAlredyEnrolledError

        # TODO: creating payment and other services

        data = CourseMemberCreateSchema(course_id=course_id, user_id=user_id)
        new_member = await self.uow.members.create(data=data)
        await self.uow.courses.increment_member_count(course_id)

        await self.uow.commit()
        return new_member

    async def get_course_where_user_member(
        self, course_id: UUID, user_id: UUID
    ) -> CourseUserBriefSchema:
        course = await self.uow.courses.get_course_where_user_is_member(
            course_id,
            user_id,
        )
        if not course:
            raise CourseNotFoundError

        return course

    async def get_author_course_by_id(
        self, course_id: UUID, user_id: UUID
    ) -> CourseSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        return course

    async def upload_cover(
        self,
        course_id: UUID,
        owner_id: UUID,
        *,
        data: bytes,
        original_name: str,
        content_type: str,
        is_public: bool = True,
    ) -> CourseSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        old_cover_ids = await self._get_cover_media_ids(course_id)

        media = await self.media_service.create_media(
            user_id=owner_id,
            data=data,
            original_name=original_name,
            content_type=content_type,
            is_public=is_public,
            commit=False,
        )

        try:
            await self.uow.media_attachments.detach_all(
                owner_type="course", owner_id=course_id
            )
            await self.uow.media_attachments.attach(
                media_id=media.id,
                owner_type="course",
                owner_id=course_id,
                role=COVER_ROLE,
                position=0,
            )
            updated = await self.uow.courses.update(
                course_id,
                CourseUpdateSchema(
                    cover_url=self.media_service.storage.get_public_url(
                        media.storage_key
                    )
                ),
            )
            await self.uow.commit()
        except BaseException:
            await self.media_service.delete_media_file(media.storage_key)
            raise

        await self._purge_old_covers(old_cover_ids)
        return updated

    async def remove_cover(self, course_id: UUID, owner_id: UUID) -> CourseSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        old_cover_ids = await self._get_cover_media_ids(course_id)

        await self.uow.media_attachments.detach_all(
            owner_type="course", owner_id=course_id
        )
        updated = await self.uow.courses.update(
            course_id, CourseUpdateSchema(cover_url=None), exclude_none=False
        )
        await self.uow.commit()

        await self._purge_old_covers(old_cover_ids)
        return updated

    async def _get_cover_media_ids(self, course_id: UUID) -> list[UUID]:
        attachments = await self.uow.media_attachments.get_for_owner(
            "course", course_id
        )
        return [attachment.media_id for attachment in attachments]

    async def _purge_old_covers(self, media_ids: list[UUID]) -> None:
        if not media_ids:
            return
        await self.media_service.cleanup_unreferenced(media_ids)
        await self.uow.commit()
