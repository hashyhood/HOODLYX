# Security

Household LAN only. No cloud relay, no Samsung account, no port forwarding.

## Binding and clients

- Laptop UI is served by the Windows host.
- Phone access is **off** until you enable it.
- When enabled, clients must be private IPv4 and, where practical, the same subnet.
- Public internet destinations and public client IPs are rejected.
- CORS is not wildcarded. State-changing requests need CSRF (`X-CSRF-Token` + cookie).
- Control endpoints require a laptop loopback session or a redeemed phone session (HttpOnly SameSite cookie).
- Rate limits apply to remote keys and pairing.

## Secrets

- Host secret: at least 256 bits of `os.urandom`.
- TV token and session ID: Windows Credential Manager via `keyring` (encrypted file fallback).
- Phone one-time codes expire after a few minutes or first use. All sessions can be revoked.
- Logs, diagnostics exports, and the UI never include full tokens, encryption context, session IDs, or phone secrets.

## Warnings

An **untrusted shared Wi-Fi** is unsafe. Do not enable phone access on cafe/guest networks.

Do not expose ports **8000** or **8080** (or the host port) through the router.

Windows Firewall: the app **does not** silently add broad inbound rules. You must consent.

## LGPL

`samsungtvws` is LGPL-3.0. Combined Windows builds must keep notices and allow relinking against a modified library (one-folder PyInstaller layout plus documented dependency). See `docs/THIRD_PARTY_LICENSES.md`.
