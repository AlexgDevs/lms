from typing import Any, Sequence
from uuid import UUID

from sqlalchemy import ColumnElement, func, select

from src.core.repositories.base_repository import BaseRepository
from src.review.mapper import ReviewMapper
from src.review.models import Review
from src.review.schemas import ReviewRatingSchema, ReviewSchema


class ReviewRepository(BaseRepository[Review, ReviewSchema]):
    model = Review
    schema = ReviewSchema
    mapper = ReviewMapper

    async def get_roots_by_target(
        self,
        target_type: str,
        target_id: UUID,
        limit: int,
        offset: int,
        order_by: ColumnElement[Any] | None = None,
    ) -> Sequence[ReviewSchema]:
        query = (
            select(self.model)
            .where(
                self.model.target_type == target_type,
                self.model.target_id == target_id,
                self.model.parent_id.is_(None),
                self.model.is_deleted.is_(None),
            )
            .order_by(
                order_by if order_by is not None else self.model.created_at.desc()
            )
            .limit(limit)
            .offset(offset)
        )
        return await self._execute_and_map_all(query)

    async def get_replies_by_parent_ids(
        self, parent_ids: list[UUID]
    ) -> Sequence[ReviewSchema]:
        if not parent_ids:
            return []
        query = (
            select(self.model)
            .where(
                self.model.parent_id.in_(parent_ids),
                self.model.is_deleted.is_(None),
            )
            .order_by(self.model.created_at.asc())
        )
        return await self._execute_and_map_all(query)

    async def get_rating_stats(
        self, target_type: str, target_id: UUID
    ) -> ReviewRatingSchema:
        stmt = select(
            func.avg(self.model.rating).label("average"),
            func.count(self.model.id).label("count"),
        ).where(
            self.model.target_type == target_type,
            self.model.target_id == target_id,
            self.model.parent_id.is_(None),
            self.model.is_deleted.is_(None),
            self.model.rating.is_not(None),
        )
        result = (await self.session.execute(stmt)).one()
        average, count_value = result
        average = float(average or 0) if average is not None else 0.0
        count = int(count_value or 0)

        dist_stmt = (
            select(self.model.rating, func.count(self.model.id))
            .where(
                self.model.target_type == target_type,
                self.model.target_id == target_id,
                self.model.parent_id.is_(None),
                self.model.is_deleted.is_(None),
                self.model.rating.is_not(None),
            )
            .group_by(self.model.rating)
            .order_by(self.model.rating)
        )
        dist_result = await self.session.execute(dist_stmt)
        distribution = {str(int(rating)): int(cnt) for rating, cnt in dist_result.all()}

        return ReviewRatingSchema(
            average=round(average, 2),
            count=count,
            distribution=distribution,
        )
