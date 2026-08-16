from uuid import UUID

from fastapi import APIRouter, status

from src.ai.dependencies import AiServiceDep
from src.ai.schemas import (
    TgpGenerateResponseSchema,
    TgpQuestionSchema,
    TgpQuestionUpdateSchema,
    TgpSubmitRequestSchema,
    TgpSubmitResponseSchema,
)
from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/ai/tgp", tags=["AI TGP"])


@router.get(
    "/{course_id}/questions",
    response_model=list[TgpQuestionSchema],
)
async def list_tgp_questions(
    course_id: UUID,
    service: AiServiceDep,
    user_id: UserIdDep,
) -> list[TgpQuestionSchema]:
    return await service.get_questions(course_id=course_id, user_id=user_id)


@router.post(
    "/{course_id}/generate",
    response_model=TgpGenerateResponseSchema,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_tgp(
    course_id: UUID,
    service: AiServiceDep,
    owner_id: UserIdDep,
) -> TgpGenerateResponseSchema:
    return await service.generate(course_id=course_id, owner_id=owner_id)


@router.post(
    "/questions/{question_id}/regenerate",
    response_model=TgpGenerateResponseSchema,
    status_code=status.HTTP_202_ACCEPTED,
)
async def regenerate_tgp_question(
    question_id: UUID,
    service: AiServiceDep,
    owner_id: UserIdDep,
) -> TgpGenerateResponseSchema:
    return await service.regenerate_question(question_id=question_id, owner_id=owner_id)


@router.patch(
    "/questions/{question_id}",
    response_model=TgpQuestionSchema,
)
async def update_tgp_question(
    question_id: UUID,
    payload: TgpQuestionUpdateSchema,
    service: AiServiceDep,
    owner_id: UserIdDep,
) -> TgpQuestionSchema:
    return await service.update_question(
        question_id=question_id, owner_id=owner_id, data=payload
    )


@router.post("/{course_id}/submit", response_model=TgpSubmitResponseSchema)
async def submit_tgp(
    course_id: UUID,
    payload: TgpSubmitRequestSchema,
    service: AiServiceDep,
    user_id: UserIdDep,
) -> TgpSubmitResponseSchema:
    return await service.submit(course_id=course_id, user_id=user_id, payload=payload)
