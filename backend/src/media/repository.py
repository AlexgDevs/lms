from typing import List
from uuid import UUID

from sqlalchemy import select

from src.core.repositories import BaseRepository
from src.media.mapper import MediaMapper
from src.media.models import Media
from src.media.schemas import MediaSchema


class MediaRepository(BaseRepository[Media, MediaSchema]):
    model = Media
    schema = MediaSchema
    mapper = MediaMapper

    async def get_by_ids(self, media_ids: list[UUID]) -> List[MediaSchema]:
        statement = select(self.model).where(self.model.id.in_(media_ids))
        result = await self.session.execute(statement)
        return [self.mapper.to_schema(res) for res in result.scalars().all()]
