import re


def parse_device_name(user_agent: str | None) -> str | None:
    """Parse a human-readable device name from a User-Agent string.

    Returns something like "Chrome on Windows", "Safari on macOS", "Firefox on Linux".
    Returns None if user_agent is None or unparseable.
    """
    if not user_agent:
        return None

    browser = _parse_browser(user_agent)
    os_name = _parse_os(user_agent)

    if browser and os_name:
        return f"{browser} on {os_name}"
    if browser:
        return browser
    if os_name:
        return os_name
    return None


def _parse_browser(ua: str) -> str | None:
    if "Edg/" in ua:
        return "Edge"
    if "Chrome/" in ua and "Safari/" in ua:
        return "Chrome"
    if "Firefox/" in ua:
        return "Firefox"
    if "Safari/" in ua and "Chrome/" not in ua:
        return "Safari"
    if "Opera/" in ua or "OPR/" in ua:
        return "Opera"
    if re.search(r"MSIE|Trident/", ua):
        return "Internet Explorer"
    return None


def _parse_os(ua: str) -> str | None:
    if "Windows" in ua:
        if "Windows NT 10" in ua:
            return "Windows"
        return "Windows"
    if "Mac OS X" in ua:
        return "macOS"
    if "Linux" in ua and "Android" not in ua:
        return "Linux"
    if "Android" in ua:
        version_match = re.search(r"Android (\d+)", ua)
        version = version_match.group(1) if version_match else ""
        return f"Android {version}".strip()
    if "iPhone" in ua or "iPad" in ua:
        version_match = re.search(r"OS (\d+_\d+)", ua)
        version = version_match.group(1).replace("_", ".") if version_match else ""
        return f"iOS {version}".strip()
    return None
