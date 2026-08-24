"""Real Samsung H-series / Orsay encrypted remote adapter.

Uses samsungtvws encrypted v1 (HTTP pairing on the auth port, encrypted
remote on the remote port). Never falls back to Tizen ports 8001/8002.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

import aiohttp
from samsungtvws.encrypted.authenticator import SamsungTVEncryptedWSAsyncAuthenticator
from samsungtvws.encrypted.remote import SamsungTVEncryptedWSAsyncRemote, SendRemoteKey
from samsungtvws.exceptions import ConnectionFailure, UnauthorizedError

from app.samsung.errors import (
    CredentialsRejected,
    InvalidPinError,
    PairingRejected,
    PortTimeout,
    ProbeFailureKind,
    ProtocolError,
    RemoteError,
)
from app.samsung.models import ConnectionHealth, ConnectionStatus, PairingCredentials
from app.samsung.pairing import validate_pin
from app.samsung.reachability import check_tcp_port, raise_for_port
from app.security.redact import mask_secret

LOGGER = logging.getLogger(__name__)

HTTP_TIMEOUT = aiohttp.ClientTimeout(total=12, connect=3, sock_read=8)
REMOTE_TIMEOUT = 8.0


class HSeriesEncryptedRemote:
    """Production adapter for Samsung UA55H6400 (H6400 / 2014 Orsay)."""

    def __init__(
        self,
        host: str,
        *,
        auth_port: int = 8080,
        remote_port: int = 8000,
        token: str | None = None,
        session_id: str | None = None,
        web_session: aiohttp.ClientSession | None = None,
        key_press_delay: float = 0.0,
    ) -> None:
        self._host = host
        self._auth_port = auth_port
        self._remote_port = remote_port
        self._token = token
        self._session_id = session_id
        self._external_session = web_session
        self._session: aiohttp.ClientSession | None = web_session
        self._authenticator: SamsungTVEncryptedWSAsyncAuthenticator | None = None
        self._remote: SamsungTVEncryptedWSAsyncRemote | None = None
        self._key_press_delay = key_press_delay
        self._status = ConnectionStatus.DISCONNECTED
        self._last_key: str | None = None
        self._last_error: str | None = None
        self._last_connected_at: datetime | None = None
        self._owns_session = web_session is None

    @property
    def host(self) -> str:
        return self._host

    @property
    def auth_port(self) -> int:
        return self._auth_port

    @property
    def remote_port(self) -> int:
        return self._remote_port

    @property
    def has_credentials(self) -> bool:
        return bool(self._token and self._session_id)

    def load_credentials(self, token: str, session_id: str) -> None:
        self._token = token
        self._session_id = session_id

    def clear_credentials(self) -> None:
        self._token = None
        self._session_id = None

    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=HTTP_TIMEOUT)
            self._owns_session = True
        return self._session

    async def start_pairing(self) -> None:
        self._status = ConnectionStatus.TESTING
        auth_check = await check_tcp_port(self._host, self._auth_port, timeout_s=2.0)
        raise_for_port(auth_check)
        session = await self._ensure_session()
        self._authenticator = SamsungTVEncryptedWSAsyncAuthenticator(
            host=self._host,
            web_session=session,
            port=self._auth_port,
            timeout=REMOTE_TIMEOUT,
        )
        try:
            await asyncio.wait_for(self._authenticator.start_pairing(), timeout=12)
        except TimeoutError as exc:
            self._status = ConnectionStatus.ERROR
            raise PairingRejected(
                "Timed out while asking the television to display a pairing PIN."
            ) from exc
        except aiohttp.ClientError as exc:
            self._status = ConnectionStatus.ERROR
            raise PairingRejected(f"Pairing HTTP request failed: {exc}") from exc
        self._status = ConnectionStatus.WAITING_FOR_PIN
        LOGGER.info("Pairing started for %s — look at the television for a four-digit PIN", self._host)

    async def confirm_pin(self, pin: str) -> PairingCredentials:
        pin = validate_pin(pin)
        if self._authenticator is None:
            raise PairingRejected("Pairing has not been started.")
        self._status = ConnectionStatus.PAIRING
        try:
            token = await asyncio.wait_for(self._authenticator.try_pin(pin), timeout=12)
        except TimeoutError as exc:
            self._status = ConnectionStatus.ERROR
            raise InvalidPinError("Timed out while validating the PIN.") from exc
        except aiohttp.ClientError as exc:
            self._status = ConnectionStatus.ERROR
            raise ProtocolError(f"PIN validation request failed: {exc}") from exc
        if not token:
            self._status = ConnectionStatus.WAITING_FOR_PIN
            raise InvalidPinError("The PIN was rejected or pairing did not complete.")
        try:
            session_id = await asyncio.wait_for(
                self._authenticator.get_session_id_and_close(), timeout=12
            )
        except TimeoutError as exc:
            self._status = ConnectionStatus.ERROR
            raise ProtocolError("Timed out waiting for a session ID after PIN acceptance.") from exc
        except Exception as exc:  # samsungtvws raises bare Exception on ack failure
            self._status = ConnectionStatus.ERROR
            raise ProtocolError(f"Failed to obtain session ID: {exc}") from exc
        if not session_id:
            self._status = ConnectionStatus.ERROR
            raise ProtocolError("Token received but the television did not return a session ID.")
        self._token = token
        self._session_id = session_id
        self._authenticator = None
        LOGGER.info(
            "Pairing succeeded for %s (token=%s session=%s)",
            self._host,
            mask_secret(token),
            mask_secret(session_id),
        )
        return PairingCredentials(token=token, session_id=session_id)

    async def connect(self) -> None:
        if not self._token or not self._session_id:
            raise CredentialsRejected()
        self._status = ConnectionStatus.RECONNECTING
        remote_check = await check_tcp_port(self._host, self._remote_port, timeout_s=2.0)
        raise_for_port(remote_check)
        await self.disconnect()
        session = await self._ensure_session()
        self._remote = SamsungTVEncryptedWSAsyncRemote(
            host=self._host,
            web_session=session,
            token=self._token,
            session_id=self._session_id,
            port=self._remote_port,
            timeout=REMOTE_TIMEOUT,
            key_press_delay=self._key_press_delay,
        )
        try:
            await asyncio.wait_for(self._remote.start_listening(), timeout=12)
        except UnauthorizedError as exc:
            self._status = ConnectionStatus.CREDENTIALS_REJECTED
            LOGGER.info("Encrypted remote rejected credentials: %s", exc)
            raise CredentialsRejected() from exc
        except TimeoutError as exc:
            self._status = ConnectionStatus.TV_OFFLINE
            LOGGER.info("Encrypted remote connect timed out: %s", exc)
            raise PortTimeout(self._host, self._remote_port) from exc
        except (ConnectionFailure, aiohttp.ClientError, OSError) as exc:
            self._status = ConnectionStatus.TV_OFFLINE
            LOGGER.info("Encrypted remote connect failed: %s", exc)
            raise RemoteError(
                f"Could not open the encrypted remote session on {self._host}:{self._remote_port}.",
                kind=ProbeFailureKind.TV_OFFLINE,
                likely_cause="TV offline, sleeping, or port 8000 did not complete the encrypted handshake.",
                retryable=True,
            ) from exc
        if not self._remote.is_alive():
            self._status = ConnectionStatus.TV_OFFLINE
            raise RemoteError(
                f"Encrypted remote session to {self._host}:{self._remote_port} is not alive.",
                kind=ProbeFailureKind.TV_OFFLINE,
                likely_cause="The socket opened then dropped. Confirm the TV is awake on the same LAN.",
                retryable=True,
            )
        self._status = ConnectionStatus.CONNECTED
        self._last_connected_at = datetime.now(UTC)
        self._last_error = None
        LOGGER.info("Encrypted remote connected to %s:%s", self._host, self._remote_port)

    async def send_key(self, key: str) -> None:
        if self._remote is None or not self._remote.is_alive():
            await self.connect()
        assert self._remote is not None
        self._status = ConnectionStatus.SENDING_COMMAND
        try:
            await asyncio.wait_for(
                self._remote.send_command(SendRemoteKey.click(key), key_press_delay=0.0),
                timeout=8,
            )
        except (TimeoutError, ConnectionFailure, OSError, aiohttp.ClientError) as exc:
            self._status = ConnectionStatus.ERROR
            self._last_error = str(exc)
            raise ProtocolError(f"Failed to send {key}: {exc}") from exc
        self._last_key = key
        self._status = ConnectionStatus.CONNECTED

    async def disconnect(self) -> None:
        remote = self._remote
        self._remote = None
        if remote is not None:
            try:
                await asyncio.wait_for(remote.close(), timeout=3)
            except Exception:
                LOGGER.debug("Remote close raised; continuing shutdown", exc_info=True)
        self._status = ConnectionStatus.DISCONNECTED

    async def aclose(self) -> None:
        await self.disconnect()
        if self._owns_session and self._session and not self._session.closed:
            await self._session.close()
        self._session = self._external_session
        self._authenticator = None

    async def health(self) -> ConnectionHealth:
        connected = bool(self._remote is not None and self._remote.is_alive())
        status = self._status if connected or self._status != ConnectionStatus.CONNECTED else ConnectionStatus.DISCONNECTED
        return ConnectionHealth(
            status=status,
            connected=connected,
            last_key=self._last_key,
            last_error=self._last_error,
            last_connected_at=self._last_connected_at,
        )

    def diagnostics(self) -> dict[str, Any]:
        return {
            "host": self._host,
            "auth_port": self._auth_port,
            "remote_port": self._remote_port,
            "protocol": "H-Series Encrypted v1",
            "credential_present": bool(self._token),
            "session_id_present": bool(self._session_id),
            "status": self._status.value,
            "last_key": self._last_key,
            "last_error": self._last_error,
        }
