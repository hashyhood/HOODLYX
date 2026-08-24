Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
& "$PSScriptRoot\build_windows.ps1"
$release = Join-Path $root "release"
New-Item -ItemType Directory -Force -Path $release | Out-Null
$src = Join-Path $root "dist-windows\HashirSamsungRemote"
Copy-Item -Recurse -Force $src $release
Copy-Item -Force (Join-Path $root "docs\THIRD_PARTY_LICENSES.md") (Join-Path $release "HashirSamsungRemote\THIRD_PARTY_LICENSES.md")
Copy-Item -Force (Join-Path $root "docs\licenses\LGPL-3.0.txt") (Join-Path $release "HashirSamsungRemote\LGPL-3.0.txt")
Copy-Item -Force (Join-Path $root "docs\licenses\GPL-3.0.txt") (Join-Path $release "HashirSamsungRemote\GPL-3.0.txt")
Write-Host "Release folder: $release\HashirSamsungRemote"
