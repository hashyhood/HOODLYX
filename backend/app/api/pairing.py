from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import AuthDep, CtxDep
from app.config import DEFAULT_AUTH_PORT, DEFAULT_REMOTE_PORT
from app.samsung.errors import RemoteError
from app.samsung.pairing import validate_pin

router = APIRouter()


class PairingStartRequest(BaseModel):
    host: str
    display_name: str = "Living Room TV"
    auth_port: int = DEFAULT_AUTH_PORT
    remote_port: int = DEFAULT_REMOTE_PORT


class PairingConfirmRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=4)


@router.post("/pairing/start")
async def pairing_start(body: PairingStartRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    limit = ctx.pair_limiter.hit("pairing")
    if not limit.allowed:
        raise HTTPException(status_code=429, detail="Too many pairing attempts.")
    try:
        await ctx.controller.start_pairing(
            body.host, body.auth_port, body.remote_port, body.display_name
        )
    except RemoteError as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "ok": True,
        "status": "Waiting for PIN",
        "message": "Look at the television. Enter the four-digit PIN shown on the TV.",
    }


@router.post("/pairing/confirm")
async def pairing_confirm(body: PairingConfirmRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    try:
        validate_pin(body.pin)
        await ctx.controller.confirm_pin(body.pin)
    except RemoteError as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    return {
        "ok": True,
        "status": "Connected",
        "message": "PIN accepted. Credentials stored. Control proven with a mute command.",
    }


@router.post("/pairing/reset")
async def pairing_reset(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    await ctx.controller.reset_pairing()
    return {"ok": True, "message": "Pairing credentials cleared. Pair the television again."}
