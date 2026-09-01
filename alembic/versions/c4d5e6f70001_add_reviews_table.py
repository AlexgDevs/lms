"""add reviews table

Revision ID: c4d5e6f70001
Revises: b2c3d4e50001
Create Date: 2026-08-26 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c4d5e6f70001"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e50001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "reviews",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("target_type", sa.String(length=128), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("parent_id", sa.Uuid(), nullable=True),
        sa.Column("is_edited", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_deleted", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('UTC', now())"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('UTC', now())"),
            nullable=False,
        ),
        sa.Column(
            "id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["parent_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reviews_user_id"), "reviews", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_reviews_target_id"), "reviews", ["target_id"], unique=False
    )
    op.create_index(
        op.f("ix_reviews_parent_id"), "reviews", ["parent_id"], unique=False
    )
    op.create_index(
        "ix_reviews_target", "reviews", ["target_type", "target_id"], unique=False
    )
    op.create_index(
        "uq_review_user_target",
        "reviews",
        ["user_id", "target_type", "target_id"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NULL"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("uq_review_user_target", table_name="reviews")
    op.drop_index("ix_reviews_target", table_name="reviews")
    op.drop_index(op.f("ix_reviews_parent_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_target_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_user_id"), table_name="reviews")
    op.drop_table("reviews")
