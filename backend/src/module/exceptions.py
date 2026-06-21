from src.core.errors.base_errors import ObjectNotFoundError


class ModuleNotFoundError(ObjectNotFoundError):
    detail = "Module not found"
