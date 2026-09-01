from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep
from src.profile.repository import ProfileRepository
from src.profile.service import ProfileService


def get_profile_repository(session: SessionDep) -> ProfileRepository:
    return ProfileRepository(session)


ProfileRepositoryDep = Annotated[ProfileRepository, Depends(get_profile_repository)]


def get_profile_service(
    session: SessionDep,
    profile_repository: ProfileRepositoryDep,
) -> ProfileService:
    return ProfileService(session=session, profile_repository=profile_repository)


ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
