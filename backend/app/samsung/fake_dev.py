"""Developer-only fake adapter. Never used when the app is frozen/packaged."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from app.samsung.errors import CredentialsRejected, InvalidPinError, ProtocolError
from app.samsung.models import ConnectionHealth, ConnectionStatus, PairingCredentials
from app.samsung.pairing import validate_pin


class FakeHSeriesRemote:
    """Explicit developer/test double. Production packaging must not instantiate this."""

    def __init__(
        self,
        host: str,
        *,
        auth_port: int = 8080,
        remote_port: int = 8000,
        token: str | None = None,
        session_id: str | None = None,
        fail_pin: bool = False,
        fail_session: bool = False,
        fail_connect: bool = False,
        fail_command: bool = False,
        drop_mid_command: bool = False,
        pairing_timeout: bool = False,
        **_kwargs: object,
    ) -> None:
        self.host = host
        self.auth_port = auth_port
        self.remote_port = remote_port
        self._token = token
        self._session_id = session_id
        self._fail_pin = fail_pin
        self._fail_session = fail_session
        self._fail_connect = fail_connect
        self._fail_command = fail_command
        self._drop_mid_command = drop_mid_command
        self._pairing_timeout = pairing_timeout
        self._paired = False
        self._connected = False
        self.sent: list[str] = []
        self._status = ConnectionStatus.DISCONNECTED
        self._last_key: str | None = None

    async def start_pairing(self) -> None:
        if self._pairing_timeout:
            raise TimeoutError("pairing timeout")
        self._status = ConnectionStatus.WAITING_FOR_PIN

    async def confirm_pin(self, pin: str) -> PairingCredentials:
        validate_pin(pin)
        if self._fail_pin or pin == "0000":
            raise InvalidPinError()
        if self._fail_session:
            raise ProtocolError("Token received but the television did not return a session ID.")
        self._token = "fake-token-not-for-production"
        self._session_id = "1"
        self._paired = True
        return PairingCredentials(token=self._token, session_id=self._session_id)

    async def connect(self) -> None:
        if self._fail_connect or not (self._token and self._session_id):
            raise CredentialsRejected()
        self._connected = True
        self._status = ConnectionStatus.CONNECTED

    async def send_key(self, key: str) -> None:
        if self._drop_mid_command:
            self._connected = False
            raise ConnectionError("TV disconnected mid-command")
        if self._fail_command or not self._connected:
            raise ConnectionError("command failed")
        self.sent.append(key)
        self._last_key = key
        await asyncio.sleep(0)

    async def disconnect(self) -> None:
        self._connected = False
        self._status = ConnectionStatus.DISCONNECTED

    async def health(self) -> ConnectionHealth:
        return ConnectionHealth(
            status=self._status,
            connected=self._connected,
            last_key=self._last_key,
            last_connected_at=datetime.now(UTC) if self._connected else None,
        )
