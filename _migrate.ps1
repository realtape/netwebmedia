$ErrorActionPreference = 'Continue'
$log = 'C:\Users\Usuario\Desktop\NetWebMedia\_migrate.log'
function Log($m){ $t=(Get-Date).ToString('HH:mm:ss'); "$t  $m" | Tee-Object -FilePath $log -Append }

Log "=== PHASE 1: shell folder relocation C: -> D: ==="
$moves = @(
  @{ Name='Downloads'; Src='C:\Users\Usuario\Downloads'; Dst='D:\Usuario\Downloads' },
  @{ Name='Videos';    Src='C:\Users\Usuario\Videos';    Dst='D:\Usuario\Videos' },
  @{ Name='Pictures';  Src='C:\Users\Usuario\Pictures';  Dst='D:\Usuario\Pictures' },
  @{ Name='Music';     Src='C:\Users\Usuario\Music';     Dst='D:\Usuario\Music' }
)
foreach ($m in $moves) {
  if (-not (Test-Path $m.Src)) { Log ("SKIP {0} (no source)" -f $m.Name); continue }
  New-Item -ItemType Directory -Force -Path $m.Dst | Out-Null
  Log ("MOVING {0}: {1} -> {2}" -f $m.Name, $m.Src, $m.Dst)
  robocopy $m.Src $m.Dst /E /MOVE /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ /NP /NFL /NDL /MT:16 | Out-Null
  $rc = $LASTEXITCODE
  $leftFiles = (Get-ChildItem $m.Src -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object).Count
  Log ("  robocopy rc={0}; files left in source={1}" -f $rc, $leftFiles)
  if ($leftFiles -eq 0 -and (Test-Path $m.Src)) {
    Remove-Item $m.Src -Recurse -Force -ErrorAction SilentlyContinue
    Log ("  removed empty source {0}" -f $m.Src)
  }
}

Log "=== Registry: User Shell Folders + Shell Folders ==="
$usf = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders'
$sf  = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders'
$reg = @(
  @{ K='{374DE290-123F-4565-9164-39C4925E467B}'; P='D:\Usuario\Downloads' },
  @{ K='My Pictures';  P='D:\Usuario\Pictures' },
  @{ K='{33E28130-4E1E-4676-835A-98395C3BC3BB}'; P='D:\Usuario\Pictures' },
  @{ K='My Video';     P='D:\Usuario\Videos' },
  @{ K='{18989B1D-99B5-455B-841C-AB7C74E4DDFC}'; P='D:\Usuario\Videos' },
  @{ K='My Music';     P='D:\Usuario\Music' },
  @{ K='{4BD8D571-6D19-48D3-BE97-422220080E43}'; P='D:\Usuario\Music' }
)
foreach ($r in $reg) {
  Set-ItemProperty -Path $usf -Name $r.K -Value $r.P -ErrorAction SilentlyContinue
  Set-ItemProperty -Path $sf  -Name $r.K -Value $r.P -ErrorAction SilentlyContinue
  Log ("  set {0} = {1}" -f $r.K, $r.P)
}

Log "=== OBS: repoint recording path to D: (separate physical disk) ==="
$obsProfiles = 'C:\Users\Usuario\AppData\Roaming\obs-studio\basic\profiles'
if (Test-Path $obsProfiles) {
  Get-ChildItem $obsProfiles -Directory | ForEach-Object {
    $ini = Join-Path $_.FullName 'basic.ini'
    if (Test-Path $ini) {
      $c = Get-Content $ini -Raw
      $c2 = $c -replace [regex]::Escape('C:\\Users\\Usuario\\Videos'),'D:\\Usuario\\Videos'
      $c2 = $c2 -replace [regex]::Escape('C:\Users\Usuario\Videos'),'D:\Usuario\Videos'
      if ($c2 -ne $c) { Set-Content -Path $ini -Value $c2 -NoNewline; Log ("  OBS profile '{0}' repointed -> D:\\Usuario\\Videos" -f $_.Name) }
      else { Log ("  OBS profile '{0}' no change" -f $_.Name) }
    }
  }
} else { Log "  OBS profiles dir not found" }

Log "=== PHASE 2: dev cache redirects -> D:\caches ==="
New-Item -ItemType Directory -Force -Path 'D:\caches\npm','D:\caches\pip','D:\caches\playwright','D:\caches\conda' | Out-Null
try { & npm config set cache 'D:\caches\npm' --global 2>&1 | Out-Null; Log "  npm cache -> D:\caches\npm" } catch { Log "  npm not on PATH (skipped)" }
[Environment]::SetEnvironmentVariable('PIP_CACHE_DIR','D:\caches\pip','User'); Log "  PIP_CACHE_DIR -> D:\caches\pip"
[Environment]::SetEnvironmentVariable('PLAYWRIGHT_BROWSERS_PATH','D:\caches\playwright','User'); Log "  PLAYWRIGHT_BROWSERS_PATH -> D:\caches\playwright"
$condarc = 'C:\Users\Usuario\.condarc'
$condaBlock = "pkgs_dirs:`n  - D:\caches\conda`n"
if (Test-Path $condarc) {
  if (-not (Select-String -Path $condarc -Pattern 'pkgs_dirs' -Quiet)) { Add-Content $condarc "`n$condaBlock"; Log "  appended pkgs_dirs to .condarc" }
  else { Log "  .condarc already has pkgs_dirs (left as-is)" }
} else { Set-Content $condarc $condaBlock; Log "  created .condarc with pkgs_dirs" }

Log "=== FREE SPACE AFTER ==="
Get-PSDrive C,D | ForEach-Object { Log ("  {0}: free={1} GB used={2} GB" -f $_.Name,[math]::Round($_.Free/1GB,1),[math]::Round($_.Used/1GB,1)) }
Log "=== DONE. Restart Explorer or sign out/in for shell folders to fully refresh. ==="
