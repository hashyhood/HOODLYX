"""Network interface listing for the laptop LAN IP."""

from __future__ import annotations

from app.security.local_ip import local_ipv4_addresses, primary_lan_ip


def describe_interfaces() -> dict[str, str | list[str] | None]:
    addresses = local_ipv4_addresses()
    return {
        "primary": primary_lan_ip(),
        "private_ipv4": addresses,
    }
