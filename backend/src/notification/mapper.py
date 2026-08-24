from src.core.mappers.base_mapper import BaseMapper
from src.notification.models import Notification
from src.notification.schemas import NotificationSchema


class NotificationMapper(BaseMapper[Notification, NotificationSchema]):
    model = Notification
    schema = NotificationSchema
