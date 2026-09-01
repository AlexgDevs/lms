from datetime import datetime
from uuid import UUID

from src.core.schemas.base_schema import BaseSchema
from src.course.enums import CourseMemberRole


class CourseMemberSchema(BaseSchema):
    id: UUID
    course_id: UUID
    user_id: UUID
    role: CourseMemberRole
    tgp_last_submitted_at: datetime | None = None


class CourseMemberCreateSchema(BaseSchema):
    course_id: UUID
    user_id: UUID
    role: CourseMemberRole = CourseMemberRole.MEMBER


class CourseMemberUpdateSchema(BaseSchema):
    left_at: datetime | None = None
    tgp_last_submitted_at: datetime | None = None


class CourseUpdateMemberRole(BaseSchema):
    role: CourseMemberRole
