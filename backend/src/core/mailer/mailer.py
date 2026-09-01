"""Async email sending via SMTP (aiosmtplib).

Emails never raise: on failure or when ``MAIL_ENABLED`` is off, they are logged
so that registration/auth flows are not blocked by a misconfigured mail server.
"""

from email.message import EmailMessage

import aiosmtplib
from loguru import logger

from src.core.config import settings


def build_verification_link(token: str) -> str:
    base = settings.app.FRONTEND_HOST.rstrip("/")
    return f"{base}/verify-email?token={token}"


def build_password_reset_link(token: str) -> str:
    base = settings.app.FRONTEND_HOST.rstrip("/")
    return f"{base}/reset-password?token={token}"


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.mail.MAIL_ENABLED:
        logger.info("Mail disabled; would send '{}' to {}", subject, to)
        return False

    msg = EmailMessage()
    msg["From"] = f"{settings.mail.SMTP_FROM_NAME} <{settings.mail.SMTP_FROM}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(subject)
    msg.add_alternative(html, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.mail.SMTP_HOST,
            port=settings.mail.SMTP_PORT,
            username=settings.mail.SMTP_USERNAME,
            password=settings.mail.SMTP_PASSWORD,
            use_tls=settings.mail.SMTP_USE_TLS,
            timeout=settings.mail.SMTP_TIMEOUT_SECONDS,
        )
        return True
    except Exception as exc:  # noqa: BLE001 - never block auth on mail failure
        logger.warning("Email send failed to {}: {}", to, exc)
        return False


async def send_verification_email(to: str, token: str) -> bool:
    link = build_verification_link(token)
    html = (
        "<html><body>"
        "<p>Здравствуйте!</p>"
        "<p>Подтвердите адрес электронной почты, перейдя по ссылке ниже:</p>"
        f"<p><a href='{link}'>{link}</a></p>"
        "<p>Если вы не регистрировались на платформе, просто проигнорируйте это письмо.</p>"
        "</body></html>"
    )
    return await send_email(to, "Подтверждение почты", html)


async def send_password_reset_email(to: str, token: str) -> bool:
    link = build_password_reset_link(token)
    html = (
        "<html><body>"
        "<p>Здравствуйте!</p>"
        "<p>Запрошен сброс пароля. Перейдите по ссылке ниже, чтобы задать новый пароль:</p>"
        f"<p><a href='{link}'>{link}</a></p>"
        "<p>Ссылка действительна 15 минут. Если вы не запрашивали сброс, "
        "просто проигнорируйте это письмо.</p>"
        "</body></html>"
    )
    return await send_email(to, "Сброс пароля", html)
