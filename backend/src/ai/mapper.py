from src.ai.models import TgpQuestion
from src.ai.schemas import TgpQuestionSchema
from src.core.mappers import BaseMapper


class TgpQuestionMapper(BaseMapper[TgpQuestion, TgpQuestionSchema]):
    orm_model = TgpQuestion
    schema_class = TgpQuestionSchema
