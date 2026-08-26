from uuid import UUID

from sqlalchemy import select

from src.core.repositories.base_repository import BaseRepository
from src.certificate.mapper import CertificateMapper
from src.certificate.schemas import CertificateSchema
from src.certificate.models import Certificate


class CertificateRepository(BaseRepository[Certificate, CertificateSchema]):
    model = Certificate
    schema = CertificateSchema
    mapper = CertificateMapper

    async def get_by_user_and_course(
        self, user_id: UUID, course_id: UUID
    ) -> CertificateSchema | None:
        query = select(self.model).where(
            self.model.user_id == user_id,
            self.model.course_id == course_id,
        )
        result = await self.session.execute(query)
        model = result.scalars().one_or_none()
        return self.mapper.to_schema(model) if model else None
