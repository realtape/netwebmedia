# scripts/ig_publish/setup-ig.ps1
#
# One-time credential setup for the IG autonomous publisher.
# Run from PowerShell at repo root:
#     .\scripts\ig_publish\setup-ig.ps1
#
# Prompts for the @netwebmedia IG password in a masked dialog (chars never echo
# in terminal or chat). Writes credentials to .env.ig which is gitignored, so
# the file never leaves your machine. The ig_publish.py script reads it.
#
# Subsequent IG posts are then one-command:
#     python scripts/ig_publish/ig_publish.py carousel campaign-cmo-en-3slide
#     python scripts/ig_publish/ig_publish.py reel    campaign-cmo-en-3slide

$ErrorActionPreference = "Stop"

$cred = Get-Credential -UserName "netwebmedia" -Message "Enter @netwebmedia Instagram password (chars are masked)"
if (-not $cred) {
    Write-Host "Cancelled. No .env.ig written." -ForegroundColor Yellow
    exit 1
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$envPath  = Join-Path $repoRoot ".env.ig"

# Write with no BOM, LF line endings, UTF-8
$body = "IG_USERNAME=$($cred.UserName)`nIG_PASSWORD=$($cred.GetNetworkCredential().Password)"
[System.IO.File]::WriteAllText($envPath, $body, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "[OK] Credentials written to $envPath" -ForegroundColor Green
Write-Host "     (gitignored - file stays on your machine)"
Write-Host ""
Write-Host "Next: python scripts/ig_publish/ig_publish.py status"
