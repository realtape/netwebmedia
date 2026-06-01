$ErrorActionPreference = 'Stop'

# Targets: substring match against startup Command field (case-insensitive)
$targets = @(
  @{ Label='utweb (uTorrent Web)';        Match='utweb.exe' },
  @{ Label='Adobe Acrobat Synchronizer';  Match='AdobeCollabSync.exe' },
  @{ Label='Grammarly Desktop';           Match='Grammarly.Desktop.exe' }
)

# StartupApproved binary blobs (mirrors what Task Manager writes)
$disabledBlob = [byte[]](0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00)

# Possible Run key locations + matching StartupApproved key
$runKeyPairs = @(
  @{ Run='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run';                              Approved='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run' },
  @{ Run='HKLM:\Software\Microsoft\Windows\CurrentVersion\Run';                              Approved='HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run' },
  @{ Run='HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run';                  Approved='HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run32' }
)

$report = @()

foreach ($t in $targets) {
  $found = $false
  foreach ($pair in $runKeyPairs) {
    if (-not (Test-Path -LiteralPath $pair.Run)) { continue }
    $props = Get-ItemProperty -LiteralPath $pair.Run -ErrorAction SilentlyContinue
    if (-not $props) { continue }
    $names = $props.PSObject.Properties |
      Where-Object { $_.MemberType -eq 'NoteProperty' -and $_.Name -notmatch '^PS' } |
      Where-Object { "$($_.Value)" -match [regex]::Escape($t.Match) }
    foreach ($n in $names) {
      $found = $true
      # Ensure approved key exists
      if (-not (Test-Path -LiteralPath $pair.Approved)) {
        New-Item -Path $pair.Approved -Force | Out-Null
      }
      try {
        Set-ItemProperty -LiteralPath $pair.Approved -Name $n.Name -Value $disabledBlob -Type Binary -Force
        $report += [PSCustomObject]@{ Target=$t.Label; ValueName=$n.Name; RunKey=$pair.Run; ApprovedKey=$pair.Approved; Result='DISABLED' }
      } catch {
        $report += [PSCustomObject]@{ Target=$t.Label; ValueName=$n.Name; RunKey=$pair.Run; ApprovedKey=$pair.Approved; Result="ERR: $($_.Exception.Message)" }
      }
    }
  }
  if (-not $found) {
    $report += [PSCustomObject]@{ Target=$t.Label; ValueName='(not found in Run keys)'; RunKey='-'; ApprovedKey='-'; Result='SKIP' }
  }
}

$report | Format-Table -AutoSize -Wrap

Write-Host ""
Write-Host "Re-checking Win32_StartupCommand..."
Get-CimInstance Win32_StartupCommand |
  Where-Object { $_.Command -match 'utweb|AdobeCollabSync|Grammarly\.Desktop' } |
  Select-Object Name, Command, Location |
  Format-Table -AutoSize -Wrap
