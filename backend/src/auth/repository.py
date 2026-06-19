from uuid import UUID

from sqlalchemy import update

from src.core.repositories import BaseRepository
from src.auth.models import RefreshToken
from src.auth.schemas import RefreshTokenSchema
from src.auth.mapper import AuthMapper


class AuthRepository(BaseRepository[RefreshToken, RefreshTokenSchema]):
    model = RefreshToken
    schema = RefreshTokenSchema
    mapper = AuthMapper

    async def revoke_token(self, token_id: UUID) -> None:
        """Method to revoke a refresh token"""
        statement = update(self.model).filter_by(id=token_id).values(is_revoked=True)
        await self.session.execute(statement)

    async def revoke_all_tokens(self, user_id: UUID) -> None:
        """Method to revoke all refresh tokens"""
        statement = (
            update(self.model).filter_by(user_id=user_id).values(is_revoked=True)
        )
        await self.session.execute(statement)
