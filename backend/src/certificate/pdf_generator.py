from __future__ import annotations

import io
from pathlib import Path
from uuid import UUID

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

_FONTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "fonts"
_DEJAVUSans_TTF = _FONTS_DIR / "DejaVuSans.ttf"
_DEJAVUSans_BOLD_TTF = _FONTS_DIR / "DejaVuSans-Bold.ttf"
_SYSTEM_ARIAL = Path("C:/Windows/Fonts/arial.ttf")
_SYSTEM_ARIAL_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")

_font_registered = False


def _register_fonts() -> None:
    global _font_registered  # noqa: PLW0603
    if _font_registered:
        return

    if _DEJAVUSans_TTF.is_file():
        pdfmetrics.registerFont(TTFont("CyrFont", str(_DEJAVUSans_TTF)))
        if _DEJAVUSans_BOLD_TTF.is_file():
            pdfmetrics.registerFont(TTFont("CyrFontBold", str(_DEJAVUSans_BOLD_TTF)))
        else:
            pdfmetrics.registerFont(TTFont("CyrFontBold", str(_DEJAVUSans_TTF)))
    elif _SYSTEM_ARIAL.is_file():
        pdfmetrics.registerFont(TTFont("CyrFont", str(_SYSTEM_ARIAL)))
        if _SYSTEM_ARIAL_BOLD.is_file():
            pdfmetrics.registerFont(TTFont("CyrFontBold", str(_SYSTEM_ARIAL_BOLD)))
        else:
            pdfmetrics.registerFont(TTFont("CyrFontBold", str(_SYSTEM_ARIAL)))
    else:
        raise RuntimeError(
            "No TTF font with Cyrillic support found. "
            "Place DejaVuSans.ttf in backend/fonts/ or use a system with Arial installed."
        )

    _font_registered = True


def generate_certificate_pdf(
    student_name: str,
    course_name: str,
    date_issued: str,
    cert_id: UUID,
) -> bytes:
    """Generate a minimalist A4-landscape certificate PDF in memory.

    Returns raw bytes ready for S3 upload.
    """
    _register_fonts()

    buf = io.BytesIO()
    w, h = landscape(A4)
    c = canvas.Canvas(buf, pagesize=landscape(A4))

    # --- border ---
    margin = 15 * mm
    c.setStrokeColorRGB(0.15, 0.15, 0.15)
    c.setLineWidth(1.5)
    c.rect(margin, margin, w - 2 * margin, h - 2 * margin)

    # inner decorative line
    inner = 18 * mm
    c.setLineWidth(0.4)
    c.rect(inner, inner, w - 2 * inner, h - 2 * inner)

    # --- title ---
    mid_x = w / 2
    c.setFont("CyrFontBold", 28)
    c.setFillColorRGB(0.12, 0.12, 0.12)
    c.drawCentredString(mid_x, h - 55 * mm, "СЕРТИФИКАТ")

    c.setFont("CyrFont", 13)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawCentredString(mid_x, h - 65 * mm, "об успешном завершении курса")

    # --- student name ---
    c.setFont("CyrFontBold", 22)
    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.drawCentredString(mid_x, h - 90 * mm, student_name)

    # --- course name ---
    c.setFont("CyrFont", 15)
    c.setFillColorRGB(0.2, 0.2, 0.2)

    max_text_width = w - 60 * mm
    words = course_name.split()
    lines: list[str] = []
    current_line = ""
    for word in words:
        test = f"{current_line} {word}".strip()
        if pdfmetrics.stringWidth(test, "CyrFont", 15) <= max_text_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    y_course = h - 105 * mm
    for line in lines:
        c.drawCentredString(mid_x, y_course, line)
        y_course -= 20

    # --- separator ---
    sep_y = h - 120 * mm
    c.setStrokeColorRGB(0.5, 0.5, 0.5)
    c.setLineWidth(0.5)
    line_half = 50 * mm
    c.line(mid_x - line_half, sep_y, mid_x + line_half, sep_y)

    # --- date ---
    c.setFont("CyrFont", 11)
    c.setFillColorRGB(0.3, 0.3, 0.3)
    c.drawCentredString(mid_x, 42 * mm, f"Дата выдачи: {date_issued}")

    # --- certificate id (footer) ---
    c.setFont("CyrFont", 8)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawCentredString(mid_x, 30 * mm, f"№ {cert_id}")

    c.save()
    return buf.getvalue()
