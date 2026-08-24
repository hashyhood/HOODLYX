"""TCP reachability helpers with honest failure kinds."""

from __future__ import annotations

import asyncio
import errno
from dataclasses import dataclass

from app.samsung.errors import HostUnreachable, PortRefused, PortTimeout, ProbeFailureKind


@dataclass(frozen=True, slots=True)
class PortCheckResult:
    host: str
    port: int
    reachable: bool
    kind: str
    detail: str

    def to_dict(self) -> dict[str, str | int | bool]:
        return {
            "host": self.host,
            "port": self.port,
            "reachable": self.reachable,
            "kind": self.kind,
            "detail": self.detail,
        }


def _refused_errnos() -> set[int]:
    values = {errno.ECONNREFUSED}
    wsa = getattr(errno, "WSAECONNREFUSED", None)
    if isinstance(wsa, int):
        values.add(wsa)
    return values


def _timeout_errnos() -> set[int]:
    values = {errno.ETIMEDOUT}
    wsa = getattr(errno, "WSAETIMEDOUT", None)
    if isinstance(wsa, int):
        values.add(wsa)
    return values


async def check_tcp_port(host: str, port: int, *, timeout_s: float = 2.0) -> PortCheckResult:
    try:
        opener = asyncio.open_connection(host, port)
        _reader, writer = await asyncio.wait_for(opener, timeout=timeout_s)
    except TimeoutError:
        return PortCheckResult(
            host,
            port,
            False,
            ProbeFailureKind.CONNECTION_TIMEOUT.value,
            f"Timed out after {timeout_s:.1f}s waiting for {host}:{port}.",
        )
    except ConnectionRefusedError:
        return PortCheckResult(
            host,
            port,
            False,
            ProbeFailureKind.CONNECTION_REFUSED.value,
            f"{host}:{port} refused the TCP connection.",
        )
    except OSError as exc:
        err = exc.errno
        if err in {errno.EHOSTUNREACH, errno.ENETUNREACH, errno.EHOSTDOWN}:
            return PortCheckResult(
                host,
                port,
                False,
                ProbeFailureKind.HOST_UNREACHABLE.value,
                f"Host {host} is unreachable ({exc}).",
            )
        if err in _refused_errnos():
            return PortCheckResult(
                host,
                port,
                False,
                ProbeFailureKind.CONNECTION_REFUSED.value,
                f"{host}:{port} refused the TCP connection.",
            )
        if err in _timeout_errnos():
            return PortCheckResult(
                host,
                port,
                False,
                ProbeFailureKind.CONNECTION_TIMEOUT.value,
                f"OS timeout connecting to {host}:{port}.",
            )
        return PortCheckResult(
            host,
            port,
            False,
            ProbeFailureKind.HOST_UNREACHABLE.value,
            f"Network error contacting {host}:{port}: {exc}",
        )
    else:
        writer.close()
        try:
            await writer.wait_closed()
        except OSError:
            pass
        return PortCheckResult(host, port, True, "open", f"{host}:{port} accepted a TCP connection.")


def raise_for_port(result: PortCheckResult) -> None:
    if result.reachable:
        return
    if result.kind == ProbeFailureKind.CONNECTION_REFUSED.value:
        raise PortRefused(result.host, result.port)
    if result.kind == ProbeFailureKind.CONNECTION_TIMEOUT.value:
        raise PortTimeout(result.host, result.port)
    raise HostUnreachable(result.host)
