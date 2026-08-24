"""Protocol-level models. Sensitive values are never logged in full."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from app.security.redact import mask_secret


class ConnectionStatus(StrEnum):
    DISCONNECTED = "Disconnected"
    TESTING = "Testing"
    WAITING_FOR_PIN = "Waiting for PIN"
    PAIRING = "Pairing"
    CONNECTED = "Connected"
    SENDING_COMMAND = "Sending command"
    RECONNECTING = "Reconnecting"
    TV_OFFLINE = "TV offline"
    CREDENTIALS_REJECTED = "Credentials rejected"
    ERROR = "Error"


@dataclass(slots=True)
class PairingCredentials:
    token: str
    session_id: str

    def redacted(self) -> dict[str, str]:
        return {
            "token": mask_secret(self.token),
            "session_id": mask_secret(self.session_id),
        }


@dataclass(slots=True)
class ConnectionHealth:
    status: ConnectionStatus
    connected: bool
    last_key: str | None = None
    last_error: str | None = None
    queue_length: int = 0
    last_connected_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status.value,
            "connected": self.connected,
            "last_key": self.last_key,
            "last_error": self.last_error,
            "queue_length": self.queue_length,
            "last_connected_at": self.last_connected_at.isoformat() if self.last_connected_at else None,
        }


@dataclass(slots=True)
class DeviceRecord:
    host: str
    display_name: str
    model: str
    auth_port: int
    remote_port: int
    last_connected_at: datetime | None = None
    credentials_valid: bool = False
    software_version: str | None = None
    notes: dict[str, Any] = field(default_factory=dict)

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "host": self.host,
            "display_name": self.display_name,
            "model": self.model,
            "auth_port": self.auth_port,
            "remote_port": self.remote_port,
            "last_connected_at": self.last_connected_at.isoformat() if self.last_connected_at else None,
            "credentials_valid": self.credentials_valid,
            "credential_present": self.credentials_valid,
            "software_version": self.software_version,
        }


def utcnow() -> datetime:
    return datetime.now(UTC)
