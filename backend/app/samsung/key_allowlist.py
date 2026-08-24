"""Production remote-key allowlist. Arbitrary Samsung strings are rejected."""

from __future__ import annotations

from enum import StrEnum

from app.samsung.errors import DangerousKeyRejected


class AllowedKey(StrEnum):
    KEY_UP = "KEY_UP"
    KEY_DOWN = "KEY_DOWN"
    KEY_LEFT = "KEY_LEFT"
    KEY_RIGHT = "KEY_RIGHT"
    KEY_ENTER = "KEY_ENTER"
    KEY_RETURN = "KEY_RETURN"
    KEY_EXIT = "KEY_EXIT"
    KEY_CONTENTS = "KEY_CONTENTS"
    KEY_MENU = "KEY_MENU"
    KEY_SOURCE = "KEY_SOURCE"
    KEY_GUIDE = "KEY_GUIDE"
    KEY_INFO = "KEY_INFO"
    KEY_TOOLS = "KEY_TOOLS"
    KEY_VOLUP = "KEY_VOLUP"
    KEY_VOLDOWN = "KEY_VOLDOWN"
    KEY_MUTE = "KEY_MUTE"
    KEY_CHUP = "KEY_CHUP"
    KEY_CHDOWN = "KEY_CHDOWN"
    KEY_CH_LIST = "KEY_CH_LIST"
    KEY_PRECH = "KEY_PRECH"
    KEY_0 = "KEY_0"
    KEY_1 = "KEY_1"
    KEY_2 = "KEY_2"
    KEY_3 = "KEY_3"
    KEY_4 = "KEY_4"
    KEY_5 = "KEY_5"
    KEY_6 = "KEY_6"
    KEY_7 = "KEY_7"
    KEY_8 = "KEY_8"
    KEY_9 = "KEY_9"
    KEY_PLAY = "KEY_PLAY"
    KEY_PAUSE = "KEY_PAUSE"
    KEY_STOP = "KEY_STOP"
    KEY_REWIND = "KEY_REWIND"
    KEY_FF = "KEY_FF"
    KEY_RECORD = "KEY_RECORD"
    KEY_RED = "KEY_RED"
    KEY_GREEN = "KEY_GREEN"
    KEY_YELLOW = "KEY_YELLOW"
    KEY_BLUE = "KEY_BLUE"
    KEY_POWEROFF = "KEY_POWEROFF"


FORBIDDEN_KEY_PATTERNS = (
    "FACTORY",
    "SERVICE",
    "HOTEL",
    "CALIBR",
    "EEPROM",
    "RESET",
    "PANEL",
    "DEBUG",
    "TESTPATTERN",
    "WHEEL",
    "DTV",
    "AD",
    "SUBTITLE",
)

# Explicitly never allowed, even if they look like normal keys.
DENIED_KEYS = frozenset(
    {
        "KEY_HOME",  # not the Smart Hub key on this 2014 H-series set
        "KEY_POWERON",
        "KEY_POWER",  # do not imply network power-on
        "KEY_FACTORY",
        "KEY_SVC",
        "KEY_SERVICE",
    }
)

REPEATABLE_KEYS = frozenset(
    {
        AllowedKey.KEY_VOLUP,
        AllowedKey.KEY_VOLDOWN,
        AllowedKey.KEY_CHUP,
        AllowedKey.KEY_CHDOWN,
        AllowedKey.KEY_UP,
        AllowedKey.KEY_DOWN,
        AllowedKey.KEY_LEFT,
        AllowedKey.KEY_RIGHT,
        AllowedKey.KEY_REWIND,
        AllowedKey.KEY_FF,
    }
)


def is_forbidden_raw(key: str) -> bool:
    upper = key.upper()
    if upper in DENIED_KEYS:
        return True
    return any(part in upper for part in FORBIDDEN_KEY_PATTERNS)


def parse_allowed_key(value: str) -> AllowedKey:
    if not value or not isinstance(value, str):
        raise DangerousKeyRejected(str(value))
    candidate = value.strip().upper()
    if is_forbidden_raw(candidate) or candidate in DENIED_KEYS:
        raise DangerousKeyRejected(candidate)
    try:
        return AllowedKey(candidate)
    except ValueError as exc:
        raise DangerousKeyRejected(candidate) from exc


def samsung_key_name(key: AllowedKey) -> str:
    return key.value
