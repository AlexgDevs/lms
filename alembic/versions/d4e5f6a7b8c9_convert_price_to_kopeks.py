"""convert price to kopeks (rub *100)

Revision ID: d4e5f6a7b8c9
Revises: a9c8d7e6f5b4
Create Date: 2026-09-18 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "a9c8d7e6f5b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert existing prices from rubles to kopeks (multiply by 100)."""
    # Courses: price was stored as rubles, now store as kopeks
    op.execute(sa.text("UPDATE courses SET price = price * 100 WHERE price > 0"))
    # Payments: amount, platform_fee, author_amount were stored as rubles
    op.execute(sa.text("UPDATE payments SET amount = amount * 100 WHERE amount > 0"))
    op.execute(
        sa.text(
            "UPDATE payments SET platform_fee = platform_fee * 100 WHERE platform_fee > 0"
        )
    )
    op.execute(
        sa.text(
            "UPDATE payments SET author_amount = author_amount * 100 WHERE author_amount > 0"
        )
    )


def downgrade() -> None:
    """Revert kopeks back to rubles (divide by 100)."""
    op.execute(sa.text("UPDATE courses SET price = price / 100 WHERE price > 0"))
    op.execute(sa.text("UPDATE payments SET amount = amount / 100 WHERE amount > 0"))
    op.execute(
        sa.text(
            "UPDATE payments SET platform_fee = platform_fee / 100 WHERE platform_fee > 0"
        )
    )
    op.execute(
        sa.text(
            "UPDATE payments SET author_amount = author_amount / 100 WHERE author_amount > 0"
        )
    )
