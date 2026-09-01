"""add course search (pg_trgm)

Revision ID: 4b7d1c9e2f8a
Revises: 2146ce932eb4
Create Date: 2026-08-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b7d1c9e2f8a'
down_revision: Union[str, Sequence[str], None] = '2146ce932eb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    op.create_index(
        "ix_courses_title_trgm",
        "courses",
        ["title"],
        postgresql_using="gin",
        postgresql_ops={"title": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_courses_description_trgm",
        "courses",
        ["description"],
        postgresql_using="gin",
        postgresql_ops={"description": "gin_trgm_ops"},
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_courses_title_trgm", table_name="courses")
    op.drop_index("ix_courses_description_trgm", table_name="courses")
    op.execute(sa.text("DROP EXTENSION IF EXISTS pg_trgm"))
