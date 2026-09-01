"""add session metadata to refresh_tokens

Revision ID: a3b4c5d6e7f8
Revises: 979626edf2ea
Create Date: 2026-08-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = '979626edf2ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('refresh_tokens', sa.Column('ip_address', sa.String(45), nullable=True))
    op.add_column('refresh_tokens', sa.Column('user_agent', sa.Text(), nullable=True))
    op.add_column('refresh_tokens', sa.Column('device_name', sa.String(128), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('refresh_tokens', 'device_name')
    op.drop_column('refresh_tokens', 'user_agent')
    op.drop_column('refresh_tokens', 'ip_address')
