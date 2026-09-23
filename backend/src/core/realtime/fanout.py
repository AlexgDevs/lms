"""Cross-replica fan-out for realtime envelopes over Redis pub/sub.

The prod stack runs two backend replicas behind nginx; the domain EventBus
(``InMemoryEvent``) and ``ConnectionManager`` are process-local, so an event
handled on replica A cannot reach a WebSocket held on replica B. The fix is
one hop through Redis: the producing process publishes the envelope once,
every replica's listener receives it and delivers to its *local* connections
only — ``broadcast_to_room`` stays local by design (see its docstring).
"""

from __future__ import annotations

import asyncio
import json
from uuid import UUID

from loguru import logger
from redis.asyncio import Redis

from src.core.realtime.envelope import Envelope
from src.core.websocket.manager import ConnectionManager

NOTIFICATION_CHANNEL = "realtime:notifications"
RETRY_DELAY_SECONDS = 1.0


class NotificationFanout:
    """Publishes envelopes to Redis. Fail-open: ``publish`` returns ``False``
    on Redis errors so callers can fall back to a local-only broadcast."""

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def publish(self, user_id: UUID, envelope: Envelope) -> bool:
        message = json.dumps(
            {
                "user_id": str(user_id),
                "envelope": envelope.model_dump(mode="json"),
            }
        )
        try:
            await self._client.publish(NOTIFICATION_CHANNEL, message)
            return True
        except Exception:
            logger.exception(
                "realtime.fanout_publish_failed",
                user_id=str(user_id),
            )
            return False


class NotificationFanoutListener:
    """One listener task per process: subscribes to the channel and replays
    every envelope into the local ``ConnectionManager``.

    Restarts itself with a fixed delay if the Redis connection breaks;
    ``stop()`` cancels the task (``CancelledError`` propagates through the
    pub/sub async-context manager, which closes the subscription).
    """

    def __init__(self, client: Redis, ws_manager: ConnectionManager) -> None:
        self._client = client
        self._ws_manager = ws_manager
        self._task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        if self._task is not None:
            return
        self._task = asyncio.create_task(self._run(), name="realtime-fanout-listener")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def _run(self) -> None:
        while True:
            try:
                async with self._client.pubsub() as pubsub:
                    await pubsub.subscribe(NOTIFICATION_CHANNEL)
                    logger.info("realtime.fanout_listener_started")
                    async for message in pubsub.listen():
                        if message.get("type") != "message":
                            continue
                        await self._deliver(message["data"])
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("realtime.fanout_listener_error")
                await asyncio.sleep(RETRY_DELAY_SECONDS)

    async def _deliver(self, raw: str | bytes) -> None:
        try:
            data = json.loads(raw)
            user_id = UUID(data["user_id"])
            envelope = Envelope.model_validate(data["envelope"])
        except ValueError, KeyError, TypeError:
            logger.exception("realtime.fanout_bad_message")
            return
        await self._ws_manager.broadcast_to_room(f"user:{user_id}", envelope)
