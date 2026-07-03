from uuid import UUID

from pydantic import BaseModel

from src.block.models import BlockSubmission
from src.submissions.mapper import BlockSubmissionMapper
from src.submissions.schemas import BlockSubmissionSchema
from src.core.repositories.base_repository import BaseRepository


class BlockSubmissionRepository(BaseRepository[BlockSubmission, BlockSubmissionSchema]):
    model = BlockSubmission
    schema = BlockSubmissionSchema
    mapper = BlockSubmissionMapper
