# Backup helper (run manually or via scheduler)
param(
  [string]$BackupDir = ".\backups"
)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $BackupDir $timestamp
New-Item -ItemType Directory -Path $target -Force | Out-Null
if (Test-Path "storage\data.json") { Copy-Item "storage\data.json" (Join-Path $target "data.json") }
if (Test-Path "storage\uploads") { Copy-Item "storage\uploads" (Join-Path $target "uploads") -Recurse }
Write-Host "Backup created at $target"