from uuid import UUID

from fastapi import APIRouter, Query, status

from src.review.dependencies import ReviewServiceDep
from src.review.enums import ReviewTargetType
from src.review.schemas import (
    ReviewCreateRequestSchema,
    ReviewRatingSchema,
    ReviewSchema,
)
from src.user.dependencies import OptionalUserIdDep, UserIdDep

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewSchema, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreateRequestSchema,
    user_id: UserIdDep,
    review_service: ReviewServiceDep,
) -> ReviewSchema:
    """Create a root review (rating + text) or a reply (parent_id + text)."""
    return await review_service.create_review(user_id=user_id, payload=payload)


@router.get(
    "/{target_type}/{target_id}",
    response_model=list[ReviewSchema],
)
async def list_reviews(
    target_type: ReviewTargetType,
    target_id: UUID,
    user_id: OptionalUserIdDep,
    review_service: ReviewServiceDep,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[ReviewSchema]:
    """Return root reviews of an entity with their nested replies."""
    return await review_service.list_reviews(
        target_type=target_type,
        target_id=target_id,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{target_type}/{target_id}/rating",
    response_model=ReviewRatingSchema,
)
async def get_rating(
    target_type: ReviewTargetType,
    target_id: UUID,
    user_id: OptionalUserIdDep,
    review_service: ReviewServiceDep,
) -> ReviewRatingSchema:
    """Return the aggregated average rating and star distribution."""
    return await review_service.get_rating(
        target_type=target_type,
        target_id=target_id,
        user_id=user_id,
    )
