from collections import defaultdict
from typing import Protocol, Callable, Awaitable, Sequence

from loguru import logger

from src.core.events.event import DomainEvent

EventHandler = Callable[[DomainEvent], Awaitable[None]]


class Event(Protocol):
    def subscribe(
        self, event_type: type[DomainEvent], handler: EventHandler
    ) -> None: ...

    async def publish(self, event: DomainEvent) -> None: ...

    async def publish_many(self, events: Sequence[DomainEvent]) -> None: ...


class InMemoryEvent:
    """Process-local EventBus: dispatches to subscribers registered on this
    instance, in-process, best-effort. Does not survive process restarts —
    swap in a durable adapter (e.g. Redis Streams) if a consumer needs that.
    """

    def __init__(self) -> None:
        self._handlers: dict[type[DomainEvent], list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_type: type[DomainEvent], handler: EventHandler) -> None:
        self._handlers[event_type].append(handler)

    async def publish(self, event: DomainEvent) -> None:
        logger.info(
            "domain_event.published",
        )
        for handler in self._handlers.get(type(event), []):
            await handler(event)

    async def publish_many(self, events: Sequence[DomainEvent]) -> None:
        for event in events:
            await self.publish(event)
