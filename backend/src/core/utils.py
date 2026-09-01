import json
from typing import Any


def parse_cors(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(i).strip() for i in value if i]

    if isinstance(value, str):
        value = value.strip()
        if not value:
            return []

        if value.startswith("[") and value.endswith("]"):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(i).strip() for i in parsed if i]
            except json.JSONDecodeError:
                pass

        return [i.strip() for i in value.split(",") if i.strip()]

    raise ValueError(f"Cannot parse CORS origins from value: {value}")
