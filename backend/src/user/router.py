from uuid import UUID

from fastapi import APIRouter

from src.user.dependencies import CurrentUserDep, UserIdDep, UserServiceDep
from src.user.schemas import UserSchema

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    summary="Get current user",
    response_model=UserSchema,
)
async def get_current_user(user: CurrentUserDep) -> UserSchema:
    return UserSchema.model_validate(user)


@router.get(
    "/{user_id}",
    summary="Get user by id",
    response_model=UserSchema,
)
async def get_user_by_id(
    _: UserIdDep,
    user_id: UUID,
    service: UserServiceDep,
) -> UserSchema:
    user = await service.get_user(user_id)
    return UserSchema.model_validate(user)
