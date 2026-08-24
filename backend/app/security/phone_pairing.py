"""Phone one-time pairing codes and local sessions."""

from __future__ import annotations

import hmac
import secrets
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256

from app.security.redact import mask_secret


def _utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class PhonePairingCode:
    code: str
    expires_at: float
    used: bool = False

    def expired(self, now: float | None = None) -> bool:
        return (now or time.monotonic()) >= self.expires_at

    def redacted(self) -> dict[str, str | bool]:
        return {"code": mask_secret(self.code), "used": self.used}


@dataclass(slots=True)
class PhoneSession:
    session_id: str
    created_at: datetime
    last_seen: datetime
    client_ip: str
    user_agent: str
    revoked: bool = False
    label: str = "Phone"

    def public_dict(self) -> dict[str, str | bool]:
        return {
            "session_id": mask_secret(self.session_id, visible=6),
            "created_at": self.created_at.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "client_ip": self.client_ip,
            "user_agent": self.user_agent[:80],
            "revoked": self.revoked,
            "label": self.label,
        }


class PhonePairingService:
    def __init__(self, *, ttl_seconds: int = 180, host_secret: bytes) -> None:
        self._ttl = ttl_seconds
        self._host_secret = host_secret
        self._codes: dict[str, PhonePairingCode] = {}
        self._sessions: dict[str, PhoneSession] = {}

    def issue_code(self) -> PhonePairingCode:
        self.purge()
        code = secrets.token_urlsafe(8).replace("-", "").replace("_", "")[:10].upper()
        record = PhonePairingCode(code=code, expires_at=time.monotonic() + self._ttl)
        self._codes[code] = record
        return record

    def redeem(self, code: str, *, client_ip: str, user_agent: str) -> PhoneSession:
        self.purge()
        record = self._codes.get(code.strip().upper())
        if record is None or record.used or record.expired():
            raise PermissionError("Pairing code is invalid, used, or expired.")
        record.used = True
        session_id = secrets.token_urlsafe(32)
        session = PhoneSession(
            session_id=session_id,
            created_at=_utcnow(),
            last_seen=_utcnow(),
            client_ip=client_ip,
            user_agent=user_agent,
            label="Phone",
        )
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> PhoneSession | None:
        session = self._sessions.get(session_id)
        if session is None or session.revoked:
            return None
        session.last_seen = _utcnow()
        return session

    def revoke_all(self) -> int:
        count = 0
        for session in self._sessions.values():
            if not session.revoked:
                session.revoked = True
                count += 1
        self._codes.clear()
        return count

    def list_sessions(self) -> list[dict[str, str | bool]]:
        return [item.public_dict() for item in self._sessions.values() if not item.revoked]

    def purge(self) -> None:
        now = time.monotonic()
        expired = [key for key, value in self._codes.items() if value.expired(now) or value.used]
        for key in expired:
            self._codes.pop(key, None)

    def cookie_value(self, session_id: str) -> str:
        mac = hmac.new(self._host_secret, session_id.encode(), sha256).hexdigest()
        return f"{session_id}.{mac}"

    def parse_cookie(self, value: str | None) -> str | None:
        if not value or "." not in value:
            return None
        session_id, mac = value.rsplit(".", 1)
        expected = hmac.new(self._host_secret, session_id.encode(), sha256).hexdigest()
        if not hmac.compare_digest(mac, expected):
            return None
        return session_id

    def active_count(self) -> int:
        return sum(1 for item in self._sessions.values() if not item.revoked)
