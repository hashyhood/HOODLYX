# Packaging commands and artifact paths

## Quality gates (Linux / this repository)

```bash
python3 -m ruff check .
python3 -m mypy backend
python3 -m pytest
cd frontend && npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e
```

## Windows release (run on Windows)

```powershell
.\scripts\package_release.ps1
```

Exact artifact path after a successful Windows build:

```text
release\HashirSamsungRemote\HashirSamsungRemote.exe
```

One-folder layout (easier to diagnose than one-file):

```text
release\HashirSamsungRemote\
  HashirSamsungRemote.exe
  _internal\
  THIRD_PARTY_LICENSES.md
  LGPL-3.0.txt
  GPL-3.0.txt
```

PyInstaller spec: `hashir_remote.spec` (one-folder / COLLECT).

## Linux packaging smoke test (this cloud environment)

This agent is Linux, so it cannot emit a real Windows PE executable. A PyInstaller one-folder **Linux** smoke test was produced with:

```bash
python3 -m PyInstaller --noconfirm --clean --distpath dist-windows hashir_remote.spec
```

Linux artifact path:

```text
dist-windows/HashirSamsungRemote/HashirSamsungRemote
```

Rebuild the frontend into `frontend/dist` first (`cd frontend && npm run build`). The Windows host serves that directory from FastAPI.
