$ErrorActionPreference = 'Continue'
$log = 'C:\Users\Usuario\Desktop\NetWebMedia\_link.log'
function Log($m){ $t=(Get-Date).ToString('HH:mm:ss'); "$t  $m" | Tee-Object -FilePath $log -Append }

Log "=== Reconcile Downloads leftover ==="
$dl = 'C:\Users\Usuario\Downloads'
if (Test-Path $dl) {
  $left = Get-ChildItem $dl -Recurse -File -Force -ErrorAction SilentlyContinue
  Log ("  leftover files: " + $left.Count)
  foreach ($f in $left) { Log ("   - " + $f.FullName + "  (" + [math]::Round($f.Length/1MB,1) + " MB)") }
  robocopy $dl 'D:\Usuario\Downloads' /E /MOVE /COPY:DAT /R:1 /W:1 /XJ /NP /NFL /NDL | Out-Null
  $still = (Get-ChildItem $dl -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object).Count
  Log ("  after retry, files still in C: Downloads: " + $still)
}

Log "=== Move Documents -> D: (Obsidian closed) ==="
$docSrc = 'C:\Users\Usuario\Documents'
$docDst = 'D:\Usuario\Documents'
if (Test-Path $docSrc) {
  $isLink = (Get-Item $docSrc -Force).LinkType
  if ($isLink) { Log "  Documents already a link ($isLink) - skipping move" }
  else {
    New-Item -ItemType Directory -Force -Path $docDst | Out-Null
    Log "  robocopy Documents -> D: ..."
    robocopy $docSrc $docDst /E /MOVE /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ /NP /NFL /NDL /MT:16 | Out-Null
    $docLeft = (Get-ChildItem $docSrc -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object).Count
    Log ("  files left in C: Documents: " + $docLeft)
  }
}

Log "=== Create junctions at old C: paths -> D: ==="
$links = @(
  @{ Link='C:\Users\Usuario\Downloads'; Target='D:\Usuario\Downloads' },
  @{ Link='C:\Users\Usuario\Videos';    Target='D:\Usuario\Videos' },
  @{ Link='C:\Users\Usuario\Pictures';  Target='D:\Usuario\Pictures' },
  @{ Link='C:\Users\Usuario\Music';     Target='D:\Usuario\Music' },
  @{ Link='C:\Users\Usuario\Documents'; Target='D:\Usuario\Documents' }
)
foreach ($l in $links) {
  if (-not (Test-Path $l.Target)) { Log ("  SKIP {0} (target missing)" -f $l.Link); continue }
  if (Test-Path $l.Link) {
    $item = Get-Item $l.Link -Force
    if ($item.LinkType) { Log ("  {0} already a link ({1}) -> {2}" -f $l.Link,$item.LinkType,$item.Target); continue }
    $remain = (Get-ChildItem $l.Link -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object).Count
    if ($remain -gt 0) { Log ("  CANNOT link {0}: {1} files still locked in source - left as real folder" -f $l.Link,$remain); continue }
    Remove-Item $l.Link -Recurse -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path $l.Link) { Log ("  could not remove source {0} (in use) - SKIPPED junction" -f $l.Link); continue }
  cmd /c mklink /J "`"$($l.Link)`"" "`"$($l.Target)`"" | Out-Null
  $chk = Get-Item $l.Link -Force -ErrorAction SilentlyContinue
  if ($chk -and $chk.LinkType) { Log ("  LINKED {0} -> {1}" -f $l.Link,$l.Target) }
  else { Log ("  FAILED to link {0}" -f $l.Link) }
}

Log "=== FREE SPACE ==="
Get-PSDrive C,D | ForEach-Object { Log ("  {0}: free={1} GB used={2} GB" -f $_.Name,[math]::Round($_.Free/1GB,1),[math]::Round($_.Used/1GB,1)) }
Log "=== DONE ==="
