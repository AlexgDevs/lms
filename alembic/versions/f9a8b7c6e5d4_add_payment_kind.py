"""add payment kind and make course_id nullable

Revision ID: f9a8b7c6e5d4
Revises: e6f7a8b90001
Create Date: 2026-08-28 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f9a8b7c6e5d4"
down_revision: Union[str, Sequence[str], None] = "e6f7a8b90001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "payments",
        sa.Column(
            "kind",
            sa.String(length=32),
            server_default=sa.text("'course'"),
            nullable=False,
        ),
    )
    op.alter_column(
        "payments", "course_id", existing_type=sa.Uuid(), nullable=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "payments", "course_id", existing_type=sa.Uuid(), nullable=False
    )
    op.drop_column("payments", "kind")
