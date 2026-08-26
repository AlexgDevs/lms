from datetime import datetime
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.core.postgres.base import UUIDBase
from src.core.postgres.types import str_128, timestamp
from src.review.enums import ReviewTargetType


class Review(UUIDBase):
    """Polymorphic review / rating attached to an LMS entity.

    A single table serves courses and instructors: ``target_type`` +
    ``target_id`` identify the entity being reviewed (mirrors the
    ``owner_type`` / ``owner_id`` pattern used by ``MediaAttachment``).

    Two kinds of rows share this table:

    - **root review** — ``parent_id IS NULL``, carries a numeric ``rating``
      (1..5) used for the average rating aggregation.
    - **reply** — ``parent_id`` points at a root review of the same target,
      ``rating`` is ``NULL``. Replies are just reviews, so there is no
      separate model ("don't flood the DB with models").

    Anti-spam: ``uq_review_user_target`` is a partial unique index that
    allows at most one root review per (user, target), while replies are
    unaffected.
    """

    __tablename__ = "reviews"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    target_type: Mapped[str_128]
    target_id: Mapped[UUID] = mapped_column(index=True)
    rating: Mapped[int | None] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    parent_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"),
        index=True,
    )
    is_edited: Mapped[bool] = mapped_column(
        Boolean(), server_default="false", default=False
    )
    is_deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]

    __table_args__ = (
        Index("ix_reviews_target", "target_type", "target_id"),
        Index(
            "uq_review_user_target",
            "user_id",
            "target_type",
            "target_id",
            unique=True,
            postgresql_where=sa.text("parent_id IS NULL"),
        ),
    )
