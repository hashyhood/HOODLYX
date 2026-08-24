"""Serialized command queue. One writer, configurable gap, no flooding."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class QueuedCommand:
    key: str
    created_at: float = field(default_factory=time.monotonic)
    sequence: int = 0
    repeat_group: str | None = None
    done: asyncio.Future[None] | None = None


class CommandQueue:
    def __init__(
        self,
        sender: Callable[[str], Awaitable[None]],
        *,
        gap_ms: int = 320,
        stale_after_ms: int = 8_000,
        on_status: Callable[[str], Awaitable[None] | None] | None = None,
    ) -> None:
        self._sender = sender
        self._gap_s = gap_ms / 1000.0
        self._stale_s = stale_after_ms / 1000.0
        self._on_status = on_status
        self._queue: asyncio.Queue[QueuedCommand] = asyncio.Queue()
        self._worker: asyncio.Task[None] | None = None
        self._seq = 0
        self._cancelled_groups: set[str] = set()
        self._closed = False
        self._lock = asyncio.Lock()
        self.last_key: str | None = None
        self.last_error: str | None = None

    @property
    def length(self) -> int:
        return self._queue.qsize()

    def configure_gap(self, gap_ms: int) -> None:
        self._gap_s = max(50, gap_ms) / 1000.0

    async def start(self) -> None:
        if self._worker is None or self._worker.done():
            self._closed = False
            self._worker = asyncio.create_task(self._run(), name="tv-command-queue")

    async def stop(self) -> None:
        self._closed = True
        self.drop_pending()
        if self._worker:
            self._worker.cancel()
            try:
                await self._worker
            except asyncio.CancelledError:
                pass
            self._worker = None

    def drop_pending(self) -> None:
        while True:
            try:
                command = self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break
            if command.done and not command.done.done():
                command.done.set_exception(RuntimeError("Command dropped"))
        self._cancelled_groups.clear()

    def cancel_repeat(self, group: str) -> None:
        self._cancelled_groups.add(group)

    async def enqueue(self, key: str, *, repeat_group: str | None = None) -> int:
        if self._closed:
            raise RuntimeError("Command queue is stopped.")
        self._seq += 1
        loop = asyncio.get_running_loop()
        done: asyncio.Future[None] = loop.create_future()
        command = QueuedCommand(key=key, sequence=self._seq, repeat_group=repeat_group, done=done)
        await self._queue.put(command)
        await done
        return command.sequence

    async def _run(self) -> None:
        try:
            while not self._closed:
                command = await self._queue.get()
                try:
                    await self._dispatch(command)
                    if command.done and not command.done.done():
                        command.done.set_result(None)
                except Exception as exc:
                    LOGGER.info("Command dispatch failed; worker continues")
                    if command.done and not command.done.done():
                        command.done.set_exception(exc)
                finally:
                    self._queue.task_done()
        except asyncio.CancelledError:
            LOGGER.debug("Command queue worker cancelled")
            raise

    async def _dispatch(self, command: QueuedCommand) -> None:
        if command.repeat_group and command.repeat_group in self._cancelled_groups:
            return
        age = time.monotonic() - command.created_at
        if age > self._stale_s:
            LOGGER.info("Dropping stale command %s age=%.2fs", command.key, age)
            return
        async with self._lock:
            try:
                await self._sender(command.key)
                self.last_key = command.key
                self.last_error = None
            except Exception as exc:
                self.last_error = str(exc)
                LOGGER.info("Command %s failed: %s", command.key, exc)
                raise
            await asyncio.sleep(self._gap_s)

    def snapshot(self) -> dict[str, Any]:
        return {
            "queue_length": self.length,
            "last_key": self.last_key,
            "last_error": self.last_error,
            "gap_ms": int(self._gap_s * 1000),
        }
