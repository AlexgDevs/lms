from uuid import UUID

from fastapi import APIRouter

from src.core.config import settings
from src.user.dependencies import (
    AuthenticatedCurrentUserDep,
    AuthenticatedUserIdDep,
    CurrentUserDep,
    UserServiceDep,
)
from src.user.schemas import (
    AiGenerationQuotaSchema,
    UserMeSchema,
    UserPublicSchema,
    UserUpdateRequestSchema,
)
from src.auth.schemas import ChangePasswordRequestSchema

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    summary="Get current user",
    response_model=UserMeSchema,
)
async def get_current_user(user: AuthenticatedCurrentUserDep) -> UserMeSchema:
    return UserMeSchema.model_validate(user)


@router.get(
    "/me/ai-generations",
    summary="Get AI course generation quota",
    response_model=AiGenerationQuotaSchema,
)
async def get_ai_generation_quota(user: CurrentUserDep) -> AiGenerationQuotaSchema:
    limit = settings.course_generate.COURSE_GENERATE_FREE_LIMIT
    return AiGenerationQuotaSchema(
        used=user.ai_course_generations,
        limit=limit,
        remaining=max(0, limit - user.ai_course_generations),
    )


@router.patch(
    "/me",
    summary="Update current user",
    response_model=UserMeSchema,
)
async def update_current_user(
    user: AuthenticatedCurrentUserDep,
    payload: UserUpdateRequestSchema,
    service: UserServiceDep,
) -> UserMeSchema:
    updated = await service.update_user(user.id, payload)
    return UserMeSchema.model_validate(updated)


@router.get(
    "/{user_id}",
    summary="Get user by id",
    response_model=UserPublicSchema,
)
async def get_user_by_id(
    _: AuthenticatedUserIdDep,
    user_id: UUID,
    service: UserServiceDep,
) -> UserPublicSchema:
    user = await service.get_user(user_id)
    return UserPublicSchema.model_validate(user)


@router.post(
    "/me/password",
    summary="Change password",
)
async def change_password(
    user: AuthenticatedCurrentUserDep,
    payload: ChangePasswordRequestSchema,
    service: UserServiceDep,
) -> dict[str, str]:
    await service.change_password(
        user.id, payload.current_password, payload.new_password
    )
    return {"message": "Password has been changed successfully."}
