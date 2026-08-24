Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) "frontend")
if (-not (Test-Path node_modules)) { npm install }
npm run build
Write-Host "Frontend dist: $(Join-Path (Get-Location) 'dist')"
