"""Promote a user to staff (admin/moderator) by email or username.

Usage (from repo root):
    uv run python scripts/promote_admin.py <email-or-username>
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
SRC = BACKEND / "src"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(SRC))

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.config import settings
from src.user.models import User


async def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: uv run python scripts/promote_admin.py <email-or-username>")
        sys.exit(2)
    identifier = sys.argv[1].strip()
    engine = create_async_engine(str(settings.postgres.DATABASE_URL))
    try:
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        async with session_factory() as session:
            user = (
                await session.execute(
                    select(User).where(
                        or_(User.email == identifier, User.username == identifier)
                    )
                )
            ).scalar_one_or_none()
            if not user:
                print(f"User {identifier!r} not found.")
                sys.exit(1)
            user.is_staff = True
            await session.commit()
            print(f"Promoted {user.username} ({user.email}) to staff.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())