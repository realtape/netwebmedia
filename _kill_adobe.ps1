Stop-Process -Name 'AdobeCollabSync' -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$remaining = Get-Process -Name 'AdobeCollabSync' -ErrorAction SilentlyContinue
if ($remaining) {
  Write-Host "Still running:"
  $remaining | Select-Object Id, ProcessName | Format-Table -AutoSize
} else {
  Write-Host "AdobeCollabSync killed - no instances running."
}
