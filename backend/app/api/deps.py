"""Request authentication, origin checks, and CSRF."""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, WebSocket

from app.context import LAPTOP_COOKIE, PHONE_COOKIE, AppContext
from app.security.csrf import CSRF_COOKIE, CSRF_HEADER, SAFE_METHODS, tokens_match
from app.security.local_ip import client_on_allowed_network, local_ipv4_addresses, parse_ipv4


def get_ctx(request: Request) -> AppContext:
    return request.app.state.ctx  # type: ignore[no-any-return]


def get_ctx_ws(websocket: WebSocket) -> AppContext:
    return websocket.app.state.ctx  # type: ignore[no-any-return]


def client_ip(request: Request) -> str:
    peer = request.client.host if request.client else ""
    if peer in {"", "testclient", "localhost", "::1"}:
        return "127.0.0.1"
    return peer


def _is_loopback(ip: str) -> bool:
    try:
        return parse_ipv4(ip).is_loopback
    except ValueError:
        return ip in {"127.0.0.1", "localhost", "::1"}


def enforce_local_client(request: Request, ctx: AppContext) -> str:
    ip = client_ip(request)
    if _is_loopback(ip):
        return ip
    if not ctx.controller.phone_access:
        raise HTTPException(
            status_code=403,
            detail="Phone access is disabled. Enable it on the Windows host. The Windows host must be running.",
        )
    lan_ips = local_ipv4_addresses()
    if not client_on_allowed_network(ip, lan_ips, allow_loopback=True):
        raise HTTPException(
            status_code=403,
            detail="Client is not on the same private LAN. This remote is local-network only.",
        )
    return ip


def _origin_ok(request: Request) -> bool:
    origin = request.headers.get("origin")
    host = request.headers.get("host")
    if origin is None or host is None:
        return True
    from urllib.parse import urlparse

    parsed = urlparse(origin)
    return parsed.netloc == host or parsed.netloc.split(":")[0] in {"127.0.0.1", "localhost"}


def enforce_csrf(request: Request, ctx: AppContext) -> None:
    if request.method in SAFE_METHODS:
        return
    header = request.headers.get(CSRF_HEADER) or request.headers.get("X-CSRF-Token")
    cookie = request.cookies.get(CSRF_COOKIE)
    if not tokens_match(ctx.csrf_token, header) or not tokens_match(ctx.csrf_token, cookie):
        raise HTTPException(status_code=403, detail="CSRF validation failed.")


def _new_laptop_session(ctx: AppContext) -> str:
    token = secrets.token_urlsafe(24)
    ctx.laptop_sessions.add(token)
    return token


def require_session(
    request: Request,
    response: Response,
    ctx: Annotated[AppContext, Depends(get_ctx)],
) -> str:
    ip = enforce_local_client(request, ctx)
    if not _origin_ok(request):
        raise HTTPException(status_code=403, detail="Request origin is not allowed.")
    enforce_csrf(request, ctx)

    laptop = request.cookies.get(LAPTOP_COOKIE)
    if laptop and laptop in ctx.laptop_sessions:
        return "laptop"
    phone_cookie = request.cookies.get(PHONE_COOKIE)
    session_id = ctx.phone.parse_cookie(phone_cookie)
    if session_id and ctx.phone.get(session_id):
        return "phone"
    if _is_loopback(ip):
        token = _new_laptop_session(ctx)
        response.set_cookie(
            LAPTOP_COOKIE,
            token,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/",
        )
        return "laptop"
    raise HTTPException(
        status_code=401,
        detail="Not authenticated. Pair this phone from the Windows host QR code.",
    )


AuthDep = Annotated[str, Depends(require_session)]
CtxDep = Annotated[AppContext, Depends(get_ctx)]
