"""Orchestrates pairing, credentials, the encrypted remote, and the command queue."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from app.config import (
    APP_VERSION,
    DEFAULT_AUTH_PORT,
    DEFAULT_REMOTE_PORT,
    PROTOCOL_NAME,
    TV_MODEL,
    Settings,
)
from app.samsung.backoff import ExponentialBackoff
from app.samsung.command_queue import CommandQueue
from app.samsung.errors import (
    CredentialsRejected,
    DangerousKeyRejected,
    NotConfigured,
    NotPaired,
    RemoteError,
)
from app.samsung.h_series_encrypted import HSeriesEncryptedRemote
from app.samsung.key_allowlist import AllowedKey, parse_allowed_key, samsung_key_name
from app.samsung.models import ConnectionStatus, DeviceRecord
from app.samsung.protocol import TelevisionRemoteProtocol
from app.samsung.reachability import check_tcp_port
from app.security.local_ip import parse_port, primary_lan_ip, require_private_tv_host
from app.storage.credential_store import CredentialStore
from app.storage.device_store import DeviceStore

LOGGER = logging.getLogger(__name__)
StatusListener = Callable[[dict[str, Any]], Awaitable[None] | None]


class TvController:
    def __init__(
        self,
        settings: Settings,
        device_store: DeviceStore,
        credential_store: CredentialStore,
        *,
        protocol_factory: Callable[..., TelevisionRemoteProtocol] | None = None,
    ) -> None:
        self.settings = settings
        self.device_store = device_store
        self.credential_store = credential_store
        self._protocol_factory = protocol_factory or self._default_factory
        self._protocol: TelevisionRemoteProtocol | None = None
        self._queue = CommandQueue(self._send_now, gap_ms=settings.command_gap_ms)
        self._status = ConnectionStatus.DISCONNECTED
        self._listeners: list[StatusListener] = []
        self._backoff = ExponentialBackoff(
            min_ms=settings.reconnect_min_ms,
            max_ms=settings.reconnect_max_ms,
        )
        self._phone_access = False
        self._reconnect_task: asyncio.Task[None] | None = None
        self._stop = asyncio.Event()
        self._broadcast_tasks: set[asyncio.Task[None]] = set()
        self.last_sanitized_error: str | None = None

    def _default_factory(self, **kwargs: Any) -> TelevisionRemoteProtocol:
        if self.settings.fake_protocol_allowed and self.settings.protocol == "fake":
            from app.samsung.fake_dev import FakeHSeriesRemote

            LOGGER.warning("Developer fake protocol is active — not a production adapter")
            return FakeHSeriesRemote(**kwargs)
        return HSeriesEncryptedRemote(**kwargs)

    def subscribe(self, listener: StatusListener) -> None:
        self._listeners.append(listener)

    async def start(self) -> None:
        await self._queue.start()
        device = self.device_store.load()
        creds = self.credential_store.load()
        if device and creds:
            self._protocol = self._protocol_factory(
                host=device.host,
                auth_port=device.auth_port,
                remote_port=device.remote_port,
                token=creds.token,
                session_id=creds.session_id,
            )
            try:
                await self.connect(proof=False)
            except RemoteError as exc:
                LOGGER.info("Startup reconnect failed: %s", exc)

    async def shutdown(self) -> None:
        self._stop.set()
        if self._reconnect_task:
            self._reconnect_task.cancel()
        await self._queue.stop()
        if self._protocol is not None:
            await self._protocol.disconnect()
            closer = getattr(self._protocol, "aclose", None)
            if closer:
                await closer()

    def _set_status(self, status: ConnectionStatus, extra: dict[str, Any] | None = None) -> None:
        self._status = status
        payload = self.status_payload()
        if extra:
            payload.update(extra)
        for listener in list(self._listeners):
            result = listener(payload)
            if asyncio.iscoroutine(result):
                task = asyncio.create_task(result)
                self._broadcast_tasks.add(task)
                task.add_done_callback(self._broadcast_tasks.discard)

    def status_payload(self) -> dict[str, Any]:
        device = self.device_store.load()
        creds = self.credential_store.load()
        return {
            "status": self._status.value,
            "host_running": True,
            "phone_access": self._phone_access,
            "tv_model": TV_MODEL,
            "protocol": PROTOCOL_NAME,
            "device": device.to_public_dict() if device else None,
            "credential_present": bool(creds),
            "session_id_present": bool(creds and creds.session_id),
            "queue_length": self._queue.length,
            "last_key": self._queue.last_key,
            "last_error": self.last_sanitized_error,
            "lan_ip": primary_lan_ip(),
            "version": APP_VERSION,
            "power_on_supported": False,
            "power_on_message": (
                "This 2014 Samsung model normally cannot be powered on over Wi-Fi. "
                "Use the physical remote or an optional infrared bridge."
            ),
        }

    @property
    def phone_access(self) -> bool:
        return self._phone_access

    def set_phone_access(self, enabled: bool) -> None:
        self._phone_access = enabled
        self._set_status(self._status)

    def set_command_gap(self, gap_ms: int) -> None:
        gap = max(50, min(gap_ms, 2000))
        self.settings.command_gap_ms = gap
        self._queue.configure_gap(gap)

    def _make_device(
        self,
        host: str,
        *,
        display_name: str = "Living Room TV",
        auth_port: int = DEFAULT_AUTH_PORT,
        remote_port: int = DEFAULT_REMOTE_PORT,
        software_version: str | None = None,
    ) -> DeviceRecord:
        require_private_tv_host(host)
        existing = self.device_store.load()
        return DeviceRecord(
            host=host,
            display_name=display_name,
            model=TV_MODEL,
            auth_port=parse_port(auth_port),
            remote_port=parse_port(remote_port),
            last_connected_at=existing.last_connected_at if existing else None,
            credentials_valid=existing.credentials_valid if existing else False,
            software_version=software_version or (existing.software_version if existing else None),
        )

    async def save_device(self, **kwargs: Any) -> DeviceRecord:
        device = self._make_device(**kwargs)
        self.device_store.save(device)
        return device

    async def test_ports(self, host: str, auth_port: int, remote_port: int) -> dict[str, Any]:
        self._set_status(ConnectionStatus.TESTING)
        require_private_tv_host(host)
        auth = await check_tcp_port(host, parse_port(auth_port), timeout_s=2.0)
        remote = await check_tcp_port(host, parse_port(remote_port), timeout_s=2.0)
        self._set_status(ConnectionStatus.DISCONNECTED)
        return {"auth": auth.to_dict(), "remote": remote.to_dict()}

    def _bind_protocol(self, device: DeviceRecord) -> TelevisionRemoteProtocol:
        creds = self.credential_store.load()
        kwargs: dict[str, Any] = {
            "host": device.host,
            "auth_port": device.auth_port,
            "remote_port": device.remote_port,
        }
        if creds:
            kwargs["token"] = creds.token
            kwargs["session_id"] = creds.session_id
        self._protocol = self._protocol_factory(**kwargs)
        return self._protocol

    async def start_pairing(self, host: str, auth_port: int, remote_port: int, display_name: str) -> None:
        device = self._make_device(
            host, display_name=display_name, auth_port=auth_port, remote_port=remote_port
        )
        self.device_store.save(device)
        protocol = self._bind_protocol(device)
        await protocol.start_pairing()
        self._set_status(ConnectionStatus.WAITING_FOR_PIN)

    async def confirm_pin(self, pin: str) -> None:
        if self._protocol is None:
            device = self.device_store.load()
            if device is None:
                raise RemoteError("No television is configured.")
            self._bind_protocol(device)
        assert self._protocol is not None
        creds = await self._protocol.confirm_pin(pin)
        self.credential_store.save(creds)
        device = self.device_store.load()
        if device:
            self.device_store.mark_connected(device)
        await self.connect(proof=True)

    def _require_paired_device(self) -> None:
        device = self.device_store.load()
        creds = self.credential_store.load()
        if device is None:
            self.last_sanitized_error = (
                "No television is configured. Enter the TV IP on the Setup page first."
            )
            self._set_status(ConnectionStatus.DISCONNECTED)
            raise NotConfigured()
        if creds is None:
            self.last_sanitized_error = (
                "The television is not paired yet. Complete Setup and enter the PIN shown on the TV."
            )
            self._set_status(ConnectionStatus.DISCONNECTED)
            raise NotPaired()

    async def connect(self, *, proof: bool = False) -> None:
        self._require_paired_device()
        device = self.device_store.load()
        creds = self.credential_store.load()
        assert device is not None and creds is not None
        if self._protocol is None:
            self._bind_protocol(device)
        assert self._protocol is not None
        self._set_status(ConnectionStatus.RECONNECTING)
        try:
            await self._protocol.connect()
        except CredentialsRejected:
            self.device_store.mark_invalid(device)
            self._set_status(ConnectionStatus.CREDENTIALS_REJECTED)
            self.last_sanitized_error = "Stored credentials were rejected. Pair the television again."
            raise
        except RemoteError as exc:
            self.last_sanitized_error = str(exc)
            if exc.retryable:
                self._set_status(ConnectionStatus.TV_OFFLINE)
            else:
                self._set_status(ConnectionStatus.ERROR)
            raise
        self._backoff.reset()
        self.device_store.mark_connected(device)
        self._set_status(ConnectionStatus.CONNECTED)
        if proof:
            await self.send_key(AllowedKey.KEY_MUTE, repeat_group=None)

    async def disconnect(self) -> None:
        self._queue.drop_pending()
        if self._protocol:
            await self._protocol.disconnect()
        self._set_status(ConnectionStatus.DISCONNECTED)

    async def reset_pairing(self) -> None:
        await self.disconnect()
        self.credential_store.delete()
        device = self.device_store.load()
        if device:
            self.device_store.mark_invalid(device)
        self._protocol = None
        self.last_sanitized_error = None
        self._set_status(ConnectionStatus.DISCONNECTED)

    async def forget_tv(self) -> None:
        await self.reset_pairing()
        self.device_store.clear()
        self.last_sanitized_error = None
        self._set_status(ConnectionStatus.DISCONNECTED)

    async def send_key(self, key: AllowedKey | str, *, repeat_group: str | None = None) -> int:
        allowed = key if isinstance(key, AllowedKey) else parse_allowed_key(str(key))
        name = samsung_key_name(allowed)
        if self._status is ConnectionStatus.WAITING_FOR_PIN:
            self.last_sanitized_error = (
                "The television is not paired yet. Complete Setup and enter the PIN shown on the TV."
            )
            self._set_status(ConnectionStatus.WAITING_FOR_PIN)
            raise NotPaired()
        if self._status in {
            ConnectionStatus.DISCONNECTED,
            ConnectionStatus.TV_OFFLINE,
            ConnectionStatus.ERROR,
            ConnectionStatus.CREDENTIALS_REJECTED,
        }:
            await self.connect(proof=False)
        return await self._queue.enqueue(name, repeat_group=repeat_group)

    def stop_repeat(self, group: str) -> None:
        self._queue.cancel_repeat(group)

    async def _send_now(self, key: str) -> None:
        if self._protocol is None:
            raise DangerousKeyRejected(key)
        self._set_status(ConnectionStatus.SENDING_COMMAND)
        try:
            await self._protocol.send_key(key)
        except CredentialsRejected:
            device = self.device_store.load()
            if device:
                self.device_store.mark_invalid(device)
            self._set_status(ConnectionStatus.CREDENTIALS_REJECTED)
            self.last_sanitized_error = "Stored credentials were rejected."
            raise
        except RemoteError as exc:
            self.last_sanitized_error = str(exc)
            self._set_status(ConnectionStatus.ERROR)
            raise
        self._set_status(ConnectionStatus.CONNECTED)

    def diagnostics(self) -> dict[str, Any]:
        device = self.device_store.load()
        creds = self.credential_store.load()
        payload = self.status_payload()
        payload.update(
            {
                "tv_ip": device.host if device else None,
                "pairing_port": device.auth_port if device else DEFAULT_AUTH_PORT,
                "remote_port": device.remote_port if device else DEFAULT_REMOTE_PORT,
                "last_connected_time": device.last_connected_at.isoformat()
                if device and device.last_connected_at
                else None,
                "command_gap_ms": self.settings.command_gap_ms,
                "application_version": APP_VERSION,
                "tv_software_version": device.software_version if device else self.settings.tv_software_version,
            }
        )
        payload.pop("credential_present", None)
        payload["credential_present"] = "yes" if creds else "no"
        payload["session_id_present"] = "yes" if creds and creds.session_id else "no"
        return payload
