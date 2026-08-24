"""CSRF protection for cookie-authenticated state-changing requests."""

from __future__ import annotations

import hmac
import secrets
from hashlib import sha256

CSRF_COOKIE = "h6400_csrf"
CSRF_HEADER = "x-csrf-token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def tokens_match(expected: str | None, provided: str | None) -> bool:
    if not expected or not provided:
        return False
    return hmac.compare_digest(expected, provided)


def bind_csrf(session_id: str, csrf: str, host_secret: bytes) -> str:
    digest = hmac.new(host_secret, f"{session_id}:{csrf}".encode(), sha256).hexdigest()
    return digest
