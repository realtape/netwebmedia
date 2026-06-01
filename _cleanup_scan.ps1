function Get-DirSize {
  param($p)
  if (Test-Path -LiteralPath $p) {
    try {
      $s = (Get-ChildItem -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum).Sum
      if ($null -eq $s) { $s = 0 }
      [math]::Round($s/1MB, 1)
    } catch { 'ERR' }
  } else { 'N/A' }
}

$paths = [ordered]@{
  'User TEMP'              = $env:TEMP
  'Windows TEMP'           = 'C:\Windows\Temp'
  'Windows Update cache'   = 'C:\Windows\SoftwareDistribution\Download'
  'Windows Prefetch'       = 'C:\Windows\Prefetch'
  'Delivery Optimization'  = 'C:\Windows\SoftwareDistribution\DeliveryOptimization'
  'Chrome Cache'           = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
  'Chrome Code Cache'      = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache"
  'Chrome GPUCache'        = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\GPUCache"
  'Edge Cache'             = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
  'Edge Code Cache'        = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache"
  'Firefox Profiles'       = "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles"
  'IE/Edge INetCache'      = "$env:LOCALAPPDATA\Microsoft\Windows\INetCache"
  'CrashDumps'             = "$env:LOCALAPPDATA\CrashDumps"
  'WER ReportQueue'        = "$env:LOCALAPPDATA\Microsoft\Windows\WER\ReportQueue"
  'WER ReportArchive'      = "$env:LOCALAPPDATA\Microsoft\Windows\WER\ReportArchive"
  'Thumbnail Cache'        = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
  'Downloaded Installers'  = 'C:\Windows\Installer\$PatchCache$'
  'Defender Scan History'  = 'C:\ProgramData\Microsoft\Windows Defender\Scans\History'
  'Npm cache'              = "$env:APPDATA\npm-cache"
  'Yarn cache'             = "$env:LOCALAPPDATA\Yarn\Cache"
  'Pip cache'              = "$env:LOCALAPPDATA\pip\Cache"
  'NuGet cache'            = "$env:USERPROFILE\.nuget\packages"
  'VS Code workspaceStorage' = "$env:APPDATA\Code\User\workspaceStorage"
  'VS Code logs'           = "$env:APPDATA\Code\logs"
  'VS Code CachedData'     = "$env:APPDATA\Code\CachedData"
}

$results = foreach ($k in $paths.Keys) {
  [PSCustomObject]@{
    Location = $k
    Path     = $paths[$k]
    SizeMB   = (Get-DirSize $paths[$k])
  }
}

$results |
  Sort-Object { if ($_.SizeMB -is [double] -or $_.SizeMB -is [int]) { -[double]$_.SizeMB } else { 0 } } |
  Format-Table -AutoSize -Wrap

# Recycle Bin (special)
try {
  $shell = New-Object -ComObject Shell.Application
  $bin = $shell.Namespace(10)
  $rbSize = 0
  $rbCount = 0
  foreach ($i in $bin.Items()) { $rbSize += $i.Size; $rbCount++ }
  Write-Host ""
  Write-Host ("Recycle Bin: {0} items, {1} MB" -f $rbCount, [math]::Round($rbSize/1MB,1))
} catch { Write-Host "Recycle Bin: could not read" }

# Totals (numeric only)
$total = ($results | Where-Object { $_.SizeMB -is [double] -or $_.SizeMB -is [int] } | Measure-Object -Property SizeMB -Sum).Sum
Write-Host ""
Write-Host ("TOTAL (cache locations above): {0} MB / {1} GB" -f [math]::Round($total,1), [math]::Round($total/1024,2))
