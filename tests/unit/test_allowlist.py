import pytest

from app.samsung.errors import DangerousKeyRejected
from app.samsung.key_allowlist import AllowedKey, parse_allowed_key


def test_allowlist_contains_required_keys():
    for key in (
        "KEY_CONTENTS",
        "KEY_RETURN",
        "KEY_POWEROFF",
        "KEY_VOLUP",
        "KEY_VOLDOWN",
        "KEY_MUTE",
        "KEY_UP",
        "KEY_ENTER",
    ):
        assert parse_allowed_key(key) is AllowedKey(key)


def test_dangerous_and_raw_keys_rejected():
    for key in (
        "KEY_FACTORY",
        "KEY_SERVICE",
        "KEY_HOME",
        "KEY_POWERON",
        "KEY_POWER",
        "KEY_EEPROM",
        "anything",
        "KEY_HOTEL",
    ):
        with pytest.raises(DangerousKeyRejected):
            parse_allowed_key(key)
