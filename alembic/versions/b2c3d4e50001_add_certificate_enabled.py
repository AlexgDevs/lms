"""add certificate_enabled to courses

Revision ID: b2c3d4e50001
Revises: a1b2c3d40001
Create Date: 2026-08-26 19:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e50001"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d40001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "courses",
        sa.Column(
            "certificate_enabled", sa.Boolean(), server_default="false", nullable=False
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("courses", "certificate_enabled")
