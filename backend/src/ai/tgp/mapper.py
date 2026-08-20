from src.ai.tgp.models import TgpQuestion
from src.ai.tgp.schemas import TgpQuestionSchema
from src.core.mappers import BaseMapper


class TgpQuestionMapper(BaseMapper[TgpQuestion, TgpQuestionSchema]):
    orm_model = TgpQuestion
    schema_class = TgpQuestionSchema
