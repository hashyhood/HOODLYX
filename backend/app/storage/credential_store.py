"""Sensitive pairing credentials. Windows Credential Manager via keyring.

Never writes token/session ID to JSON config, logs, diagnostics, or the frontend.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import keyring
from cryptography.fernet import Fernet, InvalidToken

from app.samsung.models import PairingCredentials
from app.security.redact import mask_secret
from app.security.secrets import (
    KEYRING_HOST_SECRET,
    KEYRING_SERVICE,
    generate_host_secret,
    write_restricted_file,
)

LOGGER = logging.getLogger(__name__)
CREDENTIAL_USERNAME = "ua55h6400-encrypted"


def _keyring_enabled() -> bool:
    return sys.platform == "win32"


class CredentialStore:
    def __init__(self, data_dir: Path) -> None:
        self._data_dir = data_dir
        self._fallback = data_dir / "credentials.bin"
        self._secret_file = data_dir / "host.key"
        self._host_secret = self._load_or_create_host_secret()

    @property
    def host_secret(self) -> bytes:
        return self._host_secret

    def _load_or_create_host_secret(self) -> bytes:
        if _keyring_enabled():
            try:
                existing = keyring.get_password(KEYRING_SERVICE, KEYRING_HOST_SECRET)
                if existing:
                    return bytes.fromhex(existing)
            except Exception:
                existing = None
        if self._secret_file.exists():
            return self._secret_file.read_bytes()
        secret = generate_host_secret()
        if _keyring_enabled():
            try:
                keyring.set_password(KEYRING_SERVICE, KEYRING_HOST_SECRET, secret.hex())
                return secret
            except Exception:
                LOGGER.info("Keyring unavailable; using a restricted local host-secret file")
        else:
            LOGGER.info("Non-Windows host; storing host secret in a 0600 encrypted-key file")
        write_restricted_file(self._secret_file, secret)
        return secret

    def _fernet(self) -> Fernet:
        import base64
        import hashlib

        digest = hashlib.sha256(self._host_secret).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    def save(self, credentials: PairingCredentials) -> None:
        payload = json.dumps({"token": credentials.token, "session_id": credentials.session_id})
        if _keyring_enabled():
            try:
                keyring.set_password(KEYRING_SERVICE, CREDENTIAL_USERNAME, payload)
                LOGGER.info(
                    "Stored pairing credentials in OS keyring (token=%s session=%s)",
                    mask_secret(credentials.token),
                    mask_secret(credentials.session_id),
                )
                return
            except Exception:
                LOGGER.info("OS keyring write failed; using encrypted fallback file")
        token = self._fernet().encrypt(payload.encode("utf-8"))
        write_restricted_file(self._fallback, token)

    def load(self) -> PairingCredentials | None:
        raw = None
        if _keyring_enabled():
            try:
                raw = keyring.get_password(KEYRING_SERVICE, CREDENTIAL_USERNAME)
            except Exception:
                raw = None
        if raw:
            data = json.loads(raw)
            return PairingCredentials(token=data["token"], session_id=data["session_id"])
        if self._fallback.exists():
            try:
                decrypted = self._fernet().decrypt(self._fallback.read_bytes())
            except InvalidToken:
                LOGGER.info("Encrypted credential file could not be decrypted")
                return None
            data = json.loads(decrypted.decode("utf-8"))
            return PairingCredentials(token=data["token"], session_id=data["session_id"])
        return None

    def delete(self) -> None:
        if _keyring_enabled():
            try:
                keyring.delete_password(KEYRING_SERVICE, CREDENTIAL_USERNAME)
            except Exception:
                pass
        if self._fallback.exists():
            self._fallback.unlink()
        LOGGER.info("Pairing credentials removed")

    def present(self) -> bool:
        return self.load() is not None
