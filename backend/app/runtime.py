"""Live host process handles for tray callbacks (Windows)."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI


class HostRuntime:
    application: FastAPI | None = None
    loop: asyncio.AbstractEventLoop | None = None
    server: Any = None


runtime = HostRuntime()


def call_on_loop(fn: Any) -> None:
    loop = runtime.loop
    if loop is None:
        return
    loop.call_soon_threadsafe(fn)


def run_on_loop(coro: Any) -> None:
    loop = runtime.loop
    if loop is None:
        return
    asyncio.run_coroutine_threadsafe(coro, loop)
