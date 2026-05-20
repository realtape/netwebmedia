$ErrorActionPreference = 'SilentlyContinue'
$a = 'C:\Users\Usuario\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\vm_bundles\claudevm.bundle\rootfs.vhdx'
$b = 'C:\Users\Usuario\AppData\Roaming\Claude\vm_bundles\claudevm.bundle\rootfs.vhdx'
Write-Host "A exists: $(Test-Path -LiteralPath $a)"
Write-Host "B exists: $(Test-Path -LiteralPath $b)"
if (Test-Path -LiteralPath $a) {
  $ai = Get-Item -LiteralPath $a -Force
  Write-Host "A LinkType: $($ai.LinkType)  Size: $([math]::Round($ai.Length/1GB,2)) GB"
}
if (Test-Path -LiteralPath $b) {
  $bi = Get-Item -LiteralPath $b -Force
  Write-Host "B LinkType: $($bi.LinkType)  Size: $([math]::Round($bi.Length/1GB,2)) GB"
}
Write-Host ""
Write-Host "fsutil hardlink list A:"
fsutil hardlink list "$a"
Write-Host ""
Write-Host "fsutil hardlink list B:"
fsutil hardlink list "$b"
Write-Host ""
Write-Host "Check parent reparse points:"
$p1 = 'C:\Users\Usuario\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming'
if (Test-Path -LiteralPath $p1) {
  $i = Get-Item -LiteralPath $p1 -Force
  Write-Host "P1 LinkType: $($i.LinkType)  Target: $($i.Target)"
}
