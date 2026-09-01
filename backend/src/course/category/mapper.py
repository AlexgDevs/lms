from src.core.mappers.base_mapper import BaseMapper
from src.course.category.models import Category
from src.course.category.schemas import CategorySchema


class CategoryMapper(BaseMapper[Category, CategorySchema]):
    orm_class = Category
    schema_class = CategorySchema
