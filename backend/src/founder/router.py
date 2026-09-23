from fastapi import APIRouter

from src.core.dependencies import SessionDep
from src.founder.schemas import FounderProgressSchema
from src.founder.service import get_founder_progress

router = APIRouter(prefix="/founder", tags=["Founder"])


@router.get(
    "/progress",
    response_model=FounderProgressSchema,
    summary="Get founder program progress",
)
async def get_founder_progress_endpoint(
    session: SessionDep,
) -> FounderProgressSchema:
    return await get_founder_progress(session)
