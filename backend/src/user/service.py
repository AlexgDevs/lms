from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.security import hash_password, verify_password
from src.core.services import BaseService
from src.user.exceptions import UserAlreadyExistsError, UserNotFoundError
from src.user.schemas import (
    UserPasswordUpdateSchema,
    UserSchema,
    UserUpdateRequestSchema,
)
from src.user.repository import UserRepository


class UserService(BaseService):

    def __init__(self, session: AsyncSession, user_repository: UserRepository):
        super().__init__(session)
        self.user_repository = user_repository

    async def get_user(self, user_id: UUID) -> UserSchema:
        """
        Get current user
        :param user_id: - user id
        :return: - user
        """
        user = await self.user_repository.get_one(id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user

    async def update_user(
        self, user_id: UUID, payload: UserUpdateRequestSchema
    ) -> UserSchema:
        user = await self.user_repository.get_one(id=user_id)
        if not user:
            raise UserNotFoundError

        try:
            updated = await self.user_repository.update(
                user_id,
                payload,
                exclude_unset=True,
                exclude_none=False,
            )
            await self.session.commit()
            return updated
        except IntegrityError:
            raise UserAlreadyExistsError

    async def change_password(
        self, user_id: UUID, current_password: str, new_password: str
    ) -> None:
        user = await self.user_repository.get_one(id=user_id)
        if not user:
            raise UserNotFoundError
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

        await self.user_repository.update(
            user_id, UserPasswordUpdateSchema(password_hash=hash_password(new_password))
        )
        await self.session.commit()
