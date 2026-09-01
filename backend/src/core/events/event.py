import uuid
from dataclasses import dataclass, field
from datetime import datetime, UTC


@dataclass(frozen=True, kw_only=True)
class DomainEvent:
    """Base class for domain events raised inside an aggregate.

    These are internal to a bounded context. If another module needs to
    react to something that happened here, publish a dedicated
    *integration event* from application/integration_events instead of
    leaking this type across module boundaries.
    """

    event_id: uuid.UUID = field(default_factory=uuid.uuid4)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))


# --- Moderation events ---


@dataclass(frozen=True, kw_only=True)
class CourseSubmittedForReview(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    owner_id: uuid.UUID


@dataclass(frozen=True, kw_only=True)
class CourseApproved(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    owner_id: uuid.UUID


@dataclass(frozen=True, kw_only=True)
class CourseRejected(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    owner_id: uuid.UUID
    reason: str


# --- Enrollment events ---


@dataclass(frozen=True, kw_only=True)
class CourseEnrolled(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    user_id: uuid.UUID
    owner_id: uuid.UUID


@dataclass(frozen=True, kw_only=True)
class CourseUnenrolled(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    user_id: uuid.UUID
    owner_id: uuid.UUID


# --- Content deletion events ---


@dataclass(frozen=True, kw_only=True)
class CourseDeleted(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    member_ids: list[uuid.UUID]


@dataclass(frozen=True, kw_only=True)
class ModuleDeleted(DomainEvent):
    course_id: uuid.UUID
    module_title: str
    member_ids: list[uuid.UUID]


@dataclass(frozen=True, kw_only=True)
class LessonDeleted(DomainEvent):
    course_id: uuid.UUID
    lesson_title: str
    member_ids: list[uuid.UUID]


@dataclass(frozen=True, kw_only=True)
class BlockDeleted(DomainEvent):
    course_id: uuid.UUID
    block_title: str
    member_ids: list[uuid.UUID]


# --- Role events ---


@dataclass(frozen=True, kw_only=True)
class MemberRoleChanged(DomainEvent):
    course_id: uuid.UUID
    user_id: uuid.UUID
    old_role: str
    new_role: str


# --- Progress events ---


@dataclass(frozen=True, kw_only=True)
class LessonCompleted(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    lesson_id: uuid.UUID
    lesson_title: str
    user_id: uuid.UUID
    owner_id: uuid.UUID


# --- AI Review events ---


@dataclass(frozen=True, kw_only=True)
class CourseReviewApproved(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    owner_id: uuid.UUID


@dataclass(frozen=True, kw_only=True)
class CourseReviewFlagged(DomainEvent):
    course_id: uuid.UUID
    course_title: str
    owner_id: uuid.UUID


# --- Auth / Session events ---


@dataclass(frozen=True, kw_only=True)
class UserLoggedIn(DomainEvent):
    user_id: uuid.UUID
    ip_address: str | None
    device_name: str | None


@dataclass(frozen=True, kw_only=True)
class UserLoggedOut(DomainEvent):
    user_id: uuid.UUID
    session_id: uuid.UUID
