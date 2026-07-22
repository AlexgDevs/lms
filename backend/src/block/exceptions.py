from src.core.errors.base_errors import ObjectNotFoundError


class BlockNotFoundError(ObjectNotFoundError):
    detail = "Block not found"
