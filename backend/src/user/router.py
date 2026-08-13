from uuid import UUID

from fastapi import APIRouter

from src.user.dependencies import CurrentUserDep, UserIdDep, UserServiceDep
from src.user.schemas import UserPublicSchema, UserUpdateRequestSchema

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    summary="Get current user",
    response_model=UserPublicSchema,
)
async def get_current_user(user: CurrentUserDep) -> UserPublicSchema:
    return UserPublicSchema.model_validate(user)


@router.patch(
    "/me",
    summary="Update current user",
    response_model=UserPublicSchema,
)
async def update_current_user(
    user: CurrentUserDep,
    payload: UserUpdateRequestSchema,
    service: UserServiceDep,
) -> UserPublicSchema:
    updated = await service.update_user(user.id, payload)
    return UserPublicSchema.model_validate(updated)


@router.get(
    "/{user_id}",
    summary="Get user by id",
    response_model=UserPublicSchema,
)
async def get_user_by_id(
    _: UserIdDep,
    user_id: UUID,
    service: UserServiceDep,
) -> UserPublicSchema:
    user = await service.get_user(user_id)
    return UserPublicSchema.model_validate(user)
