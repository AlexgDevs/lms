from datetime import datetime, timezone
from typing import Literal, Sequence
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.course.course_member.schemas import (
    CourseMemberCreateSchema,
    CourseMemberSchema,
)
from src.auth.exceptions import InvalidAccessTokenError
from src.core.services.base_service import BaseService
from src.course.enums import CourseStatus
from src.course.exceptions import (
    CourseMemberAlredyEnrolledError,
    CourseNotFoundError,
    CourseNotPublishedError,
    CourseOwnerCannotEnrollError,
)
from src.course.schemas import (
    CourseCreateRequestSchema,
    CourseCreateSchema,
    CourseSchema,
    CourseUpdateRequestSchema,
    CourseUpdateSchema,
    CourseUserBriefSchema,
)
from src.course.unit_of_work import CourseUnitOfWork
from src.media.service import MediaService

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
