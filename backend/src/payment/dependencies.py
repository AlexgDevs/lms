from typing import Annotated

from fastapi import Depends

from src.core.dependencies import EventBusDep, SessionDep
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.payment.repository import PaymentRepository, PayoutAccountRepository
from src.payment.service import PaymentService
from src.payment.unit_of_work import PaymentUnitOfWork
from src.payment.client import build_yookassa_client


def get_payment_repository(session: SessionDep) -> PaymentRepository:
    return PaymentRepository(session)


PaymentRepositoryDep = Annotated[PaymentRepository, Depends(get_payment_repository)]


def get_payout_account_repository(session: SessionDep) -> PayoutAccountRepository:
    return PayoutAccountRepository(session)


PayoutAccountRepositoryDep = Annotated[
    PayoutAccountRepository, Depends(get_payout_account_repository)
]


def get_payment_unit_of_work(
    session: SessionDep,
    payment_repository: PaymentRepositoryDep,
    payout_account_repository: PayoutAccountRepositoryDep,
) -> PaymentUnitOfWork:
    return PaymentUnitOfWork(
        session=session,
        payment_repository=payment_repository,
        payout_account_repository=payout_account_repository,
        course_repository=CourseRepository(session),
        course_member_repository=CourseMemberRepository(session),
    )


PaymentUnitOfWorkDep = Annotated[PaymentUnitOfWork, Depends(get_payment_unit_of_work)]


def get_payment_service(
    session: SessionDep,
    payment_unit_of_work: PaymentUnitOfWorkDep,
    event_bus: EventBusDep,
) -> PaymentService:
    return PaymentService(
        session=session,
        payment_unit_of_work=payment_unit_of_work,
        yookassa_client=build_yookassa_client(),
        event_bus=event_bus,
    )


PaymentServiceDep = Annotated[PaymentService, Depends(get_payment_service)]
