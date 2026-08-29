from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from src.core.events.event import (
    BlockDeleted,
    CourseApproved,
    CourseDeleted,
    CourseEnrolled,
    CourseRejected,
    CourseReviewApproved,
    CourseReviewFlagged,
    CourseSubmittedForReview,
    CourseUnenrolled,
    DomainEvent,
    LessonCompleted,
    LessonDeleted,
    MemberRoleChanged,
    ModuleDeleted,
    UserLoggedIn,
)
from src.core.realtime.envelope import Envelope, EventType
from src.core.websocket.manager import ConnectionManager
from src.notification.repository import NotificationRepository
from src.notification.schemas import NotificationCreateSchema
from src.notification.service import NotificationService

EventMap = dict[type[DomainEvent], tuple[str, str, str | None]]
"""Maps event type → (title, body_template, link_template).
Link templates use {field} placeholders resolved from event attrs."""


EVENT_MAP: EventMap = {
    CourseSubmittedForReview: (
        "Курс отправлен на модерацию",
        "Ваш курс «{course_title}» отправлен на проверку.",
        "/teaching",
    ),
    CourseApproved: (
        "Курс одобрен",
        "Ваш курс «{course_title}» опубликован и доступен студентам.",
        "/courses/{course_id}",
    ),
    CourseRejected: (
        "Курс отклонён",
        "Ваш курс «{course_title}» отклонён модератором. Причина: {reason}",
        "/teaching",
    ),
    CourseEnrolled: (
        "Новый студент",
        "Студент записался на ваш курс «{course_title}».",
        "/teaching/courses/{course_id}/analytics",
    ),
    CourseUnenrolled: (
        "Студент отписался",
        "Студент отписался от курса «{course_title}».",
        "/teaching/courses/{course_id}/analytics",
    ),
    CourseDeleted: (
        "Курс удалён",
        "Курс «{course_title}» был удалён автором.",
        None,
    ),
    ModuleDeleted: (
        "Модуль удалён",
        "Модуль «{module_title}» был удалён из курса.",
        "/courses/{course_id}",
    ),
    LessonDeleted: (
        "Урок удалён",
        "Урок «{lesson_title}» был удалён из курса.",
        "/courses/{course_id}",
    ),
    BlockDeleted: (
        "Блок удалён",
        "Блок «{block_title}» был удалён из урока.",
        "/courses/{course_id}",
    ),
    MemberRoleChanged: (
        "Роль изменена",
        "Ваша роль в курсе изменена: {old_role} → {new_role}.",
        "/courses/{course_id}",
    ),
    LessonCompleted: (
        "Урок завершён",
        "Студент завершил урок «{lesson_title}» в курсе «{course_title}».",
        "/teaching/courses/{course_id}/analytics",
    ),
    CourseReviewApproved: (
        "Курс опубликован (AI)",
        "AI одобрил ваш курс «{course_title}», он опубликован.",
        "/courses/{course_id}",
    ),
    CourseReviewFlagged: (
        "Курс требует внимания",
        "AI пометил курс «{course_title}» для ручной проверки.",
        "/teaching",
    ),
    UserLoggedIn: (
        "Новый вход в аккаунт",
        "Вход выполнен с устройства «{device_name}».",
        "/settings/sessions",
    ),
}


def _resolve_template(template: str, event: DomainEvent) -> str:
    """Resolve {field} placeholders in a template string from event attrs."""
    result = template
    for key, value in event.__dict__.items():
        if key in ("event_id", "occurred_at"):
            continue
        placeholder = "{" + key + "}"
        if placeholder in result:
            result = result.replace(placeholder, str(value))
    return result


def _get_user_ids_for_notification(event: DomainEvent) -> list[UUID]:
    """Extract user IDs that should receive a notification for this event."""
    event_type = type(event)
    if event_type in (
        CourseSubmittedForReview,
        CourseApproved,
        CourseRejected,
        CourseEnrolled,
        CourseUnenrolled,
        CourseReviewApproved,
        CourseReviewFlagged,
    ):
        assert isinstance(
            event,
            (
                CourseSubmittedForReview,
                CourseApproved,
                CourseRejected,
                CourseEnrolled,
                CourseUnenrolled,
                CourseReviewApproved,
                CourseReviewFlagged,
            ),
        )
        return [event.owner_id]
    if event_type in (CourseDeleted, ModuleDeleted, LessonDeleted, BlockDeleted):
        assert isinstance(
            event, (CourseDeleted, ModuleDeleted, LessonDeleted, BlockDeleted)
        )
        return list(event.member_ids)
    if event_type == MemberRoleChanged:
        assert isinstance(event, MemberRoleChanged)
        return [event.user_id]
    if event_type == LessonCompleted:
        assert isinstance(event, LessonCompleted)
        return [event.owner_id]
    if event_type == UserLoggedIn:
        assert isinstance(event, UserLoggedIn)
        return [event.user_id]
    return []


class NotificationHandler:
    """Subscribes to DomainEvents, creates Notification rows, and pushes
    via WebSocket."""

    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
        ws_manager: ConnectionManager,
    ) -> None:
        self._session_factory = session_factory
        self._ws_manager = ws_manager

    def register(self, event_bus: "Event") -> None:  # type: ignore[name-defined]
        """Subscribe to all notification-relevant domain events."""
        for event_type in EVENT_MAP:
            event_bus.subscribe(event_type, self._handle)

    async def _handle(self, event: DomainEvent) -> None:
        event_type = type(event)
        mapping = EVENT_MAP.get(event_type)
        if mapping is None:
            return

        title_template, body_template, link_template = mapping
        title = _resolve_template(title_template, event)
        body = _resolve_template(body_template, event)
        link = _resolve_template(link_template, event) if link_template else None

        user_ids = _get_user_ids_for_notification(event)

        async with self._session_factory() as session:
            service = NotificationService(
                session=session,
                notification_repository=NotificationRepository(session),
            )
            for user_id in user_ids:
                notification = await service.create(
                    NotificationCreateSchema(
                        user_id=user_id,
                        type=event_type.__name__,
                        title=title,
                        body=body,
                        link=link,
                    )
                )
                envelope = Envelope(
                    type=EventType.NOTIFICATION_CREATED,
                    payload={
                        "id": str(notification.id),
                        "type": notification.type,
                        "title": notification.title,
                        "body": notification.body,
                        "link": notification.link,
                        "created_at": notification.created_at.isoformat(),
                    },
                )
                room = f"user:{user_id}"
                await self._ws_manager.broadcast_to_room(room, envelope)

        logger.info(
            "notification.created",
            event_type=event_type.__name__,
            user_count=len(user_ids),
        )
