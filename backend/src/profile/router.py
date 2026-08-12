from fastapi import APIRouter

from src.profile.dependencies import ProfileServiceDep
from src.profile.schemas import ProfileStatsSchema
from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/users/me", tags=["Profile"])


@router.get(
    "/stats",
    summary="Get current user profile stats",
    response_model=ProfileStatsSchema,
)
async def get_profile_stats(
    user_id: UserIdDep,
    service: ProfileServiceDep,
) -> ProfileStatsSchema:
    return await service.get_stats(user_id)
