from datetime import date

from src.core.schemas.base_schema import BaseSchema


class DayActivitySchema(BaseSchema):
    day: str
    count: int


class ContributionDaySchema(BaseSchema):
    date: date
    count: int


class StreakSchema(BaseSchema):
    current: int
    longest: int


class ProfileStatsSchema(BaseSchema):
    streak: StreakSchema
    weekly: list[DayActivitySchema]
    yearly: list[ContributionDaySchema]
