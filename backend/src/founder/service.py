from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.payment.enums import PaymentStatus
from src.payment.models import Payment
from src.user.models import User


async def grant_founder_if_eligible(session: AsyncSession, user_id: UUID) -> bool:
    """Grant the lifetime Founder status to ``user_id`` if the program is open.

    The program closes only when BOTH the cumulative ``SUCCEEDED`` payment
    revenue reaches ``FOUNDER_PROGRAM_REVENUE_LIMIT`` AND ``FOUNDER_PROGRAM_MAX_AUTHORS``
    founders have been granted. Reaching only one limit does not close the
    program. Idempotent; commits the change.
    """
    founder = settings.founder
    if not founder.FOUNDER_PROGRAM_ENABLED:
        return False

    user = (
        await session.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if not user or user.is_founder:
        return False

    revenue = int(
        (
            await session.execute(
                select(func.coalesce(func.sum(Payment.amount), 0)).where(
                    Payment.status == PaymentStatus.SUCCEEDED
                )
            )
        ).scalar_one()
    )
    founders = int(
        (
            await session.execute(
                select(func.count()).select_from(User).where(User.is_founder.is_(True))
            )
        ).scalar_one()
    )
    if revenue >= founder.FOUNDER_PROGRAM_REVENUE_LIMIT and (
        founders >= founder.FOUNDER_PROGRAM_MAX_AUTHORS
    ):
        return False

    user.is_founder = True
    user.founder_at = datetime.now(timezone.utc)
    await session.commit()
    return True
