"""Backoff for reconnection. Controlled, never flood the television."""

from __future__ import annotations

import random


class ExponentialBackoff:
    def __init__(self, *, min_ms: int = 500, max_ms: int = 15_000, factor: float = 1.7) -> None:
        self.min_ms = min_ms
        self.max_ms = max_ms
        self.factor = factor
        self._attempt = 0

    def reset(self) -> None:
        self._attempt = 0

    @property
    def attempt(self) -> int:
        return self._attempt

    def next_delay_s(self) -> float:
        raw = min(self.max_ms, self.min_ms * (self.factor ** self._attempt))
        self._attempt += 1
        jitter = raw * 0.1 * random.random()
        return (raw + jitter) / 1000.0
