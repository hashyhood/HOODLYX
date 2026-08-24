"""PIN helpers for the four-digit television pairing code."""

from __future__ import annotations

import re

from app.samsung.errors import InvalidPinError

_PIN = re.compile(r"^\d{4}$")


def validate_pin(pin: str) -> str:
    text = (pin or "").strip()
    if not _PIN.fullmatch(text):
        raise InvalidPinError("PIN must be exactly four digits.")
    return text
