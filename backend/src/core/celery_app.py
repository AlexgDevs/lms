from celery import Celery

from src.core.config import settings

celery_app = Celery(
    "lms",
    broker=settings.redis.REDIS_URL,
    backend=settings.redis.REDIS_URL,
    include=["src.ai.tgp.tasks", "src.ai.course_review.tasks", "src.ai.generate.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Windows dev machines cannot run the default prefork pool; solo runs
    # tasks in the main process (also fine for low-volume dev workloads).
    worker_pool="solo",
    broker_connection_retry_on_startup=True,
)
