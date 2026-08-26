from typing import Annotated

from fastapi import Depends

from src.core.dependencies import SessionDep, StorageDep
from src.certificate.repository import CertificateRepository
from src.certificate.service import CertificateService
from src.certificate.unit_of_work import CertificateUnitOfWork
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.lesson.lesson_progress.repository import LessonProgressRepository
from src.lesson.repository import LessonRepository
from src.module.repository import ModuleRepository
from src.user.repository import UserRepository


def get_certificate_repository(session: SessionDep) -> CertificateRepository:
    return CertificateRepository(session)


CertificateRepositoryDep = Annotated[
    CertificateRepository, Depends(get_certificate_repository)
]


def get_certificate_unit_of_work(
    session: SessionDep,
    certificate_repository: CertificateRepositoryDep,
) -> CertificateUnitOfWork:
    return CertificateUnitOfWork(
        session=session,
        certificate_repository=certificate_repository,
        course_repository=CourseRepository(session),
        course_member_repository=CourseMemberRepository(session),
        module_repository=ModuleRepository(session),
        lesson_repository=LessonRepository(session),
        lesson_progress_repository=LessonProgressRepository(session),
        user_repository=UserRepository(session),
    )


CertificateUnitOfWorkDep = Annotated[
    CertificateUnitOfWork, Depends(get_certificate_unit_of_work)
]


def get_certificate_service(
    session: SessionDep,
    certificate_unit_of_work: CertificateUnitOfWorkDep,
    storage: StorageDep,
) -> CertificateService:
    return CertificateService(
        session=session,
        certificate_unit_of_work=certificate_unit_of_work,
        storage=storage,
    )


CertificateServiceDep = Annotated[CertificateService, Depends(get_certificate_service)]
