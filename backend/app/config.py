"""Application configuration. Secrets never live in this file."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_NAME = "HashirSamsungRemote"
APP_DISPLAY_NAME = "Hashir Samsung Remote"
TV_MODEL = "UA55H6400"
TV_BRAND = "Samsung"
TV_YEAR = 2014
TV_PLATFORM = "H-series / Orsay"
PROTOCOL_NAME = "H-Series Encrypted v1"
DEFAULT_AUTH_PORT = 8080
DEFAULT_REMOTE_PORT = 8000
DEFAULT_HTTP_PORT = 8787
DEFAULT_COMMAND_GAP_MS = 320
APP_VERSION = "1.0.0"


def default_data_dir() -> Path:
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA")
        if appdata:
            return Path(appdata) / APP_NAME
    xdg = os.environ.get("XDG_CONFIG_HOME")
    if xdg:
        return Path(xdg) / APP_NAME
    return Path.home() / ".config" / APP_NAME


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="H6400_",
        extra="ignore",
        env_file=None,
    )

    environment: Literal["production", "development", "test"] = "production"
    http_port: int = DEFAULT_HTTP_PORT
    bind_host: str = "127.0.0.1"
    data_dir: Path = Field(default_factory=default_data_dir)
    command_gap_ms: int = DEFAULT_COMMAND_GAP_MS
    command_stale_after_ms: int = 8_000
    reconnect_min_ms: int = 500
    reconnect_max_ms: int = 15_000
    phone_code_ttl_seconds: int = 180
    session_idle_days: int = 30
    allow_fake_protocol: bool = False
    protocol: Literal["encrypted", "fake"] = "encrypted"
    open_browser: bool = True
    log_level: str = "INFO"
    tv_software_version: str | None = None

    @property
    def frozen(self) -> bool:
        return bool(getattr(sys, "frozen", False))

    @property
    def fake_protocol_allowed(self) -> bool:
        if self.frozen:
            return False
        return self.environment in {"development", "test"} and self.allow_fake_protocol

    def ensure_data_dir(self) -> Path:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return self.data_dir


def load_settings() -> Settings:
    settings = Settings()
    settings.ensure_data_dir()
    return settings
