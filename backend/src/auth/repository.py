from uuid import UUID

from sqlalchemy import update

from src.auth.schemas import RefreshTokenSchema
from src.core.repositories import BaseRepository
from src.auth.models import RefreshToken
from src.auth.mapper import AuthMapper


class RefreshTokenRepository(BaseRepository[RefreshToken, RefreshTokenSchema]):
    model = RefreshToken
    mapper = AuthMapper

    async def revoke(self, token_id: UUID) -> None:
        statement = (
            update(RefreshToken)
            .filter_by(id=token_id)
            .values(
                {
                    "is_revoked": True,
                }
            )
        )
        await self.session.execute(statement)

    async def revoke_all(self, user_id: UUID) -> None:
        statement = (
            update(RefreshToken)
            .filter_by(user_id=user_id, is_revoked=False)
            .values(
                {
                    "is_revoked": True,
                }
            )
        )
        await self.session.execute(statement)
