import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger

from src.ai.assistant.dependencies import AssistantServiceDep
from src.ai.assistant.schemas import (
    AssistantAskRequestSchema,
    AssistantHintRequestSchema,
    AssistantHintResponseSchema,
    AssistantLevelResponseSchema,
    AssistantRegenerateRequestSchema,
)
from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/ai/assistant", tags=["AI Assistant"])


@router.post("/hint", response_model=AssistantHintResponseSchema)
async def assistant_hint(
    payload: AssistantHintRequestSchema,
    service: AssistantServiceDep,
    user_id: UserIdDep,
) -> AssistantHintResponseSchema:
    return await service.get_hint(payload=payload, user_id=user_id)


@router.post("/regenerate", response_model=AssistantLevelResponseSchema)
async def assistant_regenerate(
    payload: AssistantRegenerateRequestSchema,
    service: AssistantServiceDep,
    user_id: UserIdDep,
) -> AssistantLevelResponseSchema:
    return await service.regenerate_level(payload=payload, user_id=user_id)


@router.post("/ask")
async def assistant_ask(
    payload: AssistantAskRequestSchema,
    service: AssistantServiceDep,
    user_id: UserIdDep,
) -> StreamingResponse:
    context = await service.build_ask_context(payload=payload, user_id=user_id)

    async def event_source() -> AsyncIterator[str]:
        try:
            async for chunk in service.stream_answer(context):
                yield f"data: {json.dumps({'delta': chunk}, ensure_ascii=False)}\n\n"
        except Exception:
            logger.exception("Assistant SSE stream failed")
            yield (
                "data: "
                f"{json.dumps({'error': 'Ошибка ИИ-ассистента, попробуйте позже'}, ensure_ascii=False)}\n\n"
            )
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
