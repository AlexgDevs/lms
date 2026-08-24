from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from src.core.events.protocol import Event


class BaseService:
    def __init__(
        self, session: AsyncSession, event_bus: "Event | None" = None
    ) -> None:
        self.session = session
        self.event_bus = event_bus
