from src.core.mappers import BaseMapper
from src.media.media_attachment.models import MediaAttachment
from src.media.media_attachment.schemas import MediaAttachmentSchema


class MediaAttachmentMapper(BaseMapper[MediaAttachment, MediaAttachmentSchema]):
    orm_model = MediaAttachment
    schema_class = MediaAttachmentSchema
