$ErrorActionPreference = 'SilentlyContinue'
$targets = @(
  'C:\Users\Usuario',
  'C:\Users\Usuario\Desktop',
  'C:\Users\Usuario\Documents',
  'C:\Users\Usuario\Downloads',
  'C:\Users\Usuario\Videos',
  'C:\Users\Usuario\Pictures',
  'C:\Users\Usuario\AppData'
)
foreach ($t in $targets) {
  if (Test-Path $t) {
    $sum = (Get-ChildItem $t -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $gb = [math]::Round($sum / 1GB, 1)
    Write-Output ("{0,8} GB  {1}" -f $gb, $t)
  }
}
Write-Output "---- top folders under C:\Users\Usuario ----"
Get-ChildItem 'C:\Users\Usuario' -Force -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $s = (Get-ChildItem $_.FullName -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  [PSCustomObject]@{ GB = [math]::Round($s / 1GB, 1); Folder = $_.Name }
} | Sort-Object GB -Descending | Select-Object -First 12 | ForEach-Object { Write-Output ("{0,8} GB  {1}" -f $_.GB, $_.Folder) }
