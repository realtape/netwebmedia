$ErrorActionPreference = 'SilentlyContinue'

function Get-DirSize {
  param($p)
  if (Test-Path -LiteralPath $p) {
    try {
      $s = (Get-ChildItem -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum).Sum
      if ($null -eq $s) { $s = 0 }
      [math]::Round($s/1MB, 1)
    } catch { 0 }
  } else { 0 }
}

function Clear-DirContents {
  param($p, $label)
  $before = Get-DirSize $p
  if (-not (Test-Path -LiteralPath $p)) {
    return [PSCustomObject]@{ Label=$label; BeforeMB=0; AfterMB=0; FreedMB=0; Status='SKIP (not found)' }
  }
  $errors = 0
  Get-ChildItem -LiteralPath $p -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop
    } catch { $errors++ }
  }
  $after = Get-DirSize $p
  $freed = [math]::Round($before - $after, 1)
  $status = if ($errors -gt 0) { "OK ($errors files locked, kept)" } else { 'OK' }
  [PSCustomObject]@{ Label=$label; BeforeMB=$before; AfterMB=$after; FreedMB=$freed; Status=$status }
}

$targets = [ordered]@{
  'User TEMP'              = $env:TEMP
  'Chrome Cache'           = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
  'VS Code CachedData'     = "$env:APPDATA\Code\CachedData"
  'Edge Cache'             = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
  'Chrome Code Cache'      = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache"
  'Thumbnail Cache'        = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
  'Edge Code Cache'        = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache"
  'Windows Update cache'   = 'C:\Windows\SoftwareDistribution\Download'
  'Chrome GPUCache'        = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\GPUCache"
  'VS Code logs'           = "$env:APPDATA\Code\logs"
}

$results = foreach ($k in $targets.Keys) { Clear-DirContents $targets[$k] $k }
$results | Format-Table -AutoSize

$totalFreed = ($results | Measure-Object -Property FreedMB -Sum).Sum
Write-Host ""
Write-Host ("TOTAL FREED: {0} MB" -f [math]::Round($totalFreed, 1))
