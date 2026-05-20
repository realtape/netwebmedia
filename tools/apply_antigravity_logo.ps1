param(
    [string]$SiteRoot = "C:\Users\Usuario\Downloads\Netwebmedia antigravity - Copy",
    [string]$LogoSource = "C:\Users\Usuario\Downloads\Gemini_Generated_Image_94pv6894pv6894pv.png"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SiteRoot)) {
    throw "Site root not found: $SiteRoot"
}

if (-not (Test-Path -LiteralPath $LogoSource)) {
    throw "Logo source not found: $LogoSource"
}

$indexPath = Join-Path $SiteRoot "index.html"
$cssPath = Join-Path $SiteRoot "css\styles.css"
$logoTarget = Join-Path $SiteRoot "assets\images\netwebmedia-logo-lockup.png"

Copy-Item -LiteralPath $LogoSource -Destination $logoTarget -Force

$html = Get-Content -LiteralPath $indexPath -Raw
$html = [System.Text.RegularExpressions.Regex]::Replace(
    $html,
    '<a href="index\.html" class="nav-logo">\s*<div class="logo-icon">.*?</div>\s*NetWebMedia\s*</a>',
    @'
<a href="index.html" class="nav-logo">
        <img src="assets/images/netwebmedia-logo-lockup.png" alt="NetWebMedia" class="nav-logo-image">
      </a>
'@,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
Set-Content -LiteralPath $indexPath -Value $html -Encoding UTF8

$css = Get-Content -LiteralPath $cssPath -Raw

$css = [System.Text.RegularExpressions.Regex]::Replace(
    $css,
    '\.nav-logo \{\s*display: flex;\s*align-items: center;\s*gap: 10px;\s*font-family: var\(--font-display\);\s*font-weight: 700;\s*font-size: 22px;\s*\}',
@'
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 0;
  flex-shrink: 0;
}

.nav-logo-image {
  display: block;
  width: clamp(220px, 24vw, 420px);
  height: auto;
}
'@
)

$css = [System.Text.RegularExpressions.Regex]::Replace(
    $css,
    '\.nav-logo \.logo-icon \{.*?\}',
    '',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

if ($css -notmatch '@media \(max-width: 768px\) \{[\s\S]*?\.nav-logo-image') {
    $css = $css -replace '@media \(max-width: 768px\) \{', "@media (max-width: 768px) {`r`n  .nav-logo-image { width: min(220px, 58vw); }"
}

Set-Content -LiteralPath $cssPath -Value $css -Encoding UTF8
