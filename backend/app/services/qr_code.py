"""QR code for phone pairing. Local URL only — never a cloud relay."""

from __future__ import annotations

import base64
import io
from urllib.parse import urlencode

import qrcode


def phone_pairing_url(lan_ip: str, port: int, code: str) -> str:
    query = urlencode({"code": code})
    return f"http://{lan_ip}:{port}/#/phone?{query}"


def qr_png_base64(url: str) -> str:
    image = qrcode.make(url)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
