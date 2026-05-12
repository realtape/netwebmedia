$ErrorActionPreference = 'SilentlyContinue'

Write-Host "===== Claude VM bundles — duplicate or hardlink? =====" -ForegroundColor Cyan
$a = 'C:\Users\Usuario\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\vm_bundles\claudevm.bundle\rootfs.vhdx'
$b = 'C:\Users\Usuario\AppData\Roaming\Claude\vm_bundles\claudevm.bundle\rootfs.vhdx'

if ((Test-Path -LiteralPath $a) -and (Test-Path -LiteralPath $b)) {
  $ai = Get-Item -LiteralPath $a -Force
  $bi = Get-Item -LiteralPath $b -Force
  Write-Host ("A LinkType: {0}" -f $ai.LinkType)
  Write-Host ("B LinkType: {0}" -f $bi.LinkType)
  Write-Host ""
  Write-Host "fsutil hardlink list (A):"
  fsutil hardlink list "$a"
  Write-Host ""
  Write-Host "fsutil hardlink list (B):"
  fsutil hardlink list "$b"
  Write-Host ""
  # Check parent dir reparse points
  $aParent = (Get-Item -LiteralPath 'C:\Users\Usuario\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming' -Force)
  Write-Host ("AppData\Local\Packages\Claude_*\LocalCache\Roaming LinkType: {0}" -f $aParent.LinkType)
  if ($aParent.LinkType) { Write-Host ("  -> Target: {0}" -f ($aParent.Target -join '; ')) }
} else {
  Write-Host "Paths missing - A exists: $(Test-Path -LiteralPath $a)  B exists: $(Test-Path -LiteralPath $b)"
}

Write-Host ""
Write-Host "===== Stale worktree check =====" -ForegroundColor Cyan
$wt = 'C:\Users\Usuario\Desktop\NetWebMedia\.claude\worktrees\distracted-easley-b51383'
if (Test-Path -LiteralPath $wt) {
  Write-Host "Worktree path exists: $wt"
  Push-Location $wt
  try {
    Write-Host ""
    Write-Host "--- git status ---"
    git status --short 2>&1
    Write-Host ""
    Write-Host "--- git log -3 ---"
    git log --oneline -3 2>&1
    Write-Host ""
    Write-Host "--- branch ---"
    git branch --show-current 2>&1
    Write-Host ""
    Write-Host "--- Last modified files (top 5) ---"
    Get-ChildItem -LiteralPath $wt -Recurse -File -Force -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch 'node_modules|\.git' } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 5 LastWriteTime, @{n='Path';e={$_.FullName.Substring($wt.Length+1)}} |
      Format-Table -AutoSize
  } finally { Pop-Location }
  Write-Host ""
  Write-Host "--- git worktree list (from main repo) ---"
  Push-Location 'C:\Users\Usuario\Desktop\NetWebMedia'
  git worktree list 2>&1
  Pop-Location
} else {
  Write-Host "Worktree not found"
}
