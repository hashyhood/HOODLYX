"""Device configuration stored under the application data directory."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from app.config import TV_MODEL
from app.samsung.models import DeviceRecord, utcnow
from app.security.local_ip import parse_port, require_private_tv_host


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


class DeviceStore:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> DeviceRecord | None:
        if not self._path.exists():
            return None
        data = json.loads(self._path.read_text(encoding="utf-8"))
        return DeviceRecord(
            host=data["host"],
            display_name=data.get("display_name") or "Living Room TV",
            model=data.get("model") or TV_MODEL,
            auth_port=int(data.get("auth_port") or 8080),
            remote_port=int(data.get("remote_port") or 8000),
            last_connected_at=_parse_dt(data.get("last_connected_at")),
            credentials_valid=bool(data.get("credentials_valid")),
            software_version=data.get("software_version"),
            notes=data.get("notes") or {},
        )

    def save(self, device: DeviceRecord) -> None:
        require_private_tv_host(device.host)
        parse_port(device.auth_port)
        parse_port(device.remote_port)
        payload: dict[str, Any] = {
            "host": device.host,
            "display_name": device.display_name,
            "model": device.model,
            "auth_port": device.auth_port,
            "remote_port": device.remote_port,
            "last_connected_at": device.last_connected_at.isoformat() if device.last_connected_at else None,
            "credentials_valid": device.credentials_valid,
            "software_version": device.software_version,
            "notes": device.notes,
        }
        self._path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def clear(self) -> None:
        if self._path.exists():
            self._path.unlink()

    def mark_connected(self, device: DeviceRecord) -> DeviceRecord:
        device.last_connected_at = utcnow()
        device.credentials_valid = True
        self.save(device)
        return device

    def mark_invalid(self, device: DeviceRecord) -> DeviceRecord:
        device.credentials_valid = False
        self.save(device)
        return device
