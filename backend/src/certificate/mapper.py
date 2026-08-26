from src.core.mappers.base_mapper import BaseMapper
from src.certificate.models import Certificate
from src.certificate.schemas import CertificateSchema


class CertificateMapper(BaseMapper[Certificate, CertificateSchema]):
    orm_class = Certificate
    schema_class = CertificateSchema
