from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.repository import AuthRepository
from src.user.repository import UserRepository
from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork


class AuthUnitOfWork(BaseUnitOfWork):
    users: UserRepository
    auth: AuthRepository

    def __init__(
        self,
        session: AsyncSession,
        user_repository: UserRepository,
        auth_repository: AuthRepository,
    ) -> None:
        super().__init__(session)

        self.users = user_repository
        self.auth = auth_repository

    async def _uow_marker(self) -> None: ...  # type: ignore
