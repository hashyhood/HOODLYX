#!/usr/bin/env python3
"""Hardware probe for Samsung UA55H6400 (2014 H-series encrypted protocol).

Prove reachability, pairing, KEY_VOLUP/KEY_VOLDOWN, then reconnect with stored
credentials and send KEY_MUTE twice. Never falls back to Tizen ports 8001/8002.

Usage:
  python tools/h6400_probe.py --host 192.168.1.50
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TextIO

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.config import (  # noqa: E402
    DEFAULT_AUTH_PORT,
    DEFAULT_REMOTE_PORT,
    PROTOCOL_NAME,
    TV_MODEL,
    default_data_dir,
)
from app.samsung.errors import (  # noqa: E402
    CredentialsRejected,
    InvalidPinError,
    PairingRejected,
    ProbeFailureKind,
    ProtocolError,
    PublicIpRejected,
    RemoteError,
)
from app.samsung.h_series_encrypted import HSeriesEncryptedRemote  # noqa: E402
from app.samsung.models import DeviceRecord  # noqa: E402
from app.samsung.pairing import validate_pin  # noqa: E402
from app.samsung.reachability import check_tcp_port  # noqa: E402
from app.security.local_ip import (  # noqa: E402
    local_ipv4_addresses,
    parse_port,
    primary_lan_ip,
    require_private_tv_host,
)
from app.security.redact import RedactingFilter, mask_secret  # noqa: E402
from app.storage.credential_store import CredentialStore  # noqa: E402
from app.storage.device_store import DeviceStore  # noqa: E402

PASS = "PASS"
FAIL = "FAIL"


@dataclass
class ProbeReport:
    ok: bool = False
    steps: list[dict[str, Any]] = field(default_factory=list)
    failure_kind: str | None = None
    likely_cause: str | None = None
    tv_host: str | None = None
    local_ip: str | None = None
    auth_port: int = DEFAULT_AUTH_PORT
    remote_port: int = DEFAULT_REMOTE_PORT
    protocol: str = PROTOCOL_NAME
    model: str = TV_MODEL
    pin_displayed: bool | None = None
    credentials_stored: bool = False
    volup_sent: bool = False
    voldown_sent: bool = False
    mute_reconnect_sent: bool = False
    software_version: str | None = None

    def add(self, name: str, ok: bool, detail: str, **extra: Any) -> None:
        self.steps.append({"name": name, "ok": ok, "detail": detail, **extra})

    def to_sanitized_dict(self) -> dict[str, Any]:
        return {
            "result": PASS if self.ok else FAIL,
            "model": self.model,
            "protocol": self.protocol,
            "tv_host": self.tv_host,
            "local_ip": self.local_ip,
            "auth_port": self.auth_port,
            "remote_port": self.remote_port,
            "pin_displayed": self.pin_displayed,
            "credentials_stored": self.credentials_stored,
            "volup_sent": self.volup_sent,
            "voldown_sent": self.voldown_sent,
            "mute_reconnect_sent": self.mute_reconnect_sent,
            "failure_kind": self.failure_kind,
            "likely_cause": self.likely_cause,
            "software_version": self.software_version,
            "steps": self.steps,
            "generated_at": datetime.now(UTC).isoformat(),
            "note": (
                "This report never includes tokens, session IDs, or encryption context. "
                "Physical TV behaviour is only proven when this probe is run against the real set."
            ),
        }


def _prompt_pin(stdin: TextIO) -> str:
    print()
    print("=" * 72)
    print("Look at the television. A four-digit PIN should be on the TV screen.")
    print("The Windows/laptop host is talking to the H-series encrypted pairing service.")
    print("This is not the modern Tizen WebSocket protocol (ports 8001/8002).")
    print("=" * 72)
    pin = input("Enter the four-digit PIN from the TV: ").strip()
    return validate_pin(pin)


def _print_secret_saved(label: str, value: str) -> None:
    print(f"  stored {label}: {mask_secret(value)}")


async def run_probe(args: argparse.Namespace) -> ProbeReport:
    report = ProbeReport(
        tv_host=args.host,
        auth_port=parse_port(args.auth_port),
        remote_port=parse_port(args.remote_port),
        software_version=args.software_version,
        local_ip=primary_lan_ip() or (local_ipv4_addresses() or ["unknown"])[0],
    )
    print(f"Local computer IP : {report.local_ip}")
    print(f"Television IP     : {args.host}")
    print(f"Auth port         : {report.auth_port}")
    print(f"Remote port       : {report.remote_port}")
    print(f"Protocol          : {PROTOCOL_NAME}")
    print(f"Model             : {TV_MODEL}")
    print()

    try:
        require_private_tv_host(args.host)
        report.add("private_ip", True, f"{args.host} is a private/LAN address.")
    except (PublicIpRejected, ValueError) as exc:
        report.failure_kind = ProbeFailureKind.PUBLIC_IP_REJECTED.value
        report.likely_cause = str(exc)
        report.add("private_ip", False, str(exc))
        print(f"FAIL: {exc}")
        return report

    data_dir = default_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    credentials = CredentialStore(data_dir)
    devices = DeviceStore(data_dir / "device.json")

    if args.reset_pairing:
        credentials.delete()
        print("Stored pairing credentials cleared (--reset-pairing).")

    auth = await check_tcp_port(args.host, report.auth_port, timeout_s=2.0)
    remote = await check_tcp_port(args.host, report.remote_port, timeout_s=2.0)
    report.add("tcp_auth", auth.reachable, auth.detail, kind=auth.kind)
    report.add("tcp_remote", remote.reachable, remote.detail, kind=remote.kind)
    print(f"Port {report.auth_port}: {'open' if auth.reachable else auth.kind} — {auth.detail}")
    print(f"Port {report.remote_port}: {'open' if remote.reachable else remote.kind} — {remote.detail}")

    if not auth.reachable:
        report.failure_kind = auth.kind
        report.likely_cause = _cause_for(auth.kind, report.auth_port)
        print("FAIL: authentication port is not reachable. Not switching to Tizen 8001/8002.")
        print(f"Likely cause: {report.likely_cause}")
        return report
    if not remote.reachable:
        print(
            "WARN: remote-control port is not reachable yet. Pairing may still display a PIN; "
            "control will fail until this port opens."
        )

    adapter = HSeriesEncryptedRemote(
        args.host,
        auth_port=report.auth_port,
        remote_port=report.remote_port,
    )
    stored = None if args.reset_pairing else credentials.load()
    if stored:
        print("Found stored credentials (values redacted). Trying reconnect without pairing.")
        adapter.load_credentials(stored.token, stored.session_id)
        try:
            await adapter.connect()
            await adapter.send_key("KEY_VOLUP")
            report.volup_sent = True
            await asyncio.sleep(1.0)
            await adapter.send_key("KEY_VOLDOWN")
            report.voldown_sent = True
            await adapter.disconnect()
            await adapter.connect()
            await adapter.send_key("KEY_MUTE")
            await asyncio.sleep(0.4)
            await adapter.send_key("KEY_MUTE")
            report.mute_reconnect_sent = True
            report.credentials_stored = True
            report.ok = True
            report.add("stored_reconnect", True, "Reconnected with stored credentials and sent KEY_MUTE twice.")
            print("PASS: stored credentials work. Volume and mute commands were sent.")
            await adapter.aclose()
            return report
        except CredentialsRejected:
            print("Stored credentials were rejected. They will be marked invalid. Pairing again.")
            credentials.delete()
            report.add("stored_reconnect", False, "Stored credentials rejected; pairing required.")
        except RemoteError as exc:
            print(f"Stored-credential control failed ({exc.kind.value}): {exc}")
            report.add("stored_reconnect", False, str(exc), kind=exc.kind.value)

    try:
        await adapter.start_pairing()
        report.pin_displayed = True
        report.add("start_pairing", True, "Pairing flow started. Look at the television.")
        print("Pairing started. Look at the television for a four-digit PIN.")
    except RemoteError as exc:
        report.failure_kind = exc.kind.value
        report.likely_cause = exc.likely_cause
        report.pin_displayed = False
        report.add("start_pairing", False, str(exc), kind=exc.kind.value)
        print(f"FAIL: {exc}")
        print(f"Kind: {exc.kind.value}")
        print(f"Likely cause: {exc.likely_cause}")
        await adapter.aclose()
        return report

    try:
        pin = _prompt_pin(sys.stdin)
    except InvalidPinError as exc:
        report.failure_kind = exc.kind.value
        report.likely_cause = exc.likely_cause
        report.add("pin_format", False, str(exc))
        print(f"FAIL: {exc}")
        await adapter.aclose()
        return report

    try:
        creds = await adapter.confirm_pin(pin)
    except InvalidPinError as exc:
        report.failure_kind = exc.kind.value
        report.likely_cause = exc.likely_cause
        report.add("confirm_pin", False, str(exc))
        print(f"FAIL: PIN rejected. {exc}")
        await adapter.aclose()
        return report
    except (PairingRejected, ProtocolError, RemoteError) as exc:
        report.failure_kind = exc.kind.value
        report.likely_cause = exc.likely_cause
        report.add("confirm_pin", False, str(exc), kind=exc.kind.value)
        print(f"FAIL: {exc}")
        await adapter.aclose()
        return report

    credentials.save(creds)
    devices.save(
        DeviceRecord(
            host=args.host,
            display_name="UA55H6400",
            model=TV_MODEL,
            auth_port=report.auth_port,
            remote_port=report.remote_port,
            credentials_valid=True,
            software_version=args.software_version,
        )
    )
    report.credentials_stored = True
    _print_secret_saved("token", creds.token)
    _print_secret_saved("session_id", creds.session_id)
    report.add("confirm_pin", True, "PIN accepted. Token and session ID stored (redacted).")

    try:
        await adapter.connect()
        await adapter.send_key("KEY_VOLUP")
        report.volup_sent = True
        print("Sent KEY_VOLUP")
        await asyncio.sleep(1.0)
        await adapter.send_key("KEY_VOLDOWN")
        report.voldown_sent = True
        print("Sent KEY_VOLDOWN")
        await adapter.disconnect()
        print("Closed remote session. Reopening with stored credentials…")
        stored2 = credentials.load()
        if stored2 is None:
            raise ProtocolError("Credentials disappeared after save.")
        adapter.load_credentials(stored2.token, stored2.session_id)
        await adapter.connect()
        await adapter.send_key("KEY_MUTE")
        await asyncio.sleep(0.4)
        await adapter.send_key("KEY_MUTE")
        report.mute_reconnect_sent = True
        print("Sent KEY_MUTE twice after reconnect.")
        await adapter.disconnect()
        report.ok = True
        report.add("control", True, "KEY_VOLUP, KEY_VOLDOWN, reconnect, KEY_MUTE x2 succeeded.")
        print("PASS: hardware probe completed.")
    except RemoteError as exc:
        report.failure_kind = exc.kind.value
        report.likely_cause = exc.likely_cause
        report.add("control", False, str(exc), kind=exc.kind.value)
        print(f"FAIL: {exc}")
        print(f"Kind: {exc.kind.value}")
        print(f"Likely cause: {exc.likely_cause}")
    finally:
        await adapter.aclose()
    return report


def _cause_for(kind: str, port: int) -> str:
    mapping = {
        ProbeFailureKind.HOST_UNREACHABLE.value: (
            "Router, wrong IP, TV offline, guest Wi-Fi isolation, or VPN. Confirm the TV IP."
        ),
        ProbeFailureKind.CONNECTION_REFUSED.value: (
            f"Port {port} is closed on that host. Confirm the IP is the TV and try --auth-port / --remote-port."
        ),
        ProbeFailureKind.CONNECTION_TIMEOUT.value: (
            f"Firewall or AP isolation blocked port {port}. One timeout does not mean the TV is unsupported."
        ),
    }
    return mapping.get(kind, "See docs/TROUBLESHOOTING.md")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Samsung UA55H6400 encrypted-protocol hardware probe",
    )
    parser.add_argument("--host", required=True, help="Private IPv4 address of the television")
    parser.add_argument("--auth-port", type=int, default=DEFAULT_AUTH_PORT)
    parser.add_argument("--remote-port", type=int, default=DEFAULT_REMOTE_PORT)
    parser.add_argument("--reset-pairing", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument(
        "--software-version",
        default=None,
        help="Optional television software version recorded in the diagnostic report",
    )
    parser.add_argument(
        "--report",
        default=None,
        help="Write a sanitized JSON report to this path",
    )
    parser.add_argument(
        "--pin",
        default=None,
        help="Non-interactive PIN for automated hardware tests (never log this value)",
    )
    return parser


async def _async_main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger().addFilter(RedactingFilter())
    logging.getLogger("samsungtvws").addFilter(RedactingFilter())

    global _prompt_pin
    if args.pin is not None:
        pin_value = args.pin

        def _noninteractive(_stdin: Any) -> str:
            return validate_pin(pin_value)

        # local override for tests
        globals()["_prompt_pin"] = _noninteractive  # type: ignore[assignment]

    report = await run_probe(args)
    if args.report:
        Path(args.report).write_text(json.dumps(report.to_sanitized_dict(), indent=2), encoding="utf-8")
        print(f"Sanitized report written to {args.report}")
    print()
    print("RESULT:", PASS if report.ok else FAIL)
    return 0 if report.ok else 1


def main(argv: list[str] | None = None) -> int:
    try:
        return asyncio.run(_async_main(argv))
    except KeyboardInterrupt:
        print("Interrupted.")
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
