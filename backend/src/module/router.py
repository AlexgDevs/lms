from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, status

from src.module.dependencies import ModuleServiceDep
from src.module.schemas import (
    ModuleCreateRequestSchema,
    ModuleUpdateRequestSchema,
    ModuleSchema,
)

from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/courses/{course_id}/modules", tags=["Modules"])


@router.post(
    "",
    response_model=ModuleSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_module(
    course_id: UUID,
    payload: ModuleCreateRequestSchema,
    service: ModuleServiceDep,
    user_id: UserIdDep,
) -> ModuleSchema:
    return await service.create_module(
        course_id=course_id, user_id=user_id, payload=payload
    )


@router.patch(
    "/{module_id}",
    response_model=ModuleSchema,
)
async def update_module(
    course_id: UUID,
    module_id: UUID,
    payload: ModuleUpdateRequestSchema,
    service: ModuleServiceDep,
    user_id: UserIdDep,
) -> ModuleSchema:
    return await service.update_module(
        module_id=module_id,
        course_id=course_id,
        owner_id=user_id,
        payload=payload,
    )


@router.delete(
    "/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_module(
    course_id: UUID,
    module_id: UUID,
    service: ModuleServiceDep,
    user_id: UserIdDep,
) -> None:
    await service.delete_module(
        module_id=module_id,
        course_id=course_id,
        user_id=user_id,
    )
