"""Async email sending via SMTP (aiosmtplib).

Emails never raise: on failure or when ``MAIL_ENABLED`` is off, they are logged
so that registration/auth flows are not blocked by a misconfigured mail server.
"""

from email.message import EmailMessage
from pathlib import Path
from string import Template

import aiosmtplib
from loguru import logger

from src.core.config import settings

_TEMPLATE_PATH = Path(__file__).parent / "templates" / "email_base.html"


def _render_email(
    *,
    heading: str,
    intro: str,
    button_text: str,
    button_url: str,
    note: str,
) -> str:
    """Render the branded email card (PLECTIX style) around a CTA + link."""
    base = settings.app.FRONTEND_HOST.rstrip("/")
    template = Template(_TEMPLATE_PATH.read_text(encoding="utf-8"))
    return template.substitute(
        brand=settings.mail.SMTP_FROM_NAME or "LMS",
        logo_url=f"{base}/full-logo.png",
        home_url=base,
        heading=heading,
        intro=intro,
        button_text=button_text,
        button_url=button_url,
        note=note,
    )


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
    brand = settings.mail.SMTP_FROM_NAME or "LMS"
    html = _render_email(
        heading="Подтвердите адрес электронной почты",
        intro=(
            f"Здравствуйте! Вы зарегистрировались на {brand}. "
            "Подтвердите адрес электронной почты, чтобы завершить регистрацию "
            "и получить доступ к платформе."
        ),
        button_text="Подтвердить почту",
        button_url=link,
        note=(
            "Ссылка действительна 24 часа. Если вы не регистрировались "
            "на платформе, просто проигнорируйте это письмо."
        ),
    )
    return await send_email(to, "Подтверждение почты", html)


async def send_password_reset_email(to: str, token: str) -> bool:
    link = build_password_reset_link(token)
    brand = settings.mail.SMTP_FROM_NAME or "LMS"
    html = _render_email(
        heading="Сброс пароля",
        intro=(
            f"Здравствуйте! Мы получили запрос на сброс пароля для вашего "
            f"аккаунта на {brand}. Нажмите кнопку ниже, чтобы задать новый пароль."
        ),
        button_text="Сбросить пароль",
        button_url=link,
        note=(
            "Ссылка действительна 15 минут. Если вы не запрашивали сброс пароля, "
            "просто проигнорируйте это письмо — пароль останется прежним."
        ),
    )
    return await send_email(to, "Сброс пароля", html)
