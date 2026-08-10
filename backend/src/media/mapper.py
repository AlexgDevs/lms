from src.core.mappers import BaseMapper
from src.media.models import Media
from src.media.schemas import MediaSchema


class MediaMapper(BaseMapper[Media, MediaSchema]):
    orm_model = Media
    schema_class = MediaSchema
