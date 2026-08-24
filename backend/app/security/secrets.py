"""Host secret material. At least 256 bits of cryptographic randomness."""

from __future__ import annotations

import os
from pathlib import Path

from app.config import APP_NAME
from app.security.redact import mask_secret

HOST_SECRET_BYTES = 32  # 256 bits
KEYRING_SERVICE = APP_NAME
KEYRING_HOST_SECRET = "host-secret"


def generate_host_secret() -> bytes:
    return os.urandom(HOST_SECRET_BYTES)


def secret_hex(secret: bytes) -> str:
    return secret.hex()


def describe_secret(secret: bytes) -> str:
    return f"{mask_secret(secret.hex())} bits={len(secret) * 8}"


def write_restricted_file(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
