from src.core.mappers.base_mapper import BaseMapper
from src.notification.models import Notification
from src.notification.schemas import NotificationSchema


class NotificationMapper(BaseMapper[Notification, NotificationSchema]):
    orm_class = Notification
    schema_class = NotificationSchema
