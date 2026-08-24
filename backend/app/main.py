"""FastAPI application factory and Windows host entrypoint."""

from __future__ import annotations

import logging
import sys
import threading
import webbrowser
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import devices, diagnostics, events, health, pairing, phone_sessions, remote
from app.config import APP_DISPLAY_NAME, load_settings
from app.lifecycle import lifespan
from app.runtime import call_on_loop, run_on_loop, runtime
from app.samsung.errors import RemoteError
from app.services.single_instance import SingleInstance
from app.services.tray import TrayController

LOGGER = logging.getLogger(__name__)


def _frontend_dist() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "frontend" / "dist"  # type: ignore[attr-defined]
    return Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app() -> FastAPI:
    app = FastAPI(
        title=APP_DISPLAY_NAME,
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )

    @app.middleware("http")
    async def no_open_cors(request: Request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)
        # Intentionally no Access-Control-Allow-Origin: *
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["X-Frame-Options"] = "DENY"
        return response

    @app.exception_handler(RemoteError)
    async def remote_error_handler(_request: Request, exc: RemoteError) -> JSONResponse:
        return JSONResponse(status_code=400, content=exc.to_dict())

    app.include_router(health.router, prefix="/api", tags=["health"])
    app.include_router(devices.router, prefix="/api", tags=["devices"])
    app.include_router(pairing.router, prefix="/api", tags=["pairing"])
    app.include_router(remote.router, prefix="/api", tags=["remote"])
    app.include_router(phone_sessions.router, prefix="/api", tags=["phone"])
    app.include_router(diagnostics.router, prefix="/api", tags=["diagnostics"])
    app.include_router(events.router, prefix="/api", tags=["events"])

    dist = _frontend_dist()
    if dist.exists():
        assets = dist / "assets"
        if assets.exists():
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        @app.get("/{full_path:path}")
        async def spa(full_path: str) -> FileResponse:
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404)
            candidate = dist / full_path
            if full_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(dist / "index.html")

    return app


app = create_app()


def _open_browser(url: str) -> None:
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()


def run() -> None:
    settings = load_settings()
    lock = SingleInstance(settings.data_dir / "host.lock")
    if not lock.acquire():
        url = f"http://127.0.0.1:{settings.http_port}/"
        LOGGER.info("Another instance is running; opening %s", url)
        webbrowser.open(url)
        return

    import uvicorn

    application = create_app()
    application.state.settings = settings
    url = f"http://127.0.0.1:{settings.http_port}/"

    def _exit() -> None:
        import os

        os._exit(0)

    def open_remote() -> None:
        webbrowser.open(url)

    def open_diagnostics() -> None:
        webbrowser.open(url + "#/diagnostics")

    def status_text() -> str:
        app_obj = runtime.application
        if app_obj is None or not hasattr(app_obj.state, "ctx"):
            return "Starting…"
        payload = app_obj.state.ctx.controller.status_payload()
        return f"{payload.get('status', 'Unknown')}"

    def phone_enabled() -> bool:
        app_obj = runtime.application
        if app_obj is None or not hasattr(app_obj.state, "ctx"):
            return False
        return bool(app_obj.state.ctx.controller.phone_access)

    def toggle_phone() -> None:
        def _do() -> None:
            app_obj = runtime.application
            if app_obj is None or not hasattr(app_obj.state, "ctx"):
                return
            current = app_obj.state.ctx.controller.phone_access
            app_obj.state.ctx.controller.set_phone_access(not current)

        call_on_loop(_do)

    def reconnect() -> None:
        app_obj = runtime.application
        if app_obj is None or not hasattr(app_obj.state, "ctx"):
            return
        run_on_loop(app_obj.state.ctx.controller.connect(proof=False))

    tray = TrayController(
        open_remote=open_remote,
        status_text=status_text,
        toggle_phone=toggle_phone,
        reconnect=reconnect,
        open_diagnostics=open_diagnostics,
        on_exit=_exit,
        phone_enabled=phone_enabled,
    )
    tray.start()
    if settings.open_browser:
        _open_browser(url)

    config = uvicorn.Config(
        application,
        host="0.0.0.0",
        port=settings.http_port,
        log_level=settings.log_level.lower(),
        lifespan="on",
    )
    server = uvicorn.Server(config)
    try:
        server.run()
    finally:
        tray.stop()
        lock.release()


if __name__ == "__main__":
    run()
