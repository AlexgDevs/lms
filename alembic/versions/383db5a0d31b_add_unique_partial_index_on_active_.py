"""add unique partial index on active course members

Revision ID: 383db5a0d31b
Revises: d4e5f6a7b8c9
Create Date: 2026-09-18 20:14:07.296059

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '383db5a0d31b'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'uq_active_course_member',
        'course_members',
        ['user_id', 'course_id'],
        unique=True,
        postgresql_where='left_at IS NULL',
    )


def downgrade() -> None:
    op.drop_index(
        'uq_active_course_member',
        table_name='course_members',
        postgresql_where='left_at IS NULL',
    )
