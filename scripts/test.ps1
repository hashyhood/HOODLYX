Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

python -m ruff check backend tools tests
python -m mypy backend
python -m pytest
Push-Location frontend
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
Pop-Location
