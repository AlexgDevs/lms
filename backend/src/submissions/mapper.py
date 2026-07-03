from src.block.models import BlockSubmission
from src.submissions.schemas import BlockSubmissionSchema
from src.core.mappers.base_mapper import BaseMapper


class BlockSubmissionMapper(BaseMapper[BlockSubmission, BlockSubmissionSchema]):
    orm_model = BlockSubmission
    schema_class = BlockSubmissionSchema
