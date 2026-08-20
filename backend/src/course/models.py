from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    Text,
    UUID as sqlUUID,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.course.enums import CourseMemberRole, CourseStatus
from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp


class Course(UUIDBase):
    __tablename__ = "courses"

    title: Mapped[str_128]
    owner_id: Mapped[UUID] = mapped_column(
        sqlUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    description: Mapped[str_128 | None]
    cover_url: Mapped[str | None]
    price: Mapped[int] = mapped_column(default=0)
    category_id: Mapped[UUID | None] = mapped_column(
        sqlUUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        index=True,
    )
    member_count: Mapped[int] = mapped_column(server_default="0", default=0)
    status: Mapped[CourseStatus] = mapped_column(
        SAEnum(
            CourseStatus,
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        server_default="draft",
        default=CourseStatus.DRAFT,
    )
    moderation_reason: Mapped[str | None] = mapped_column(Text)

    # AI TGP (The Golden Path) pre-testing
    tgp_enabled: Mapped[bool] = mapped_column(
        Boolean(), server_default="false", default=False
    )
    tgp_last_full_generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    tgp_cooldown_hours: Mapped[int] = mapped_column(server_default="24", default=24)

    # times
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    is_deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CourseMember(UUIDBase):
    __tablename__ = "course_members"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id"))

    role: Mapped[str_128] = mapped_column(default=CourseMemberRole.MEMBER)
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # AI TGP (The Golden Path): last pre-test submission (roadmap regeneration cooldown)
    tgp_last_submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
