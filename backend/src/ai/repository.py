from uuid import UUID

from sqlalchemy import delete, select

from src.ai.mapper import TgpQuestionMapper
from src.ai.models import TgpQuestion
from src.ai.schemas import TgpQuestionSchema
from src.core.repositories import BaseRepository


class TgpQuestionRepository(BaseRepository[TgpQuestion, TgpQuestionSchema]):
    model = TgpQuestion
    schema = TgpQuestionSchema
    mapper = TgpQuestionMapper

    async def get_by_course(self, course_id: UUID) -> list[TgpQuestionSchema]:
        query = select(self.model).where(self.model.course_id == course_id)
        result = await self.session.execute(query)
        return [self.mapper.to_schema(model) for model in result.scalars().all()]

    async def delete_by_course(self, course_id: UUID) -> None:
        statement = delete(self.model).where(self.model.course_id == course_id)
        await self.session.execute(statement)
