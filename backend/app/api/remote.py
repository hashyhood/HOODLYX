from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import AuthDep, CtxDep
from app.samsung.errors import DangerousKeyRejected, RemoteError
from app.samsung.key_allowlist import AllowedKey

router = APIRouter()


class KeyRequest(BaseModel):
    key: AllowedKey
    repeat_group: str | None = Field(default=None, max_length=64)


class RepeatStopRequest(BaseModel):
    repeat_group: str = Field(min_length=1, max_length=64)


@router.post("/remote/connect")
async def remote_connect(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    try:
        await ctx.controller.connect(proof=False)
    except RemoteError as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    return {"ok": True, "status": ctx.controller.status_payload()["status"]}


@router.post("/remote/disconnect")
async def remote_disconnect(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    await ctx.controller.disconnect()
    return {"ok": True}


class CommandGapRequest(BaseModel):
    gap_ms: int = Field(ge=50, le=2000)


@router.post("/remote/key")
async def remote_key(
    body: KeyRequest,
    ctx: CtxDep,
    _auth: AuthDep,
) -> dict[str, Any]:
    limit = ctx.key_limiter.hit("remote-key")
    if not limit.allowed:
        raise HTTPException(
            status_code=429,
            detail={"error": "Rate limited", "retry_after_ms": limit.retry_after_ms},
        )
    try:
        sequence = await ctx.controller.send_key(body.key, repeat_group=body.repeat_group)
    except DangerousKeyRejected as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    except RemoteError as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    return {"ok": True, "key": body.key.value, "sequence": sequence}


@router.post("/remote/repeat/stop")
async def remote_repeat_stop(body: RepeatStopRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, bool]:
    ctx.controller.stop_repeat(body.repeat_group)
    return {"ok": True}


@router.post("/settings/command-gap")
async def command_gap(body: CommandGapRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, int]:
    ctx.controller.set_command_gap(body.gap_ms)
    return {"command_gap_ms": ctx.settings.command_gap_ms}
