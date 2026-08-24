"""Shared application runtime context."""

from __future__ import annotations

import asyncio
from typing import Any

from app.config import Settings
from app.security.csrf import new_csrf_token
from app.security.phone_pairing import PhonePairingService
from app.security.rate_limit import SlidingWindowLimiter
from app.security.secrets import describe_secret
from app.services.tv_controller import TvController
from app.storage.credential_store import CredentialStore
from app.storage.device_store import DeviceStore

LAPTOP_COOKIE = "h6400_laptop"
PHONE_COOKIE = "h6400_phone"


class AppContext:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.device_store = DeviceStore(settings.data_dir / "device.json")
        self.credential_store = CredentialStore(settings.data_dir)
        self.controller = TvController(settings, self.device_store, self.credential_store)
        self.phone = PhonePairingService(
            ttl_seconds=settings.phone_code_ttl_seconds,
            host_secret=self.credential_store.host_secret,
        )
        self.csrf_token = new_csrf_token()
        self.key_limiter = SlidingWindowLimiter(max_events=6, window_s=2.0)
        self.pair_limiter = SlidingWindowLimiter(max_events=8, window_s=60.0)
        self.subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self.laptop_sessions: set[str] = set()
        self.host_secret_desc = describe_secret(self.credential_store.host_secret)

    async def broadcast(self, event: dict[str, Any]) -> None:
        stale: list[asyncio.Queue[dict[str, Any]]] = []
        for queue in self.subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                stale.append(queue)
        for queue in stale:
            self.subscribers.discard(queue)

    def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=32)
        self.subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        self.subscribers.discard(queue)
