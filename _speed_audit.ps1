$ErrorActionPreference = 'SilentlyContinue'

Write-Host "===== SYSTEM SNAPSHOT =====" -ForegroundColor Cyan

# OS + uptime
$os = Get-CimInstance Win32_OperatingSystem
$uptime = (Get-Date) - $os.LastBootUpTime
Write-Host ("OS: {0}" -f $os.Caption)
Write-Host ("Uptime: {0:N0} days, {1} hours" -f $uptime.TotalDays, $uptime.Hours)
Write-Host ("RAM: {0:N1} GB total, {1:N1} GB free ({2:N0}% used)" -f `
  ($os.TotalVisibleMemorySize/1MB), ($os.FreePhysicalMemory/1MB), `
  ((1 - $os.FreePhysicalMemory/$os.TotalVisibleMemorySize)*100))

# CPU
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Write-Host ("CPU: {0} ({1} cores, {2} logical)" -f $cpu.Name.Trim(), $cpu.NumberOfCores, $cpu.NumberOfLogicalProcessors)

# Disk
Write-Host ""
Write-Host "===== DISK USAGE =====" -ForegroundColor Cyan
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
  $usedPct = if ($_.Size -gt 0) { [math]::Round((1 - $_.FreeSpace/$_.Size)*100, 1) } else { 0 }
  Write-Host ("{0} {1:N1} GB total, {2:N1} GB free ({3}% used)" -f $_.DeviceID, ($_.Size/1GB), ($_.FreeSpace/1GB), $usedPct)
}

# Startup programs (the BIG speed win on most PCs)
Write-Host ""
Write-Host "===== STARTUP PROGRAMS =====" -ForegroundColor Cyan
$startup = Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location
$startup | Format-Table -AutoSize -Wrap
Write-Host ("Total startup entries: {0}" -f $startup.Count)

# Top RAM hogs
Write-Host ""
Write-Host "===== TOP 15 RAM USERS =====" -ForegroundColor Cyan
Get-Process | Sort-Object -Property WorkingSet64 -Descending |
  Select-Object -First 15 @{n='Name';e={$_.ProcessName}}, @{n='RAM_MB';e={[math]::Round($_.WorkingSet64/1MB,1)}}, @{n='CPU_s';e={[math]::Round($_.CPU,0)}}, Id |
  Format-Table -AutoSize

# Repo-level node_modules sizes
Write-Host ""
Write-Host "===== REPO node_modules =====" -ForegroundColor Cyan
$repo = 'C:\Users\Usuario\Desktop\NetWebMedia'
Get-ChildItem -LiteralPath $repo -Recurse -Directory -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq 'node_modules' } |
  ForEach-Object {
    $sz = (Get-ChildItem -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue |
           Measure-Object Length -Sum).Sum
    [PSCustomObject]@{ Path = $_.FullName.Substring($repo.Length+1); SizeMB = [math]::Round($sz/1MB,1) }
  } | Sort-Object SizeMB -Descending | Format-Table -AutoSize

# Largest files in user profile (over 100 MB)
Write-Host ""
Write-Host "===== FILES >100 MB IN USER PROFILE =====" -ForegroundColor Cyan
Get-ChildItem -LiteralPath $env:USERPROFILE -Recurse -File -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Length -gt 100MB } |
  Sort-Object Length -Descending |
  Select-Object -First 20 @{n='SizeMB';e={[math]::Round($_.Length/1MB,1)}}, @{n='Path';e={$_.FullName.Replace($env:USERPROFILE,'~')}} |
  Format-Table -AutoSize -Wrap

# Background services running but maybe unneeded
Write-Host ""
Write-Host "===== HEAVY SERVICES (auto-start, running) =====" -ForegroundColor Cyan
Get-CimInstance Win32_Service -Filter "State='Running' AND StartMode='Auto'" |
  Select-Object Name, DisplayName | Sort-Object DisplayName | Format-Table -AutoSize -Wrap | Out-String -Width 200 |
  ForEach-Object { ($_ -split "`n" | Select-Object -First 50) -join "`n" }

# Power plan
Write-Host ""
Write-Host "===== POWER PLAN =====" -ForegroundColor Cyan
powercfg /getactivescheme
