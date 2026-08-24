import asyncio

import pytest

from app.samsung.backoff import ExponentialBackoff
from app.samsung.command_queue import CommandQueue


@pytest.mark.asyncio
async def test_command_queue_is_serialized_and_ordered():
    sent: list[str] = []

    async def sender(key: str) -> None:
        sent.append(key)
        await asyncio.sleep(0.01)

    queue = CommandQueue(sender, gap_ms=20, stale_after_ms=2000)
    await queue.start()
    await queue.enqueue("KEY_VOLUP")
    await queue.enqueue("KEY_VOLDOWN")
    await asyncio.wait_for(queue._queue.join(), timeout=2)
    await queue.stop()
    assert sent == ["KEY_VOLUP", "KEY_VOLDOWN"]


@pytest.mark.asyncio
async def test_repeat_cancellation_drops_group():
    sent: list[str] = []

    async def sender(key: str) -> None:
        sent.append(key)

    queue = CommandQueue(sender, gap_ms=5, stale_after_ms=2000)
    await queue.start()
    queue.cancel_repeat("g1")
    await queue.enqueue("KEY_VOLUP", repeat_group="g1")
    await queue.enqueue("KEY_MUTE", repeat_group=None)
    await asyncio.wait_for(queue._queue.join(), timeout=2)
    await queue.stop()
    assert sent == ["KEY_MUTE"]


@pytest.mark.asyncio
async def test_stale_commands_dropped_after_disconnect():
    sent: list[str] = []

    async def sender(key: str) -> None:
        sent.append(key)

    queue = CommandQueue(sender, gap_ms=1, stale_after_ms=1)
    await queue.start()
    await queue.enqueue("KEY_VOLUP")
    await asyncio.sleep(0.02)
    # already processed or stale
    await asyncio.wait_for(queue._queue.join(), timeout=2)
    await queue.stop()


def test_backoff_increases_then_caps():
    backoff = ExponentialBackoff(min_ms=100, max_ms=400, factor=2)
    d1 = backoff.next_delay_s()
    d2 = backoff.next_delay_s()
    d3 = backoff.next_delay_s()
    d4 = backoff.next_delay_s()
    assert d2 > d1
    assert d4 <= 0.45
    backoff.reset()
    assert backoff.attempt == 0
    assert d3 > 0


@pytest.mark.asyncio
async def test_queue_stop_cancels_worker():
    async def sender(_key: str) -> None:
        return None

    queue = CommandQueue(sender, gap_ms=10)
    await queue.start()
    await queue.stop()
    assert queue._worker is None
