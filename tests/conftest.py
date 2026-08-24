"""Pytest configuration. Force a non-blocking keyring backend in CI."""

from __future__ import annotations

import os

os.environ.setdefault("PYTHON_KEYRING_BACKEND", "keyring.backends.fail.Keyring")
