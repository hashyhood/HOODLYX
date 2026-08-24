"""Windows Firewall guidance. Never creates broad rules without consent."""

from __future__ import annotations

import sys


def firewall_guidance(port: int, lan_ip: str) -> dict[str, str | bool]:
    if sys.platform != "win32":
        return {
            "platform": sys.platform,
            "automatic_rule_created": False,
            "guidance": (
                "Phone access requires inbound TCP on the host port from the same LAN. "
                "This application does not create firewall rules automatically."
            ),
        }
    return {
        "platform": "win32",
        "automatic_rule_created": False,
        "guidance": (
            "If the phone cannot reach the laptop, Windows Defender Firewall may be blocking "
            f"inbound TCP {port} on {lan_ip}. Allow the Hashir Samsung Remote app for Private "
            "networks only. Do not create a Public-profile rule, and do not forward this port "
            "on the router. Example (run yourself only if you understand it):\n"
            f'netsh advfirewall firewall add rule name="Hashir Samsung Remote LAN" '
            f'dir=in action=allow protocol=TCP localport={port} profile=private'
        ),
    }
