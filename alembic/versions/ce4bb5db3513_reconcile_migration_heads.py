"""Reconcile migration heads

Revision ID: ce4bb5db3513
Revises: 769824c82bee, a3b4c5d6e7f8, b3c4d5e6f7a1
Create Date: 2026-08-29 17:02:18.457996

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce4bb5db3513'
down_revision: Union[str, Sequence[str], None] = ('769824c82bee', 'a3b4c5d6e7f8', 'b3c4d5e6f7a1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
