from datetime import date, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.services import BaseService
from src.profile.repository import ProfileRepository
from src.profile.schemas import (
    ContributionDaySchema,
    DayActivitySchema,
    ProfileStatsSchema,
    StreakSchema,
)

WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
YEAR_DAYS = 365


class ProfileService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        profile_repository: ProfileRepository,
    ) -> None:
        super().__init__(session)
        self.profile_repository = profile_repository

    async def get_stats(self, user_id: UUID) -> ProfileStatsSchema:
        today = date.today()
        year_start = today - timedelta(days=YEAR_DAYS - 1)

        counts = await self.profile_repository.count_completed_by_day(
            user_id, since=year_start
        )
        active_days = await self.profile_repository.get_all_completed_days(user_id)

        weekly = self._build_weekly(counts, today)
        yearly = self._build_yearly(counts, year_start, today)
        streak = self._compute_streak(active_days, today)

        return ProfileStatsSchema(
            streak=streak,
            weekly=weekly,
            yearly=yearly,
        )

    def _build_weekly(
        self, counts: dict[date, int], today: date
    ) -> list[DayActivitySchema]:
        week_start = today - timedelta(days=today.weekday())
        return [
            DayActivitySchema(
                day=WEEKDAY_LABELS[offset],
                count=counts.get(week_start + timedelta(days=offset), 0),
            )
            for offset in range(len(WEEKDAY_LABELS))
        ]

    def _build_yearly(
        self, counts: dict[date, int], year_start: date, today: date
    ) -> list[ContributionDaySchema]:
        return [
            ContributionDaySchema(
                date=year_start + timedelta(days=offset),
                count=counts.get(year_start + timedelta(days=offset), 0),
            )
            for offset in range(YEAR_DAYS)
        ]

    def _compute_streak(self, active_days: set[date], today: date) -> StreakSchema:
        cursor = today
        if cursor not in active_days:
            cursor -= timedelta(days=1)

        current = 0
        while cursor in active_days:
            current += 1
            cursor -= timedelta(days=1)

        longest = 0
        run = 0
        previous: date | None = None
        for day in sorted(active_days):
            if previous is not None and (day - previous).days == 1:
                run += 1
            else:
                run = 1
            longest = max(longest, run)
            previous = day

        return StreakSchema(current=current, longest=longest)
