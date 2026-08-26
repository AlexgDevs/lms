from fastapi import APIRouter
from fastapi.responses import Response

from src.certificate.dependencies import CertificateServiceDep
from src.certificate.schemas import CertificateSchema
from src.user.dependencies import UserIdDep

router = APIRouter(prefix="/courses", tags=["Certificates"])
user_certificates_router = APIRouter(prefix="/users/me", tags=["Certificates"])


@router.get("/{course_id}/certificate")
async def download_certificate(
    course_id: str,
    user_id: UserIdDep,
    certificate_service: CertificateServiceDep,
) -> Response:
    """Download the course completion certificate as a PDF file.

    Returns 400 if the course is not fully completed.
    Generates the certificate on first request (lazy generation).
    """
    from uuid import UUID

    pdf_bytes = await certificate_service.download_pdf(user_id, UUID(course_id))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="certificate-{course_id}.pdf"'
        },
    )


@user_certificates_router.get("/certificates", response_model=list[CertificateSchema])
async def list_my_certificates(
    user_id: UserIdDep,
    certificate_service: CertificateServiceDep,
) -> list[CertificateSchema]:
    """List all certificates issued to the current user."""
    return await certificate_service.list_user_certificates(user_id)
