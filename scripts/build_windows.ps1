Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

& "$PSScriptRoot\build_frontend.ps1"
if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
pip install pyinstaller

$out = Join-Path $root "dist-windows"
New-Item -ItemType Directory -Force -Path $out | Out-Null
python -m PyInstaller --noconfirm --clean --distpath $out hashir_remote.spec
Write-Host "Windows one-folder build: $out\HashirSamsungRemote"
