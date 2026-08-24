# Protocol notes — Samsung UA55H6400 / H-series encrypted v1

Target: Samsung UA55H6400 (2014, H6400, Orsay). Intended users: one household on one LAN.

## What this is

Samsung Smart View 2 / **encrypted v1** remote:

| Role | Default port | Transport |
| --- | --- | --- |
| Pairing / authentication | 8080 | HTTP (`CloudPINPage`, `ws/pairing`) |
| Encrypted remote | 8000 | HTTP handshake + websocket |

Four-digit PIN on the TV. After PIN: persistent **token** (encryption context) and **session ID**.

Implemented with the installed library `samsungtvws[async,encrypted]==3.0.5`:

- `SamsungTVEncryptedWSAsyncAuthenticator`
- `SamsungTVEncryptedWSAsyncRemote`
- `SendRemoteKey.click(...)`

The library is **not** vendored. This application does not copy samsungtvws sources.

## What this is not

- Not Tizen WebSocket remote on **8001/8002**
- Not Bluetooth
- Not a simulated dashboard
- Not Wake-on-LAN / network power-on (unsupported on this 2014 set)

## Command sending

Production allowlist only. No raw key box. Volume/channel long-press repeats **click** commands every ~300–350 ms and stops on pointer-up, pointer-cancel, blur, or page hide. A single serialized queue prevents concurrent writes.

Smart Hub: `KEY_CONTENTS`. Power off: `KEY_POWEROFF`.

## Future adapters (not in this MVP)

`TizenWebSocketRemote`, `AndroidEmbeddedHSeriesRemote`, `InfraredBridgeRemote` (BroadLink / Raspberry Pi / ESP32). Interfaces are reserved; they must not expand this milestone.

## Probe order

1. Private IP check  
2. TCP 8080 / 8000  
3. Display PIN  
4. Validate PIN  
5. Store token + session ID  
6. Connect encrypted remote  
7. `KEY_VOLUP`  
8. `KEY_VOLDOWN`  
9. Restart / reconnect with stored credentials  
10. Only then trust the full UI  
