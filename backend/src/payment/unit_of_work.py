from sqlalchemy.ext.asyncio import AsyncSession

from src.core.unit_of_work.base_unit_of_work import BaseUnitOfWork
from src.course.course_member.repository import CourseMemberRepository
from src.course.repository import CourseRepository
from src.payment.repository import PaymentRepository, PayoutAccountRepository


class PaymentUnitOfWork(BaseUnitOfWork):
    payments: PaymentRepository
    payout_accounts: PayoutAccountRepository
    courses: CourseRepository
    members: CourseMemberRepository

    def __init__(
        self,
        session: AsyncSession,
        payment_repository: PaymentRepository,
        payout_account_repository: PayoutAccountRepository,
        course_repository: CourseRepository,
        course_member_repository: CourseMemberRepository,
    ) -> None:
        super().__init__(session)
        self.payments = payment_repository
        self.payout_accounts = payout_account_repository
        self.courses = course_repository
        self.members = course_member_repository

    def _uow_marker(self) -> None:
        pass
