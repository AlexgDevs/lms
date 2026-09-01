"""add payout accounts and payment split columns

Revision ID: e6f7a8b90001
Revises: d5e6f7a80001
Create Date: 2026-08-27 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e6f7a8b90001"
down_revision: Union[str, Sequence[str], None] = "d5e6f7a80001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "payout_accounts",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("method", sa.String(length=32), nullable=False),
        sa.Column("recipient", sa.String(length=128), nullable=False),
        sa.Column("holder_name", sa.String(length=128), nullable=True),
        sa.Column("bank_name", sa.String(length=128), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('UTC', now())"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("TIMEZONE('UTC', now())"),
            nullable=False,
        ),
        sa.Column(
            "id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_payout_accounts_user_id"),
    )
    op.create_index(
        op.f("ix_payout_accounts_user_id"), "payout_accounts", ["user_id"], unique=True
    )

    op.add_column("payments", sa.Column("platform_fee", sa.Integer(), nullable=True))
    op.add_column("payments", sa.Column("author_amount", sa.Integer(), nullable=True))
    op.add_column(
        "payments", sa.Column("payout_status", sa.String(length=32), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("payments", "payout_status")
    op.drop_column("payments", "author_amount")
    op.drop_column("payments", "platform_fee")
    op.drop_index(op.f("ix_payout_accounts_user_id"), table_name="payout_accounts")
    op.drop_table("payout_accounts")
