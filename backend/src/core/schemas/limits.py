"""Shared validation limits for Pydantic schemas.

Request schemas use the strict business limits; response/internal schemas
use the safe upper bounds so reads of legacy rows never fail.
"""

from typing import Annotated

from pydantic import AfterValidator

# Titles (matches DB str_128 columns)
TITLE_MIN = 1
TITLE_MAX = 128

# Descriptions (business limit on requests)
DESCRIPTION_MAX = 300

# Free-text safe upper bound for Text columns on responses
TEXT_SAFE_MAX = 100_000

# Long text blocks (rich HTML / code)
CODE_MAX = 100_000
RICH_TEXT_MAX = 50_000

# Auth
PASSWORD_MIN = 6
PASSWORD_MAX = 128
USERNAME_MIN = 3
USERNAME_MAX = 128
TOKEN_MAX = 2_048
JWT_MAX = 4_096
EMAIL_MAX = 254

# Price (kopeks): free (0) or paid within [PRICE_MIN_PAID_KOPEKS, PRICE_MAX_KOPEKS]
PRICE_MIN_PAID_KOPEKS = 5_000
PRICE_MAX_KOPEKS = 10_000_000

# Price (rubles, human-readable bounds for error messages)
PRICE_MIN_PAID_RUB = 50
PRICE_MAX_RUB = 100_000

# Quiz / code payload
QUIZ_OPTIONS_MIN = 2
QUIZ_OPTIONS_MAX = 10
TEST_CASES_MAX = 20
LANGUAGE_MAX = 32
ALT_TEXT_MAX = 255

# Misc
URL_MAX = 2_048
IMAGE_NAME_MAX = 255
QUIZ_OPTION_MAX = 500


def validate_price_kopeks(value: int) -> int:
    """Course price rule: free (0) or paid in [50..100_000] rubles (kopeks in DB).

    Raises ValueError with a Russian message so FastAPI 422 `detail` is
    directly usable by the frontend.
    """
    if value == 0:
        return value
    if value < PRICE_MIN_PAID_KOPEKS or value > PRICE_MAX_KOPEKS:
        raise ValueError(
            f"Цена должна быть 0 или от {PRICE_MIN_PAID_RUB} до "
            f"{PRICE_MAX_RUB} руб."
        )
    return value


# Reusable annotated price type for request schemas (kopeks in the DB)
PriceKopeks = Annotated[int, AfterValidator(validate_price_kopeks)]
