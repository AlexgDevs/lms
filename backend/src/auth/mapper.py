from src.core.mappers import BaseMapper
from src.auth.models import RefreshToken
from src.auth.schemas import RefreshTokenSchema


class AuthMapper(BaseMapper[RefreshToken, RefreshTokenSchema]):
    model_orm = RefreshToken
    schema_class = RefreshTokenSchema
