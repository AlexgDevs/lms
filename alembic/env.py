import asyncio
from logging.config import fileConfig
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parent.parent

BACKEND_DIR = ROOT_DIR / "backend"
SRC_DIR = BACKEND_DIR / "src"

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(SRC_DIR))

from src.core.config import settings
from src.core.postgres import Base

# Import all models so Alembic autogenerate sees the full metadata.
from src.auth import models as auth_models  # noqa: F401
from src.user import models as user_models  # noqa: F401
from src.course import models as course_models  # noqa: F401
from src.course.category import models as category_models  # noqa: F401
from src.module import models as module_models  # noqa: F401
from src.lesson import models as lesson_models  # noqa: F401
from src.block import models as block_models  # noqa: F401
from src.media import models as media_models  # noqa: F401
from src.media.media_attachment import models as media_attachment_models  # noqa: F401
from src.ai.tgp import models as ai_tgp_models  # noqa: F401
from src.notification import models as notification_models  # noqa: F401
from src.certificate import models as certificate_models  # noqa: F401
from src.review import models as review_models  # noqa: F401
from src.payment import models as payment_models  # noqa: F401

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

config = context.config
config.set_main_option("sqlalchemy.url", str(settings.postgres.DATABASE_URL))
# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
