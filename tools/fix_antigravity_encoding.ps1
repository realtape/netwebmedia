param(
    [string]$SiteRoot = "C:\Users\Usuario\Downloads\Netwebmedia antigravity - Copy"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SiteRoot)) {
    throw "Site root not found: $SiteRoot"
}

$encoding1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Repair-Mojibake {
    param([string]$Text)

    $repaired = [System.Text.Encoding]::UTF8.GetString($encoding1252.GetBytes($Text))

    $repaired = $repaired.Replace('<span class="flag">🇺🇸</span> English', 'English')
    $repaired = $repaired.Replace('<span class="flag">🇪🇸</span> Español', 'Español')

    return $repaired
}

$files = Get-ChildItem -Path $SiteRoot -Recurse -Include *.html,*.js,*.css

foreach ($file in $files) {
    $original = [System.IO.File]::ReadAllText($file.FullName)
    $fixed = Repair-Mojibake -Text $original

    if ($fixed -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $fixed, $utf8NoBom)
    }
}
