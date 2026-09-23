from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.founder.schemas import FounderProgressSchema
from src.payment.enums import PaymentStatus
from src.payment.models import Payment
from src.user.models import User


async def get_founder_progress(session: AsyncSession) -> FounderProgressSchema:
    """Aggregate live progress of the Founder program for the public landing.

    ``revenue`` / ``revenue_limit`` are in kopecks to match ``Payment.amount``.
    """
    founder = settings.founder
    founders_count = int(
        (
            await session.execute(
                select(func.count()).select_from(User).where(User.is_founder.is_(True))
            )
        ).scalar_one()
    )
    revenue = int(
        (
            await session.execute(
                select(func.coalesce(func.sum(Payment.amount), 0)).where(
                    Payment.status == PaymentStatus.SUCCEEDED
                )
            )
        ).scalar_one()
    )
    return FounderProgressSchema(
        founders_count=founders_count,
        max_authors=founder.FOUNDER_PROGRAM_MAX_AUTHORS,
        revenue=revenue,
        revenue_limit=founder.FOUNDER_PROGRAM_REVENUE_LIMIT,
    )


async def grant_founder_if_eligible(session: AsyncSession, user_id: UUID) -> bool:
    """Grant the lifetime Founder status to ``user_id`` if the program is open.

    The program closes only when BOTH limits are reached: the author quota
    (``FOUNDER_PROGRAM_MAX_AUTHORS`` founders already granted) AND the cumulative
    ``SUCCEEDED`` revenue (``FOUNDER_PROGRAM_REVENUE_LIMIT``). The quota is
    checked first — while it is not full, the revenue query is skipped.
    Reaching only one limit does not close the program. Idempotent; commits
    the change.
    """
    founder = settings.founder
    if not founder.FOUNDER_PROGRAM_ENABLED:
        return False

    user = (
        await session.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if not user or user.is_founder:
        return False

    founders = int(
        (
            await session.execute(
                select(func.count()).select_from(User).where(User.is_founder.is_(True))
            )
        ).scalar_one()
    )
    if founders >= founder.FOUNDER_PROGRAM_MAX_AUTHORS:
        revenue = int(
            (
                await session.execute(
                    select(func.coalesce(func.sum(Payment.amount), 0)).where(
                        Payment.status == PaymentStatus.SUCCEEDED
                    )
                )
            ).scalar_one()
        )
        if revenue >= founder.FOUNDER_PROGRAM_REVENUE_LIMIT:
            return False

    user.is_founder = True
    user.founder_at = datetime.now(timezone.utc)
    await session.commit()
    return True
