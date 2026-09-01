from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from src.certificate.exceptions import (
    CertificateCourseNotFoundError,
    CertificateNotEnabledError,
    CertificateUserNotFoundError,
    CourseNotCompletedError,
)
from src.certificate.models import Certificate
from src.certificate.pdf_generator import generate_certificate_pdf
from src.certificate.repository import CertificateRepository
from src.certificate.schemas import CertificateCreateSchema, CertificateSchema
from src.certificate.unit_of_work import CertificateUnitOfWork
from src.core.services.base_service import BaseService
from src.core.storage import Storage
from src.lesson.enums import LessonProgressType


class CertificateService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        certificate_unit_of_work: CertificateUnitOfWork,
        storage: Storage,
    ) -> None:
        self.uow = certificate_unit_of_work
        self.storage = storage
        super().__init__(session)

    async def get_or_issue(self, user_id: UUID, course_id: UUID) -> CertificateSchema:
        """Return existing certificate or issue a new one if the course is fully completed."""
        existing = await self.uow.certificates.get_by_user_and_course(
            user_id=user_id, course_id=course_id
        )
        if existing:
            return existing

        await self._validate_course_completed(user_id, course_id)

        return await self._issue_certificate(user_id, course_id)

    async def download_pdf(self, user_id: UUID, course_id: UUID) -> bytes:
        """Download certificate PDF from storage. Generates if missing."""
        cert = await self.get_or_issue(user_id, course_id)
        return await self.storage.download_bytes(cert.storage_key)

    async def list_user_certificates(self, user_id: UUID) -> list[CertificateSchema]:
        """Return all certificates issued to the given user."""
        return list(
            await self.uow.certificates.get_filtered(
                limit=1000, offset=0, user_id=user_id
            )
        )

    async def _validate_course_completed(self, user_id: UUID, course_id: UUID) -> None:
        """Ensure the course issues certificates and the user completed every lesson."""
        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
        if not course:
            raise CourseNotCompletedError
        if not course.certificate_enabled:
            raise CertificateNotEnabledError

        member = await self.uow.members.get_one(
            user_id=user_id, course_id=course_id, left_at=None
        )
        if not member:
            raise CourseNotCompletedError

        modules = list(
            await self.uow.modules.get_filtered(
                limit=1000, offset=0, course_id=course_id
            )
        )

        total_lessons = 0
        for module in modules:
            lessons = await self.uow.lessons.get_filtered(
                limit=1000, offset=0, course_id=course_id, module_id=module.id
            )
            total_lessons += len(lessons)

        if total_lessons == 0:
            raise CourseNotCompletedError

        completed = 0
        for module in modules:
            lessons = await self.uow.lessons.get_filtered(
                limit=1000, offset=0, course_id=course_id, module_id=module.id
            )
            lesson_ids = [lesson.id for lesson in lessons]
            if not lesson_ids:
                continue
            progresses = await self.uow.lessons_progress.get_by_user_and_lesson_ids(
                user_id=user_id, lesson_ids=lesson_ids
            )
            completed += sum(
                1 for p in progresses if p.status == LessonProgressType.COMPLETED
            )

        if completed < total_lessons:
            raise CourseNotCompletedError

    async def _issue_certificate(
        self, user_id: UUID, course_id: UUID
    ) -> CertificateSchema:
        """Generate PDF, upload to S3, and persist the certificate record."""
        user = await self.uow.users.get_one(id=user_id)
        if not user:
            raise CertificateUserNotFoundError

        course = await self.uow.courses.get_one(id=course_id, is_deleted=None)
        if not course:
            raise CertificateCourseNotFoundError

        cert_id = uuid4()
        now = datetime.now(timezone.utc)

        pdf_bytes = generate_certificate_pdf(
            student_name=user.username,
            course_name=course.title,
            date_issued=now.strftime("%d.%m.%Y"),
            cert_id=cert_id,
        )

        storage_key = f"certificates/{user_id}/{course_id}.pdf"
        await self.storage.upload_bytes(
            key=storage_key,
            data=pdf_bytes,
            content_type="application/pdf",
        )

        cert_data = CertificateCreateSchema(
            user_id=user_id,
            course_id=course_id,
            certificate_number=str(cert_id),
            storage_key=storage_key,
            issued_at=now,
        )
        cert = await self.uow.certificates.create(cert_data)
        await self.uow.commit()
        return cert
