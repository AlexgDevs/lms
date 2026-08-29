"""course tgp content snapshot

Revision ID: f230331c7c19
Revises: ce4bb5db3513
Create Date: 2026-08-29 19:18:54.164550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f230331c7c19'
down_revision: Union[str, Sequence[str], None] = 'ce4bb5db3513'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'courses',
        sa.Column(
            'tgp_content_snapshot',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('courses', 'tgp_content_snapshot')
