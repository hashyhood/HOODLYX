# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller one-folder spec for Hashir Samsung Remote (Windows host)."""

from pathlib import Path

from PyInstaller.utils.hooks import collect_all, copy_metadata

block_cipher = None
root = Path(SPECPATH)

datas = [
    (str(root / "frontend" / "dist"), "frontend/dist"),
    (str(root / "docs" / "THIRD_PARTY_LICENSES.md"), "docs"),
    (str(root / "docs" / "licenses"), "docs/licenses"),
]
binaries = []
hiddenimports = [
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "keyring.backends",
    "keyring.backends.Windows",
    "keyring.backends.macOS",
    "keyring.backends.SecretService",
    "samsungtvws",
    "samsungtvws.encrypted",
    "samsungtvws.encrypted.authenticator",
    "samsungtvws.encrypted.remote",
    "pystray._win32",
]

for pkg in ("samsungtvws", "cryptography", "pydantic", "fastapi", "starlette", "anyio"):
    pkg_datas, pkg_bins, pkg_hidden = collect_all(pkg)
    datas += pkg_datas
    binaries += pkg_bins
    hiddenimports += pkg_hidden
    try:
        datas += copy_metadata(pkg)
    except Exception:
        pass

a = Analysis(
    [str(root / "backend" / "app" / "main.py")],
    pathex=[str(root / "backend")],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter"],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="HashirSamsungRemote",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    name="HashirSamsungRemote",
)
