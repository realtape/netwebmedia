$ErrorActionPreference = 'SilentlyContinue'
Write-Output "==== Physical disks ===="
Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, MediaType, @{N='SizeGB';E={[math]::Round($_.Size/1GB,0)}}, BusType | Format-Table -AutoSize | Out-String | Write-Output

Write-Output "==== Partition -> Disk mapping ===="
Get-Partition | Where-Object { $_.DriveLetter } | ForEach-Object {
  $d = Get-Disk -Number $_.DiskNumber
  Write-Output ("{0}:  Disk#{1}  {2}  Bus={3}" -f $_.DriveLetter, $_.DiskNumber, $d.FriendlyName, $d.BusType)
}

Write-Output "==== iRacing install locations ===="
foreach ($p in @('C:\Program Files\iRacing','C:\Program Files (x86)\iRacing','C:\iRacing','D:\iRacing','C:\Users\Usuario\Documents\iRacing','D:\Documents\iRacing')) {
  if (Test-Path $p) { Write-Output ("FOUND: " + $p) }
}
Get-ChildItem 'C:\' -Directory -Filter 'iRacing*' -ErrorAction SilentlyContinue | ForEach-Object { Write-Output ("ROOT: " + $_.FullName) }

Write-Output "==== OBS config (recording path) ===="
$obs = "C:\Users\Usuario\AppData\Roaming\obs-studio\basic\profiles"
if (Test-Path $obs) {
  Get-ChildItem $obs -Directory | ForEach-Object {
    $ini = Join-Path $_.FullName 'basic.ini'
    if (Test-Path $ini) {
      Write-Output ("--- profile: " + $_.Name + " ---")
      Select-String -Path $ini -Pattern 'FilePath|RecFilePath|RecFormat|VBitrate|Encoder' -ErrorAction SilentlyContinue | ForEach-Object { Write-Output $_.Line }
    }
  }
} else { Write-Output "OBS profiles dir not found" }
