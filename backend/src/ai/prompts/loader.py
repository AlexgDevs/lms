"""Prompt loader — renders ``.txt`` templates from the prompts directory.

Templates use ``string.Template`` syntax (``$name`` / ``${name}``). Every
template must be provided with all its placeholders.
"""

from pathlib import Path
from string import Template

_GENERATE_DIR = Path(__file__).parent / "generate"
_RULES_DIR = _GENERATE_DIR / "rules"


def render(name: str, **kwargs: object) -> str:
    """Render ``generate/{name}.txt`` with the given keyword arguments."""
    path = _GENERATE_DIR / f"{name}.txt"
    return Template(path.read_text(encoding="utf-8")).substitute(**kwargs)


def render_rules(block_type: str, **kwargs: object) -> str:
    """Render ``generate/rules/{block_type}.txt`` with the given arguments."""
    path = _RULES_DIR / f"{block_type}.txt"
    return Template(path.read_text(encoding="utf-8")).substitute(**kwargs)
