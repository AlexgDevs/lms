from src.core.mappers import BaseMapper
from src.module.models import Module
from src.module.schemas import ModuleSchema


class ModuleMapper(BaseMapper[Module, ModuleSchema]):
    orm_model = Module
    schema_class = ModuleSchema
