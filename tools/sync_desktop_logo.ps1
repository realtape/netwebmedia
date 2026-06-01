param(
    [string]$DesktopRoot = "C:\Users\Usuario\Desktop\NetWebMedia_Website",
    [string]$LogoSource = "C:\Users\Usuario\Documents\NetWebMedia\backend\apps\common\static\branding\netwebmedia-logo-lockup.png"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $DesktopRoot)) {
    throw "Desktop site not found: $DesktopRoot"
}

if (-not (Test-Path -LiteralPath $LogoSource)) {
    throw "Logo source not found: $LogoSource"
}

$logoTarget = Join-Path $DesktopRoot "img\netwebmedia-logo-lockup.png"
Copy-Item -LiteralPath $LogoSource -Destination $logoTarget -Force

$stylePath = Join-Path $DesktopRoot "css\style.css"
$style = Get-Content -LiteralPath $stylePath -Raw

if ($style -notmatch "\.logo-lockup") {
    $style += @"

.logo-lockup {
    display: block;
    width: clamp(220px, 22vw, 330px);
    height: auto;
}

.brand-lockup {
    display: block;
    width: min(360px, 100%);
    height: auto;
}
"@
    Set-Content -LiteralPath $stylePath -Value $style -Encoding UTF8
}

function Get-RelativeLogoPath {
    param([string]$HtmlPath)

    $directory = Split-Path -Parent $HtmlPath
    $directoryUri = [System.Uri]((Resolve-Path -LiteralPath $directory).Path + [System.IO.Path]::DirectorySeparatorChar)
    $targetUri = [System.Uri](Resolve-Path -LiteralPath $logoTarget).Path
    $relativeUri = $directoryUri.MakeRelativeUri($targetUri)
    return [System.Uri]::UnescapeDataString($relativeUri.ToString())
}

function Replace-LogoContainer {
    param(
        [string]$HtmlPath,
        [string]$ImageClass = "logo-lockup"
    )

    $relativeLogo = Get-RelativeLogoPath -HtmlPath $HtmlPath
    $html = Get-Content -LiteralPath $HtmlPath -Raw
    $updated = [System.Text.RegularExpressions.Regex]::Replace(
        $html,
        '<a href="([^"]+)" class="logo-container">.*?</a>',
        ('<a href="$1" class="logo-container">' + [Environment]::NewLine + '            <img src="' + $relativeLogo + '" alt="NetWebMedia" class="' + $ImageClass + '">' + [Environment]::NewLine + '        </a>'),
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    Set-Content -LiteralPath $HtmlPath -Value $updated -Encoding UTF8
}

function Replace-BrandLogo {
    param([string]$HtmlPath)

    $relativeLogo = Get-RelativeLogoPath -HtmlPath $HtmlPath
    $html = Get-Content -LiteralPath $HtmlPath -Raw

    if ($html -notmatch '\.brand-lockup') {
        $html = $html -replace '\.brand-name span \{ color: var\(--primary\); \}', ".brand-name span { color: var(--primary); }`r`n`r`n        .brand-lockup { display: block; width: min(360px, 100%); height: auto; }"
    }

    $updated = [System.Text.RegularExpressions.Regex]::Replace(
        $html,
        '<a class="brand" href="index\.html">.*?</a>',
        ('<a class="brand" href="index.html">' + [Environment]::NewLine + '            <img src="' + $relativeLogo + '" alt="NetWebMedia" class="brand-lockup">' + [Environment]::NewLine + '        </a>'),
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    Set-Content -LiteralPath $HtmlPath -Value $updated -Encoding UTF8
}

$logoFiles = @(
    (Join-Path $DesktopRoot "index.html"),
    (Join-Path $DesktopRoot "es\index.html")
)

$logoFiles += Get-ChildItem -LiteralPath (Join-Path $DesktopRoot "pages") -Filter *.html | Select-Object -ExpandProperty FullName
$logoFiles += Get-ChildItem -LiteralPath (Join-Path $DesktopRoot "es\pages") -Filter *.html | Select-Object -ExpandProperty FullName

foreach ($file in $logoFiles) {
    Replace-LogoContainer -HtmlPath $file
}

Replace-BrandLogo -HtmlPath (Join-Path $DesktopRoot "login.html")
