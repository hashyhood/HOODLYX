"""Windows tray integration. Continues running when the status window is closed."""

from __future__ import annotations

import logging
import sys
import threading
import webbrowser
from collections.abc import Callable
from typing import Any

LOGGER = logging.getLogger(__name__)


class TrayController:
    def __init__(
        self,
        *,
        open_remote: Callable[[], None],
        status_text: Callable[[], str],
        toggle_phone: Callable[[], None],
        reconnect: Callable[[], None],
        open_diagnostics: Callable[[], None],
        on_exit: Callable[[], None],
        phone_enabled: Callable[[], bool],
    ) -> None:
        self._open_remote = open_remote
        self._status_text = status_text
        self._toggle_phone = toggle_phone
        self._reconnect = reconnect
        self._open_diagnostics = open_diagnostics
        self._on_exit = on_exit
        self._phone_enabled = phone_enabled
        self._icon: Any = None
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if sys.platform != "win32":
            LOGGER.info("Tray icon is Windows-only; continuing without it on %s", sys.platform)
            return
        try:
            import pystray
            from PIL import Image, ImageDraw
        except Exception:
            LOGGER.info("pystray/Pillow unavailable; tray icon disabled")
            return

        image = Image.new("RGB", (64, 64), "#111111")
        draw = ImageDraw.Draw(image)
        draw.ellipse((8, 8, 56, 56), outline="#e8c36a", width=4)
        draw.ellipse((24, 24, 40, 40), fill="#e8c36a")

        menu = pystray.Menu(
            pystray.MenuItem("Open Remote", lambda: self._open_remote()),
            pystray.MenuItem("Connection Status", lambda: None, enabled=False),
            pystray.MenuItem(
                lambda item: "Disable Phone Access" if self._phone_enabled() else "Enable Phone Access",
                lambda: self._toggle_phone(),
            ),
            pystray.MenuItem("Reconnect TV", lambda: self._reconnect()),
            pystray.MenuItem("Diagnostics", lambda: self._open_diagnostics()),
            pystray.MenuItem("Exit", lambda: self._request_exit()),
        )
        self._icon = pystray.Icon("HashirSamsungRemote", image, "Hashir Samsung Remote", menu)
        self._thread = threading.Thread(target=self._icon.run, name="tray", daemon=True)
        self._thread.start()

    def _request_exit(self) -> None:
        try:
            if self._icon is not None:
                self._icon.stop()
        finally:
            self._on_exit()

    def stop(self) -> None:
        if self._icon is not None:
            try:
                self._icon.stop()
            except Exception:
                pass

    @staticmethod
    def open_url(url: str) -> None:
        webbrowser.open(url)
