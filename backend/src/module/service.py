from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.exceptions import InvalidAccessTokenError
from src.course.access import ensure_course_is_draft, ensure_module_removable
from src.course.enums import CourseStatus
from src.course.exceptions import CourseNotFoundError
from src.course.models import CourseMember
from src.core.events.event import ModuleDeleted
from src.core.services import BaseService
from src.module.unit_of_work import ModuleUnitOfWork
from src.module.exceptions import ModuleNotFoundError
from src.module.schemas import (
    ModuleCreateRequestSchema,
    ModuleCreateSchema,
    ModuleSchema,
    ModuleUpdateRequestSchema,
    ModuleUpdateSchema,
    ModuleReorderSchema,
)

if TYPE_CHECKING:
    from src.core.events.protocol import Event


class ModuleService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        module_unit_of_work: ModuleUnitOfWork,
        event_bus: "Event | None" = None,
    ):
        self.uow = module_unit_of_work
        super().__init__(session, event_bus)

    async def create_module(
        self, course_id: UUID, user_id: UUID, payload: ModuleCreateRequestSchema
    ) -> ModuleSchema:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError
        ensure_course_is_draft(course)

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
        ensure_course_is_draft(course)

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
        ensure_course_is_draft(course)

        module = await self.uow.modules.get_one(id=module_id, course_id=course_id)
        if not module:
            raise ModuleNotFoundError

        await ensure_module_removable(self.session, module.id)

        result = await self.session.execute(
            select(CourseMember.user_id).where(
                CourseMember.course_id == course_id,
                CourseMember.left_at.is_(None),
            )
        )
        member_ids = [row[0] for row in result.all()]

        await self.uow.modules.delete(id_=module_id)
        await self.uow.commit()

        if self.event_bus is not None:
            await self.event_bus.publish(
                ModuleDeleted(
                    course_id=course_id,
                    module_title=module.title,
                    member_ids=member_ids,
                )
            )

    async def get_all_by_owner_course(
        self, course_id: UUID, user_id: UUID | None, limit: int = 100, offset: int = 0
    ) -> list[ModuleSchema]:
        if user_id is None:
            raise InvalidAccessTokenError

        course = await self.uow.courses.get_one(
            id=course_id,
            owner_id=user_id,
            is_deleted=None,
        )
        if not course:
            raise CourseNotFoundError

        return list(
            await self.uow.modules.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.modules.model.order.asc(),
                course_id=course.id,
            )
        )

    async def get_all_by_course(
        self,
        course_id: UUID,
        user_id: UUID | None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ModuleSchema]:
        course = await self.uow.courses.get_one(
            id=course_id,
            is_deleted=None,
        )
        if not course:
            raise CourseNotFoundError

        if course.status != CourseStatus.PUBLISHED:
            if user_id is None or (
                course.owner_id != user_id
                and not await self.uow.courses.is_member(course_id, user_id)
            ):
                raise CourseNotFoundError

        return list(
            await self.uow.modules.get_filtered(
                limit=limit,
                offset=offset,
                order_by=self.uow.modules.model.order.asc(),
                course_id=course.id,
            )
        )

    async def reorder(
        self,
        course_id: UUID,
        user_id: UUID,
        payload: ModuleReorderSchema,
    ) -> list[ModuleSchema]:
        course = await self.uow.courses.get_one(
            id=course_id, owner_id=user_id, is_deleted=None
        )
        if not course:
            raise CourseNotFoundError

        await self.uow.modules.set_order_bulk(
            course_id=course_id, ordered_ids=payload.ordered_ids
        )
        await self.uow.commit()

        return list(
            await self.uow.modules.get_filtered(
                limit=1000,
                offset=0,
                order_by=self.uow.modules.model.order.asc(),
                course_id=course.id,
            )
        )
