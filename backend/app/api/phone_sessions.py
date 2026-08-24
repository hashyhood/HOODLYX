from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

from app.api.deps import AuthDep, CtxDep, enforce_local_client, get_ctx
from app.context import PHONE_COOKIE
from app.security.local_ip import primary_lan_ip
from app.services.firewall_helper import firewall_guidance
from app.services.qr_code import phone_pairing_url, qr_png_base64

router = APIRouter()


class PhoneEnableRequest(BaseModel):
    enabled: bool


class PhoneRedeemRequest(BaseModel):
    code: str = Field(min_length=4, max_length=16)


@router.post("/phone/enable")
async def phone_enable(body: PhoneEnableRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    ctx.controller.set_phone_access(body.enabled)
    if not body.enabled:
        ctx.phone.revoke_all()
    lan = primary_lan_ip() or "127.0.0.1"
    return {
        "phone_access": body.enabled,
        "lan_ip": lan,
        "firewall": firewall_guidance(ctx.settings.http_port, lan),
        "warning": (
            "An untrusted shared Wi-Fi network is unsafe. Do not enable phone access on guest or public Wi-Fi. "
            "Do not forward ports 8000, 8080, or the host port through the router."
        ),
    }


@router.post("/phone/pairing-code")
async def phone_pairing_code(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    if not ctx.controller.phone_access:
        raise HTTPException(status_code=400, detail="Enable phone remote first.")
    lan = primary_lan_ip()
    if not lan:
        raise HTTPException(status_code=400, detail="No private LAN IP was detected on this computer.")
    issued = ctx.phone.issue_code()
    url = phone_pairing_url(lan, ctx.settings.http_port, issued.code)
    return {
        "expires_in_seconds": ctx.settings.phone_code_ttl_seconds,
        "url": url,
        "qr": qr_png_base64(url),
        "code_hint": issued.code[:2] + "••••",
        "message": "The Windows host must keep running. Scan from a phone on the same Wi-Fi.",
    }


@router.post("/phone/redeem")
async def phone_redeem(body: PhoneRedeemRequest, request: Request, response: Response) -> dict[str, Any]:
    ctx = get_ctx(request)
    ip = enforce_local_client(request, ctx)
    try:
        session = ctx.phone.redeem(
            body.code,
            client_ip=ip,
            user_agent=request.headers.get("user-agent") or "unknown",
        )
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    response.set_cookie(
        PHONE_COOKIE,
        ctx.phone.cookie_value(session.session_id),
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        max_age=60 * 60 * 24 * 30,
    )
    return {"ok": True, "message": "Phone session created. You can control the TV through the Windows host."}


@router.post("/phone/revoke-sessions")
async def phone_revoke(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    count = ctx.phone.revoke_all()
    return {"ok": True, "revoked": count}


@router.get("/phone/sessions")
async def phone_sessions(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    return {"sessions": ctx.phone.list_sessions(), "phone_access": ctx.controller.phone_access}
