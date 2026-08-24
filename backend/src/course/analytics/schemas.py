from uuid import UUID

from src.core.schemas.base_schema import BaseSchema


class CourseOverviewSchema(BaseSchema):
    course_id: UUID
    total_enrolled: int
    active: int
    churned: int
    completion_rate: float
    avg_accuracy: float


class EnrollmentTrendDaySchema(BaseSchema):
    date: str
    enrolled: int
    unenrolled: int


class EnrollmentTrendSchema(BaseSchema):
    course_id: UUID
    days: list[EnrollmentTrendDaySchema]


class LessonPerformanceSchema(BaseSchema):
    lesson_id: UUID
    title: str
    module_title: str
    completion_rate: float
    avg_time_seconds: float
    total_started: int
    total_completed: int


class BlockPerformanceSchema(BaseSchema):
    block_id: UUID
    title: str
    block_type: str
    lesson_title: str
    accuracy: float
    avg_attempts: float
    first_try_rate: float
    total_submissions: int


class ContentPerformanceSchema(BaseSchema):
    course_id: UUID
    lessons: list[LessonPerformanceSchema]
    blocks: list[BlockPerformanceSchema]
