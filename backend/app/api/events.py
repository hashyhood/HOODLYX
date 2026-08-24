from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.api.deps import AuthDep, CtxDep, get_ctx_ws

router = APIRouter()


@router.get("/events")
async def sse_events(request: Request, ctx: CtxDep, _auth: AuthDep) -> StreamingResponse:
    queue = ctx.subscribe()

    async def gen() -> AsyncIterator[str]:
        try:
            snapshot = json.dumps({"type": "status", "payload": ctx.controller.status_payload()})
            yield f"data: {snapshot}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                    yield f"data: {json.dumps(event)}\n\n"
                except TimeoutError:
                    yield "event: ping\ndata: {}\n\n"
        finally:
            ctx.unsubscribe(queue)

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.websocket("/ws")
async def websocket_status(websocket: WebSocket) -> None:
    await websocket.accept()
    ctx = get_ctx_ws(websocket)
    queue = ctx.subscribe()
    try:
        await websocket.send_json({"type": "status", "payload": ctx.controller.status_payload()})
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        ctx.unsubscribe(queue)
