"""Application startup and shutdown."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import Settings, load_settings
from app.context import AppContext
from app.security.redact import install_redacting_logger

LOGGER = logging.getLogger(__name__)


def configure_logging(settings: Settings) -> None:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    install_redacting_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = getattr(app.state, "settings", None) or load_settings()
    configure_logging(settings)
    ctx = getattr(app.state, "ctx", None)
    if ctx is None:
        ctx = AppContext(settings)
        app.state.ctx = ctx
    app.state.settings = settings

    async def _on_status(event: dict[str, object]) -> None:
        await ctx.broadcast({"type": "status", "payload": event})

    ctx.controller.subscribe(_on_status)
    await ctx.controller.start()
    LOGGER.info("Hashir Samsung Remote host started (secret=%s)", ctx.host_secret_desc)
    try:
        yield
    finally:
        await ctx.controller.shutdown()
        LOGGER.info("Hashir Samsung Remote host stopped")
