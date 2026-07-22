from src.block.models import Block
from src.block.schemas import BlockSchema
from src.core.mappers import BaseMapper


class BlockMapper(BaseMapper[Block, BlockSchema]):
    orm_model = Block
    schema_class = BlockSchema
