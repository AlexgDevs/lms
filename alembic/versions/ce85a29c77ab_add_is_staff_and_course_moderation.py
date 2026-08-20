"""add is_staff and course moderation

Revision ID: ce85a29c77ab
Revises: 979626edf2ea
Create Date: 2026-08-20 19:14:20.349540

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce85a29c77ab'
down_revision: Union[str, Sequence[str], None] = '979626edf2ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('courses', sa.Column('moderation_reason', sa.Text(), nullable=True))
    op.alter_column('courses', 'status',
               existing_type=sa.VARCHAR(length=9),
               type_=sa.Enum('draft', 'under_review', 'published', 'rejected', name='coursestatus', native_enum=False),
               existing_nullable=False,
               existing_server_default=sa.text("'draft'::character varying"))
    op.add_column('users', sa.Column('is_staff', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_staff')
    op.alter_column('courses', 'status',
               existing_type=sa.Enum('draft', 'under_review', 'published', 'rejected', name='coursestatus', native_enum=False),
               type_=sa.VARCHAR(length=9),
               existing_nullable=False,
               existing_server_default=sa.text("'draft'::character varying"))
    op.drop_column('courses', 'moderation_reason')
