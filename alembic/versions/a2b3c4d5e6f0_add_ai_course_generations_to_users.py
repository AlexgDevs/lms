"""add ai_course_generations to users

Revision ID: a2b3c4d5e6f0
Revises: f9a8b7c6e5d4
Create Date: 2026-08-28 13:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a2b3c4d5e6f0"
down_revision: Union[str, Sequence[str], None] = "f9a8b7c6e5d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "ai_course_generations",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "ai_course_generations")
