"""Reserved infrared bridge interfaces. Not implemented in this milestone."""

from __future__ import annotations

from typing import Protocol


class InfraredBridgeRemote(Protocol):
    """Future: BroadLink / Raspberry Pi / ESP32 transmitter.

    This 2014 H-series TV normally cannot be powered on over Wi-Fi.
    An infrared bridge is the honest path for power-on later.
    """

    async def send_ir(self, name: str) -> None: ...
