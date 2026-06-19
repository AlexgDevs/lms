from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.core.schemas.base_schema import BaseSchema


class CourseSchema(BaseSchema):
    """
    Full course schema returned to the client (Response model).
    """

    id: UUID
    owner_id: UUID
    title: str
    description: str | None
    cover_url: str | None
    price: int
    created_at: datetime


class CourseCreateRequestSchema(BaseSchema):
    """
    Schema for incoming client request to create a course.
    Does NOT include cover_url as it's handled by the server.
    """

    title: str = Field(..., max_length=128, description="Название курса")
    description: str | None = Field(None, max_length=128, description="Описание курса")
    price: int = Field(0, ge=0, description="Цена курса (не может быть отрицательной)")


class CourseCreateSchema(BaseSchema):
    """
    Internal schema passed to the repository/UOW after processing the request.
    Includes the server-generated cover_url.
    """

    owner_id: UUID
    title: str
    description: str | None
    price: int
    cover_url: str | None = None


class CourseUpdateRequestSchema(BaseSchema):
    """
    Schema for updating an existing course.
    All fields are optional because the client might want to update only one field (PATCH-like).
    """

    title: str | None = Field(None, max_length=128)
    description: str | None = Field(None, max_length=128)
    price: int | None = Field(None, ge=0)


class CourseUpdateSchema(BaseSchema):
    """
    Internal schema passed to the repository for applying updates.
    """

    title: str | None = None
    description: str | None = None
    price: int | None = None
    cover_url: str | None = None
    is_deleted: datetime | None = None
