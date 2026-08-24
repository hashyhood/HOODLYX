"""Single-instance lock for the Windows host."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any


class SingleInstance:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._handle: Any = None
        self._mutex: Any = None

    def acquire(self) -> bool:
        if sys.platform == "win32":
            try:
                import win32api
                import win32event
                import winerror

                self._mutex = win32event.CreateMutex(None, False, "HashirSamsungRemoteSingleton")
                last = win32api.GetLastError()
                return last != winerror.ERROR_ALREADY_EXISTS
            except Exception:
                pass
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            fd = os.open(str(self._path), os.O_CREAT | os.O_EXCL | os.O_RDWR)
            os.write(fd, str(os.getpid()).encode())
            self._handle = fd
            return True
        except FileExistsError:
            try:
                pid = int(self._path.read_text(encoding="utf-8").strip() or "0")
            except OSError:
                pid = 0
            if pid and _pid_exists(pid):
                return False
            try:
                self._path.unlink()
            except OSError:
                return False
            return self.acquire()

    def release(self) -> None:
        if self._handle is not None:
            try:
                os.close(self._handle)
            except OSError:
                pass
            try:
                self._path.unlink()
            except OSError:
                pass
            self._handle = None
        self._mutex = None


def _pid_exists(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True
