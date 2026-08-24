# Development host
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
if (-not (Test-Path frontend\node_modules)) { Push-Location frontend; npm install; Pop-Location }
if (-not (Test-Path frontend\dist\index.html)) { & "$PSScriptRoot\build_frontend.ps1" }

$env:H6400_OPEN_BROWSER = "true"
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8787 --reload
