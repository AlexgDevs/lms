from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.services.base_service import BaseService
from src.review.enums import ReviewTargetType
from src.review.exceptions import (
    ReviewAlreadyExistsError,
    ReviewNotAllowedError,
    ReviewParentNotFoundError,
    ReviewReplyNotAllowedError,
    ReviewTargetNotFoundError,
)
from src.review.schemas import (
    ReviewCreateRequestSchema,
    ReviewCreateSchema,
    ReviewRatingSchema,
    ReviewSchema,
)
from src.review.unit_of_work import ReviewUnitOfWork
from src.user.models import User


class ReviewService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        review_unit_of_work: ReviewUnitOfWork,
    ) -> None:
        self.uow = review_unit_of_work
        super().__init__(session)

    async def create_review(
        self, user_id: UUID, payload: ReviewCreateRequestSchema
    ) -> ReviewSchema:
        """Create a root review (optionally with a rating) or a reply.

        A root review may omit the rating (e.g. a lesson comment); the rating
        is only required to contribute to an entity's average rating.
        Replies are attached via ``parent_id`` and never carry a rating.
        """
        await self._validate_target_exists(
            user_id=user_id,
            target_type=payload.target_type,
            target_id=payload.target_id,
        )

        if payload.parent_id is not None:
            if payload.rating is not None:
                raise ReviewReplyNotAllowedError
            return await self._create_reply(user_id, payload)

        return await self._create_root(user_id, payload)

    async def list_reviews(
        self,
        target_type: ReviewTargetType,
        target_id: UUID,
        user_id: UUID | None,
        limit: int,
        offset: int,
    ) -> list[ReviewSchema]:
        """Return root reviews of a target with their nested replies attached."""
        await self._validate_target_exists(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        )

        roots = list(
            await self.uow.reviews.get_roots_by_target(
                target_type=target_type.value,
                target_id=target_id,
                limit=limit,
                offset=offset,
            )
        )
        if not roots:
            return []

        replies = list(
            await self.uow.reviews.get_replies_by_parent_ids(
                [root.id for root in roots]
            )
        )
        replies_by_parent: dict[UUID, list[ReviewSchema]] = {}
        for reply in replies:
            if reply.parent_id is not None:
                replies_by_parent.setdefault(reply.parent_id, []).append(reply)

        author_ids = {review.user_id for review in [*roots, *replies]}
        usernames = await self._resolve_usernames(author_ids)

        enriched_root: list[ReviewSchema] = []
        for root in roots:
            root = self._with_username(root, usernames)
            nested = [
                self._with_username(reply, usernames)
                for reply in replies_by_parent.get(root.id, [])
            ]
            enriched_root.append(root.model_copy(update={"replies": nested}))

        return enriched_root

    async def get_rating(
        self,
        target_type: ReviewTargetType,
        target_id: UUID,
        user_id: UUID | None,
    ) -> ReviewRatingSchema:
        """Return the aggregated average rating and star distribution."""
        await self._validate_target_exists(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        )
        return await self.uow.reviews.get_rating_stats(
            target_type=target_type.value,
            target_id=target_id,
        )

    async def _create_root(
        self, user_id: UUID, payload: ReviewCreateRequestSchema
    ) -> ReviewSchema:
        create_data = ReviewCreateSchema(
            user_id=user_id,
            target_type=payload.target_type,
            target_id=payload.target_id,
            rating=payload.rating,
            text=payload.text,
        )
        try:
            review = await self.uow.reviews.create(create_data)
            await self.uow.commit()
        except IntegrityError:
            await self.uow.rollback()
            raise ReviewAlreadyExistsError
        return review

    async def _create_reply(
        self, user_id: UUID, payload: ReviewCreateRequestSchema
    ) -> ReviewSchema:
        parent = await self.uow.reviews.get_one(id=payload.parent_id)
        if not parent:
            raise ReviewParentNotFoundError

        if parent.parent_id is not None:
            raise ReviewReplyNotAllowedError

        if (
            parent.target_type != payload.target_type.value
            or parent.target_id != payload.target_id
        ):
            raise ReviewReplyNotAllowedError

        create_data = ReviewCreateSchema(
            user_id=user_id,
            target_type=payload.target_type,
            target_id=payload.target_id,
            text=payload.text,
            parent_id=parent.id,
        )
        review = await self.uow.reviews.create(create_data)
        await self.uow.commit()
        return review

    async def _validate_target_exists(
        self,
        user_id: UUID | None,
        target_type: ReviewTargetType,
        target_id: UUID,
    ) -> None:
        if target_type == ReviewTargetType.COURSE:
            course = await self.uow.courses.get_one(id=target_id, is_deleted=None)
            if not course:
                raise ReviewTargetNotFoundError
        elif target_type == ReviewTargetType.USER:
            user = await self.uow.users.get_one(id=target_id)
            if not user:
                raise ReviewTargetNotFoundError
        elif target_type == ReviewTargetType.LESSON:
            lesson = await self.uow.lessons.get_one(id=target_id)
            if not lesson:
                raise ReviewTargetNotFoundError
            if user_id is None:
                raise ReviewNotAllowedError
            member = await self.uow.members.get_one(
                user_id=user_id, course_id=lesson.course_id, left_at=None
            )
            if not member:
                raise ReviewNotAllowedError
        else:
            raise ReviewTargetNotFoundError

    async def _resolve_usernames(self, user_ids: set[UUID]) -> dict[UUID, str]:
        if not user_ids:
            return {}
        result = await self.session.execute(
            select(User.id, User.username).where(User.id.in_(list(user_ids)))
        )
        return {user_id: username for user_id, username in result.all()}

    @staticmethod
    def _with_username(
        review: ReviewSchema, usernames: dict[UUID, str]
    ) -> ReviewSchema:
        return review.model_copy(
            update={"user_username": usernames.get(review.user_id, "")}
        )
