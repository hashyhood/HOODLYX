from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app import __version__
from app.api.deps import AuthDep, CtxDep
from app.config import PROTOCOL_NAME
from app.samsung.reachability import check_tcp_port
from app.security.local_ip import primary_lan_ip
from app.security.redact import redact_mapping

router = APIRouter()


def _dep_versions() -> dict[str, str]:
    versions: dict[str, str] = {}
    for name in (
        "fastapi",
        "uvicorn",
        "aiohttp",
        "pydantic",
        "samsungtvws",
        "keyring",
        "cryptography",
    ):
        try:
            from importlib.metadata import version

            versions[name] = version(name)
        except Exception:
            versions[name] = "unknown"
    return versions


@router.get("/diagnostics")
async def diagnostics(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    device = ctx.device_store.load()
    host = device.host if device else None
    auth_port = device.auth_port if device else 8080
    remote_port = device.remote_port if device else 8000
    auth = await check_tcp_port(host, auth_port) if host else None
    remote = await check_tcp_port(host, remote_port) if host else None
    payload = ctx.controller.diagnostics()
    payload.update(
        {
            "laptop_lan_ip": primary_lan_ip(),
            "port_reachability": {
                "auth": auth.to_dict() if auth else None,
                "remote": remote.to_dict() if remote else None,
            },
            "protocol": PROTOCOL_NAME,
            "phone_sessions": ctx.phone.list_sessions(),
            "connected_phone_sessions": ctx.phone.active_count(),
            "dependency_versions": _dep_versions(),
            "application_version": __version__,
            "generated_at": datetime.now(UTC).isoformat(),
        }
    )
    return redact_mapping(payload)


@router.get("/diagnostics/export")
async def diagnostics_export(ctx: CtxDep, _auth: AuthDep) -> JSONResponse:
    data = await diagnostics(ctx, _auth)
    body = json.dumps(data, indent=2)
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": 'attachment; filename="h6400-diagnostics.json"',
            "X-Content-Length": str(len(body)),
        },
    )
