"""widen course/module/lesson description columns to Text

Revision ID: a9c8d7e6f5b4
Revises: ecae12c669ea
Create Date: 2026-09-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a9c8d7e6f5b4'
down_revision: Union[str, Sequence[str], None] = 'ecae12c669ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'courses',
        'description',
        type_=sa.Text(),
        existing_type=sa.String(128),
        existing_nullable=True,
    )
    op.alter_column(
        'modules',
        'description',
        type_=sa.Text(),
        existing_type=sa.String(128),
        existing_nullable=True,
    )
    op.alter_column(
        'lessons',
        'description',
        type_=sa.Text(),
        existing_type=sa.String(128),
        existing_nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'courses',
        'description',
        type_=sa.String(128),
        existing_type=sa.Text(),
        existing_nullable=True,
    )
    op.alter_column(
        'modules',
        'description',
        type_=sa.String(128),
        existing_type=sa.Text(),
        existing_nullable=True,
    )
    op.alter_column(
        'lessons',
        'description',
        type_=sa.String(128),
        existing_type=sa.Text(),
        existing_nullable=True,
    )
