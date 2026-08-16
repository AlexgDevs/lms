"""add tgp_last_submitted_at to course_members

Revision ID: 979626edf2ea
Revises: 0fc64b968676
Create Date: 2026-08-16 10:59:43.673468

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '979626edf2ea'
down_revision: Union[str, Sequence[str], None] = '0fc64b968676'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('course_members', sa.Column('tgp_last_submitted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('course_members', 'tgp_last_submitted_at')
