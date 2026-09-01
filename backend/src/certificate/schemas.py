from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class CertificateSchema(BaseSchema):
    id: UUID
    user_id: UUID
    course_id: UUID
    certificate_number: str
    storage_key: str
    issued_at: datetime


class CertificateCreateSchema(BaseSchema):
    user_id: UUID
    course_id: UUID
    certificate_number: str
    storage_key: str
    issued_at: datetime
