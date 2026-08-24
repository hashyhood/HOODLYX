"""Rate limiter for control endpoints."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass


@dataclass(slots=True)
class RateLimitResult:
    allowed: bool
    retry_after_ms: int = 0


class SlidingWindowLimiter:
    def __init__(self, *, max_events: int, window_s: float) -> None:
        self.max_events = max_events
        self.window_s = window_s
        self._events: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str) -> RateLimitResult:
        now = time.monotonic()
        bucket = self._events[key]
        cutoff = now - self.window_s
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= self.max_events:
            retry = int((bucket[0] + self.window_s - now) * 1000)
            return RateLimitResult(False, max(retry, 1))
        bucket.append(now)
        return RateLimitResult(True)

    def reset(self, key: str) -> None:
        self._events.pop(key, None)
