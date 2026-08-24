"""Never print tokens, session IDs, cookies, or phone secrets in full."""

from __future__ import annotations

import logging
import re
from typing import Any

_HEX_SECRET = re.compile(r"\b[0-9a-fA-F]{24,}\b")
_SENSITIVE_KEYS = {
    "token",
    "session_id",
    "sessionid",
    "ctx",
    "cookie",
    "authorization",
    "pairing_code",
    "pairingcode",
    "secret",
    "host_secret",
    "phone_secret",
    "csrf",
    "set-cookie",
    "encryption_context",
}


def mask_secret(value: str | None, *, visible: int = 4) -> str:
    if not value:
        return "(absent)"
    if len(value) <= visible * 2:
        return "••••"
    return f"{value[:visible]}…{value[-visible:]} (len={len(value)})"


def redact_text(text: str) -> str:
    return _HEX_SECRET.sub(lambda m: mask_secret(m.group(0)), text)


def redact_mapping(data: dict[str, Any]) -> dict[str, Any]:
    redacted: dict[str, Any] = {}
    for key, value in data.items():
        lowered = key.lower().replace("-", "_")
        if lowered in _SENSITIVE_KEYS or "secret" in lowered or "token" in lowered:
            redacted[key] = mask_secret(str(value) if value is not None else None)
        elif isinstance(value, dict):
            redacted[key] = redact_mapping(value)
        elif isinstance(value, str):
            redacted[key] = redact_text(value)
        else:
            redacted[key] = value
    return redacted


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = redact_text(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = redact_mapping(record.args)
            else:
                record.args = tuple(
                    redact_text(arg) if isinstance(arg, str) else arg for arg in record.args
                )
        return True


def install_redacting_logger() -> None:
    manager = logging.root.manager
    for logger in [logging.getLogger(), *[logging.getLogger(name) for name in manager.loggerDict]]:
        if not any(isinstance(existing, RedactingFilter) for existing in logger.filters):
            logger.addFilter(RedactingFilter())
    logging.getLogger("samsungtvws").addFilter(RedactingFilter())
