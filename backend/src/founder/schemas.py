from src.core.schemas import BaseSchema


class FounderProgressSchema(BaseSchema):
    founders_count: int
    max_authors: int
    revenue: int
    revenue_limit: int
