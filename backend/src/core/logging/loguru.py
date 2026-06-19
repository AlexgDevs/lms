import logging
import sys
from types import FrameType
from typing import Union
from loguru import logger


class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        level: Union[str, int]
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame: FrameType | None = logging.currentframe()
        depth: int = 2

        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging() -> None:
    logger.remove()

    LOGURU_FORMAT: str = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )

    logger.add(sys.stdout, format=LOGURU_FORMAT, level="INFO", enqueue=True)

    logger.add(
        "logs/app.log",
        format=LOGURU_FORMAT,
        level="DEBUG",
        rotation="1 day",
        retention="10 days",
        compression="zip",
        enqueue=True,
    )

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    loggers_to_intercept: tuple[str, ...] = (
        "uvicorn.numerator",
        "uvicorn.error",
        "uvicorn.access",
        "fastapi",
    )

    for name in loggers_to_intercept:
        logging_logger: logging.Logger = logging.getLogger(name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.propagate = False
