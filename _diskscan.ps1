function Get-DirSize($path) {
  try {
    $s = (Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    return [long]$s
  } catch { return [long]0 }
}

function FmtGB($bytes) { "{0:N1} GB" -f ($bytes / 1GB) }

Write-Host "=== Top space consumers on C: ==="
Write-Host ""

# System files
foreach ($f in @('C:\pagefile.sys','C:\hiberfil.sys','C:\swapfile.sys')) {
  if (Test-Path $f) {
    $size = (Get-Item $f -Force).Length
    Write-Host "$(FmtGB $size)  $f"
  }
}

# Windows
Write-Host "$(FmtGB (Get-DirSize 'C:\Windows'))  C:\Windows"
Write-Host "$(FmtGB (Get-DirSize 'C:\Program Files'))  C:\Program Files"
Write-Host "$(FmtGB (Get-DirSize 'C:\Program Files (x86)'))  C:\Program Files (x86)"

# User folders (top level)
Write-Host ""
Write-Host "--- C:\Users\Usuario ---"
Get-ChildItem 'C:\Users\Usuario' -Force -ErrorAction SilentlyContinue | ForEach-Object {
  $item = $_
  # Skip junctions (they live on D:)
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    Write-Host "  [junction]  $($item.Name)"
    return
  }
  $size = Get-DirSize $item.FullName
  if ($size -gt 100MB) {
    Write-Host "  $(FmtGB $size)  $($item.Name)"
  }
}

# AppData breakdown
Write-Host ""
Write-Host "--- AppData breakdown (>500 MB) ---"
@('C:\Users\Usuario\AppData\Local','C:\Users\Usuario\AppData\Roaming','C:\Users\Usuario\AppData\LocalLow') | ForEach-Object {
  $base = $_
  Get-ChildItem $base -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = Get-DirSize $_.FullName
    if ($size -gt 500MB) {
      Write-Host "  $(FmtGB $size)  $($_.FullName)"
    }
  }
}
