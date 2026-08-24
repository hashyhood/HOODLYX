from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import AuthDep, CtxDep
from app.config import DEFAULT_AUTH_PORT, DEFAULT_REMOTE_PORT, TV_MODEL
from app.samsung.errors import RemoteError
from app.services.discovery import discover_samsung

router = APIRouter()


class DeviceSaveRequest(BaseModel):
    host: str
    display_name: str = "Living Room TV"
    auth_port: int = DEFAULT_AUTH_PORT
    remote_port: int = DEFAULT_REMOTE_PORT
    software_version: str | None = None


class DeviceTestRequest(BaseModel):
    host: str
    auth_port: int = DEFAULT_AUTH_PORT
    remote_port: int = DEFAULT_REMOTE_PORT


@router.get("/device")
async def get_device(ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    device = ctx.device_store.load()
    if device is None:
        return {"device": None, "model": TV_MODEL}
    return {"device": device.to_public_dict(), "model": TV_MODEL}


@router.post("/device/save")
async def save_device(body: DeviceSaveRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    try:
        device = await ctx.controller.save_device(
            host=body.host,
            display_name=body.display_name,
            auth_port=body.auth_port,
            remote_port=body.remote_port,
            software_version=body.software_version,
        )
    except RemoteError as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"device": device.to_public_dict()}


@router.post("/device/test")
async def test_device(body: DeviceTestRequest, ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    try:
        return await ctx.controller.test_ports(body.host, body.auth_port, body.remote_port)
    except RemoteError as exc:
        raise HTTPException(status_code=400, detail=exc.to_dict()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/device/forget")
async def forget_device(ctx: CtxDep, _auth: AuthDep) -> dict[str, bool]:
    await ctx.controller.forget_tv()
    return {"ok": True}


@router.post("/device/discover")
async def discover(_ctx: CtxDep, _auth: AuthDep) -> dict[str, Any]:
    devices = await discover_samsung(timeout_s=2.0)
    return {"devices": devices, "manual_entry_required": True}
