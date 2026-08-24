"""Private/local IPv4 validation. Public internet destinations are rejected."""

from __future__ import annotations

import ipaddress
import socket
from collections.abc import Iterable

from app.samsung.errors import PublicIpRejected

_PRIVATE_NETWORKS = (
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
)


def parse_ipv4(value: str) -> ipaddress.IPv4Address:
    text = value.strip()
    if not text:
        raise ValueError("IP address is required.")
    try:
        addr = ipaddress.ip_address(text)
    except ValueError as exc:
        raise ValueError(f"Invalid IP address: {value}") from exc
    if not isinstance(addr, ipaddress.IPv4Address):
        raise ValueError("Only IPv4 destinations are supported for this television.")
    return addr


def is_loopback(addr: ipaddress.IPv4Address) -> bool:
    return addr.is_loopback


def is_private_lan(addr: ipaddress.IPv4Address) -> bool:
    if addr.is_loopback:
        return True
    return any(addr in network for network in _PRIVATE_NETWORKS)


def is_public_internet(addr: ipaddress.IPv4Address) -> bool:
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_unspecified
        or addr.is_reserved
    )


def require_private_tv_host(host: str) -> ipaddress.IPv4Address:
    addr = parse_ipv4(host)
    if addr.is_loopback:
        raise ValueError("The television IP cannot be a loopback address.")
    if addr.is_unspecified or addr.is_multicast or is_public_internet(addr) or not is_private_lan(addr):
        raise PublicIpRejected(host)
    return addr


def require_private_client_ip(host: str) -> ipaddress.IPv4Address:
    addr = parse_ipv4(host)
    if not is_private_lan(addr):
        raise PublicIpRejected(host)
    return addr


def parse_port(value: int | str) -> int:
    try:
        port = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("Port must be an integer.") from exc
    if port < 1 or port > 65535:
        raise ValueError("Port must be between 1 and 65535.")
    return port


def same_subnet(a: ipaddress.IPv4Address, b: ipaddress.IPv4Address, prefix: int = 24) -> bool:
    net = ipaddress.IPv4Network((int(a), prefix), strict=False)
    return b in net


def local_ipv4_addresses() -> list[str]:
    found: list[str] = []
    hostname = socket.gethostname()
    try:
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            addr = ipaddress.ip_address(ip)
            if isinstance(ip, str) and isinstance(addr, ipaddress.IPv4Address) and is_private_lan(addr) and not addr.is_loopback:
                if ip not in found:
                    found.append(ip)
    except OSError:
        pass
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        probe.settimeout(0.2)
        probe.connect(("192.168.1.1", 80))
        ip = probe.getsockname()[0]
        probe.close()
        addr = ipaddress.ip_address(ip)
        if isinstance(addr, ipaddress.IPv4Address) and is_private_lan(addr) and ip not in found:
            found.insert(0, ip)
    except OSError:
        pass
    return found


def primary_lan_ip() -> str | None:
    addresses = local_ipv4_addresses()
    return addresses[0] if addresses else None


def client_on_allowed_network(
    client_ip: str,
    lan_ips: Iterable[str],
    *,
    allow_loopback: bool = True,
) -> bool:
    try:
        addr = parse_ipv4(client_ip)
    except ValueError:
        return False
    if allow_loopback and addr.is_loopback:
        return True
    if not is_private_lan(addr) or addr.is_loopback:
        return False
    for lan in lan_ips:
        try:
            if same_subnet(parse_ipv4(lan), addr):
                return True
        except ValueError:
            continue
    return False
