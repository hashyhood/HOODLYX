"""Typed failures for the H-series encrypted protocol. No silent Tizen fallback."""

from __future__ import annotations

from enum import StrEnum


class ProbeFailureKind(StrEnum):
    HOST_UNREACHABLE = "host_unreachable"
    CONNECTION_REFUSED = "connection_refused"
    CONNECTION_TIMEOUT = "connection_timeout"
    PAIRING_REJECTED = "pairing_rejected"
    INVALID_PIN = "invalid_pin"
    PROTOCOL_ERROR = "protocol_error"
    STORED_CREDENTIALS_REJECTED = "stored_credentials_rejected"
    PUBLIC_IP_REJECTED = "public_ip_rejected"
    INVALID_INPUT = "invalid_input"
    TV_OFFLINE = "tv_offline"
    NOT_CONFIGURED = "not_configured"
    NOT_PAIRED = "not_paired"
    UNKNOWN = "unknown"


class RemoteError(Exception):
    def __init__(
        self,
        message: str,
        *,
        kind: ProbeFailureKind = ProbeFailureKind.UNKNOWN,
        likely_cause: str | None = None,
        retryable: bool = False,
    ) -> None:
        super().__init__(message)
        self.kind = kind
        self.likely_cause = likely_cause
        self.retryable = retryable

    def to_dict(self) -> dict[str, str | bool]:
        return {
            "error": str(self),
            "kind": self.kind.value,
            "likely_cause": self.likely_cause or "",
            "retryable": self.retryable,
        }


class PublicIpRejected(RemoteError):
    def __init__(self, host: str) -> None:
        super().__init__(
            f"Refusing to contact public internet address {host}. This remote is local-network only.",
            kind=ProbeFailureKind.PUBLIC_IP_REJECTED,
            likely_cause="The destination is not a private/LAN IPv4 address.",
        )


class HostUnreachable(RemoteError):
    def __init__(self, host: str) -> None:
        super().__init__(
            f"Host {host} is unreachable.",
            kind=ProbeFailureKind.HOST_UNREACHABLE,
            likely_cause="Wrong IP, TV offline, different Wi-Fi, guest isolation, or VPN.",
            retryable=True,
        )


class PortRefused(RemoteError):
    def __init__(self, host: str, port: int) -> None:
        super().__init__(
            f"{host}:{port} refused the connection.",
            kind=ProbeFailureKind.CONNECTION_REFUSED,
            likely_cause="Port closed, IP belongs to another device, or firmware uses a different port.",
            retryable=True,
        )


class PortTimeout(RemoteError):
    def __init__(self, host: str, port: int) -> None:
        super().__init__(
            f"Timed out connecting to {host}:{port}.",
            kind=ProbeFailureKind.CONNECTION_TIMEOUT,
            likely_cause="Firewall, AP isolation, TV sleeping, or incorrect IP. Do not assume the TV is unsupported after one timeout.",
            retryable=True,
        )


class PairingRejected(RemoteError):
    def __init__(self, message: str = "The television rejected pairing.") -> None:
        super().__init__(
            message,
            kind=ProbeFailureKind.PAIRING_REJECTED,
            likely_cause="TV denied the pairing request, PIN page did not open, or firmware variation.",
        )


class InvalidPinError(RemoteError):
    def __init__(self, message: str = "The PIN was rejected or pairing did not complete.") -> None:
        super().__init__(
            message,
            kind=ProbeFailureKind.INVALID_PIN,
            likely_cause="Wrong PIN, expired PIN, or the PIN was not entered within the TV timeout.",
        )


class ProtocolError(RemoteError):
    def __init__(self, message: str) -> None:
        super().__init__(
            message,
            kind=ProbeFailureKind.PROTOCOL_ERROR,
            likely_cause="Unexpected H-series encrypted protocol response or library error.",
        )


class CredentialsRejected(RemoteError):
    def __init__(self) -> None:
        super().__init__(
            "Stored pairing credentials were rejected by the television.",
            kind=ProbeFailureKind.STORED_CREDENTIALS_REJECTED,
            likely_cause="TV forgot the device, credentials were reset, or firmware changed. Pair again. Do not retry forever.",
        )


class NotConfigured(RemoteError):
    def __init__(self) -> None:
        super().__init__(
            "No television is configured. Enter the TV IP on the Setup page first.",
            kind=ProbeFailureKind.NOT_CONFIGURED,
            likely_cause="The host has no saved device. This is not a pairing-credential failure.",
        )


class NotPaired(RemoteError):
    def __init__(self) -> None:
        super().__init__(
            "The television is not paired yet. Complete Setup and enter the PIN shown on the TV.",
            kind=ProbeFailureKind.NOT_PAIRED,
            likely_cause="No stored token or session ID. Pair before sending remote keys.",
        )


class DangerousKeyRejected(RemoteError):
    def __init__(self, key: str) -> None:
        super().__init__(
            f"Key {key!r} is not on the production allowlist.",
            kind=ProbeFailureKind.INVALID_INPUT,
            likely_cause="The client attempted a raw or dangerous command.",
        )
