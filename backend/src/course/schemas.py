from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.course.enums import CourseMemberRole, CourseStatus
from src.core.schemas.base_schema import BaseSchema


class CourseSchema(BaseSchema):
    """
    Full course schema returned to the client (Response model).
    """

    id: UUID
    owner_id: UUID
    title: str
    description: str | None
    cover_url: str | None
    price: int
    category_id: UUID | None = None
    member_count: int = 0
    is_member: bool = False
    status: CourseStatus
    moderation_reason: str | None = None
    created_at: datetime
    tgp_enabled: bool = False
    tgp_last_full_generated_at: datetime | None = None
    tgp_cooldown_hours: int = 24


class CourseCreateRequestSchema(BaseSchema):
    """
    Schema for incoming client request to create a course.
    Does NOT include cover_url as it's handled by the server.
    """

    title: str = Field(..., max_length=128, description="Название курса")
    description: str | None = Field(None, max_length=128, description="Описание курса")
    price: int = Field(0, ge=0, description="Цена курса (не может быть отрицательной)")
    category_id: UUID | None = Field(None, description="ID категории курса")


class CourseCreateSchema(BaseSchema):
    """
    Internal schema passed to the repository/UOW after processing the request.
    Includes the server-generated cover_url.
    """

    owner_id: UUID
    title: str
    description: str | None
    price: int
    cover_url: str | None = None
    category_id: UUID | None = None
    status: CourseStatus = CourseStatus.DRAFT


class CourseUpdateRequestSchema(BaseSchema):
    """
    Schema for updating an existing course.
    All fields are optional because the client might want to update only one field (PATCH-like).
    """

    title: str | None = Field(None, max_length=128)
    description: str | None = Field(None, max_length=128)
    price: int | None = Field(None, ge=0)
    category_id: UUID | None = None
    status: CourseStatus | None = None
    tgp_enabled: bool | None = None
    tgp_cooldown_hours: int | None = Field(None, ge=0)


class CourseUpdateSchema(BaseSchema):
    """
    Internal schema passed to the repository for applying updates.
    """

    title: str | None = None
    description: str | None = None
    price: int | None = None
    cover_url: str | None = None
    category_id: UUID | None = None
    status: CourseStatus | None = None
    moderation_reason: str | None = None
    tgp_enabled: bool | None = None
    tgp_cooldown_hours: int | None = None
    tgp_last_full_generated_at: datetime | None = None
    is_deleted: datetime | None = None


class CourseUserBriefSchema(CourseSchema):
    role: CourseMemberRole
    progress: int = 0


class CourseModerationRejectSchema(BaseSchema):
    reason: str = Field(..., min_length=1, max_length=1000)


class CourseModerationQueueSchema(BaseSchema):
    id: UUID
    title: str
    description: str | None
    cover_url: str | None
    owner_id: UUID
    owner_username: str
    status: CourseStatus
    moderation_reason: str | None
    created_at: datetime
    module_count: int
    lesson_count: int
    block_count: int
