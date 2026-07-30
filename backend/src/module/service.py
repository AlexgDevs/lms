from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from src.course.exceptions import CourseNotFoundError
from src.core.services import BaseService
from src.module.unit_of_work import ModuleUnitOfWork
from src.module.exceptions import ModuleNotFoundError
from src.module.schemas import (
    ModuleCreateRequestSchema,
    ModuleCreateSchema,
    ModuleSchema,
    ModuleUpdateRequestSchema,
    ModuleUpdateSchema,
)


class ModuleService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        module_unit_of_work: ModuleUnitOfWork,
    ):
        self.uow = module_unit_of_work
        super().__init__(session)

    async def create_module(
        self, course_id: UUID, user_id: UUID, payload: ModuleCreateRequestSchema
    ) -> ModuleSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        next_order = await self.uow.modules.get_count(course.id)

        create_data = ModuleCreateSchema(
            **payload.model_dump(),
            course_id=course.id,
            order=next_order,
        )
        module = await self.uow.modules.create(create_data)
        await self.uow.commit()
        return module

    async def update_module(
        self,
        module_id: UUID,
        course_id: UUID,
        owner_id: UUID,
        payload: ModuleUpdateRequestSchema,
    ) -> ModuleSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=owner_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        update_data = ModuleUpdateSchema(
            **payload.model_dump(exclude_unset=True),
        )

        updated_module = await self.uow.modules.update(module_id, update_data)
        await self.uow.commit()
        return updated_module

    async def delete_module(
        self,
        module_id: UUID,
        course_id: UUID,
        user_id: UUID,
    ) -> None:
        course = await self.uow.courses.get_one(
            id=course_id,
            owner_id=user_id,
            is_deleted=None,
        )
        if not course:
            raise CourseNotFoundError

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        await self.uow.modules.delete(id_=module_id)
        await self.uow.commit()

    async def get_all_by_owner_course(
        self, course_id: UUID, user_id: UUID, limit: int = 100, offset: int = 0
    ) -> list[ModuleSchema]:
        course = await self.uow.courses.get_one(
            id=course_id,
            owner_id=user_id,
            is_deleted=None,
        )
        if not course:
            raise CourseNotFoundError

        return list(
            await self.uow.modules.get_filtered(
                limit=limit, offset=offset, course_id=course.id
            )
        )

    async def get_all_by_course(
        self, course_id: UUID, user_id: UUID, limit: int = 100, offset: int = 0
    ) -> list[ModuleSchema]:
        course = await self.uow.courses.get_one(
            id=course_id,
            owner_id=user_id,
            is_deleted=None,
        )
        if not course:
            raise CourseNotFoundError

        member = await self.uow.courses.get_course_where_user_is_member(
            course_id=course_id, user_id=user_id
        )

        if not member:
            raise CourseNotFoundError

        return list(
            await self.uow.modules.get_filtered(
                limit=limit, offset=offset, course_id=course.id
            )
        )
