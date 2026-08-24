# Third-party licenses

## samsungtvws 3.0.5 — LGPL-3.0

- PyPI: https://pypi.org/project/samsungtvws/3.0.5/
- Source: https://github.com/xchwarze/samsung-tv-ws-api
- License: GNU Lesser General Public License v3.0

This application **uses samsungtvws as an installed dependency**. It does **not** copy the library’s source into `backend/` or `tools/`. We have not modified LGPL-covered source.

The Windows one-folder build includes the library as `.pyd`/`.so`/`.py` files inside the bundle. You may replace that copy with a compatible modified build of samsungtvws 3.0.x (LGPL §4). Corresponding source is the upstream tag for 3.0.5.

Full license text:

- `docs/licenses/LGPL-3.0.txt`
- `docs/licenses/GPL-3.0.txt` (referenced by LGPL)

## Other runtime dependencies (summaries)

| Package | Use | Typical license |
| --- | --- | --- |
| FastAPI / Starlette / Uvicorn | HTTP host | BSD / BSD |
| aiohttp, websockets | TV HTTP/WS | Apache-2.0 / BSD |
| Pydantic | models | MIT |
| cryptography | encrypted fallback + samsungtvws extra | Apache-2.0 / BSD |
| keyring | Windows Credential Manager | MIT |
| qrcode, Pillow | QR / tray icon | BSD / HPND |
| pystray | tray | LGPL-style / MIT (see package) |
| React, Vite | PWA | MIT |

Verify SPDX metadata of pinned wheels when redistributing.
