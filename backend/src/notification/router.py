from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.auth.security import decode_access_token
from src.core.websocket.connection import Connection
from src.core.websocket.manager import ConnectionManager
from src.notification.dependencies import (
    NotificationServiceDep,
)
from src.notification.schemas import NotificationListSchema, UnreadCountSchema
from src.user.dependencies import AuthenticatedUserIdDep

router = APIRouter(tags=["Notifications"])
"""REST endpoints — mounted under ``/api/v1`` (app_v1), so nginx's ``/api/``
location proxies them. Never mount this at the app root: the prod nginx SPA
fallback would swallow ``/notifications`` and return index.html."""

ws_router = APIRouter(tags=["Notifications"])
"""WebSocket push endpoint — mounted at the app root (``/ws/notifications``)
because nginx has a dedicated ``/ws/`` location with Upgrade headers."""


@router.get(
    "/notifications",
    response_model=NotificationListSchema,
    summary="List notifications",
)
async def list_notifications(
    user_id: AuthenticatedUserIdDep,
    service: NotificationServiceDep,
    limit: int = 20,
    offset: int = 0,
) -> NotificationListSchema:
    items, total, unread_count = await service.list_for_user(user_id, limit, offset)
    return NotificationListSchema(items=items, total=total, unread_count=unread_count)


@router.get(
    "/notifications/unread-count",
    response_model=UnreadCountSchema,
    summary="Get unread notification count",
)
async def get_unread_count(
    user_id: AuthenticatedUserIdDep,
    service: NotificationServiceDep,
) -> UnreadCountSchema:
    count = await service.count_unread(user_id)
    return UnreadCountSchema(count=count)


@router.patch(
    "/notifications/{notification_id}/read",
    status_code=204,
    summary="Mark notification as read",
)
async def mark_notification_read(
    notification_id: UUID,
    user_id: AuthenticatedUserIdDep,
    service: NotificationServiceDep,
) -> None:
    await service.mark_read(notification_id, user_id)


@router.patch(
    "/notifications/read-all",
    status_code=204,
    summary="Mark all notifications as read",
)
async def mark_all_notifications_read(
    user_id: AuthenticatedUserIdDep,
    service: NotificationServiceDep,
) -> None:
    await service.mark_all_read(user_id)


@ws_router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket) -> None:
    await websocket.accept()

    token = websocket.query_params.get("token") or websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=4401, reason="Missing access token")
        return

    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=4401, reason="Invalid token")
            return
        user_id = UUID(user_id_str)
    except Exception:
        await websocket.close(code=4401, reason="Invalid token")
        return

    cm: ConnectionManager = websocket.app.state.ws_manager
    connection = Connection(
        websocket,
        user_id,
        queue_maxsize=256,
        on_disconnect_needed=cm.disconnect,
    )
    cm._connections[connection.connection_id] = connection
    cm._user_connections.setdefault(user_id, set()).add(connection.connection_id)
    room = f"user:{user_id}"
    await cm.join_room(connection, room)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await cm.disconnect(connection, already_disconnected=True)
