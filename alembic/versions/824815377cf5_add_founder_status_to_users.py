"""add founder status to users

Revision ID: 824815377cf5
Revises: f230331c7c19
Create Date: 2026-08-30 15:59:49.935493

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '824815377cf5'
down_revision: Union[str, Sequence[str], None] = 'f230331c7c19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('is_founder', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('founder_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'founder_at')
    op.drop_column('users', 'is_founder')

