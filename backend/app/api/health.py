from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Response

from app import __version__
from app.api.deps import CtxDep
from app.security.csrf import CSRF_COOKIE

router = APIRouter()


@router.get("/health")
async def health(ctx: CtxDep, response: Response) -> dict[str, Any]:
    response.set_cookie(
        CSRF_COOKIE,
        ctx.csrf_token,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/",
    )
    payload = ctx.controller.status_payload()
    payload.update(
        {
            "ok": True,
            "version": __version__,
            "csrf_token": ctx.csrf_token,
            "warning": (
                "An untrusted shared Wi-Fi network is unsafe. Use this remote only on your household LAN. "
                "The Windows host must be running for the phone remote to work."
            ),
        }
    )
    return payload


@router.get("/status")
async def status(ctx: CtxDep) -> dict[str, Any]:
    return ctx.controller.status_payload()
