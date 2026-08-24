import logging

import pytest

from app.samsung.errors import InvalidPinError
from app.samsung.pairing import validate_pin
from app.security.redact import RedactingFilter, mask_secret, redact_mapping, redact_text


def test_pin_must_be_four_digits():
    assert validate_pin("1234") == "1234"
    with pytest.raises(InvalidPinError):
        validate_pin("12")
    with pytest.raises(InvalidPinError):
        validate_pin("12345")
    with pytest.raises(InvalidPinError):
        validate_pin("12ab")
    with pytest.raises(InvalidPinError):
        validate_pin("")


def test_mask_secret_never_prints_full_value():
    secret = "a" * 40
    masked = mask_secret(secret)
    assert secret not in masked
    assert "len=40" in masked


def test_redact_mapping_and_logs():
    payload = {"token": "abcdef1234567890abcdef1234567890", "host": "192.168.1.50"}
    redacted = redact_mapping(payload)
    assert "abcdef1234567890abcdef1234567890" not in str(redacted)
    text = redact_text("token=abcdef1234567890abcdef1234567890")
    assert "abcdef1234567890abcdef1234567890" not in text
    record = logging.LogRecord("t", logging.INFO, __file__, 1, "token=%s", ("ff" * 20,), None)
    assert RedactingFilter().filter(record) is True
    assert "ff" * 20 not in record.getMessage()
