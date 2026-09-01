"""add notifications_enabled to users

Revision ID: ecae12c669ea
Revises: 824815377cf5
Create Date: 2026-08-30 16:10:22.948932

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ecae12c669ea'
down_revision: Union[str, Sequence[str], None] = '824815377cf5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('notifications_enabled', sa.Boolean(), server_default='true', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'notifications_enabled')
