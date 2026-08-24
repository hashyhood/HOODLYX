"""SSDP discovery. Used only after manual IP control is available.

Never scans public ranges. Short timeout. Samsung-related devices only.
"""

from __future__ import annotations

import asyncio
import socket
from typing import Any

from app.security.local_ip import is_private_lan, parse_ipv4

SSDP_ADDR = "239.255.255.250"
SSDP_PORT = 1900
SEARCH = (
    "M-SEARCH * HTTP/1.1\r\n"
    f"HOST: {SSDP_ADDR}:{SSDP_PORT}\r\n"
    "MAN: \"ssdp:discover\"\r\n"
    "MX: 1\r\n"
    "ST: ssdp:all\r\n"
    "\r\n"
).encode("ascii")
SAMSUNG_HINTS = ("samsung", "remoteui", "dial", "urn:samsung", "smarttv")


def _is_samsung(text: str) -> bool:
    lowered = text.lower()
    return any(hint in lowered for hint in SAMSUNG_HINTS)


def _parse_headers(payload: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    for line in payload.split("\r\n"):
        if ":" in line:
            key, value = line.split(":", 1)
            headers[key.strip().lower()] = value.strip()
    return headers


async def discover_samsung(*, timeout_s: float = 2.0) -> list[dict[str, Any]]:
    loop = asyncio.get_running_loop()
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setblocking(False)
    found: dict[str, dict[str, Any]] = {}

    def _send() -> None:
        sock.sendto(SEARCH, (SSDP_ADDR, SSDP_PORT))

    def _recv() -> tuple[bytes, tuple[str, int]]:
        sock.settimeout(0.25)
        return sock.recvfrom(4096)

    try:
        await loop.run_in_executor(None, _send)
        end = loop.time() + timeout_s
        while loop.time() < end:
            try:
                data, addr = await loop.run_in_executor(None, _recv)
            except TimeoutError:
                continue
            except OSError:
                break
            ip = addr[0]
            try:
                parsed = parse_ipv4(ip)
            except ValueError:
                continue
            if not is_private_lan(parsed) or parsed.is_loopback:
                continue
            text = data.decode("utf-8", errors="ignore")
            if not _is_samsung(text):
                continue
            headers = _parse_headers(text)
            server = headers.get("server", "")
            usn = headers.get("usn", "")
            name = headers.get("friendlyname") or server or "Samsung device"
            found[ip] = {
                "host": ip,
                "name": name,
                "usn": usn,
                "server": server,
            }
    finally:
        sock.close()
    return list(found.values())
