param(
    [string]$SiteRoot = "C:\Users\Usuario\Downloads\Netwebmedia antigravity - Copy"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SiteRoot)) {
    throw "Site root not found: $SiteRoot"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$replacements = [ordered]@{
    'Ã¡' = 'á'
    'Ã©' = 'é'
    'Ã­' = 'í'
    'Ã³' = 'ó'
    'Ãº' = 'ú'
    'Ã±' = 'ñ'
    'Ã' = 'Á'
    'Ã‰' = 'É'
    'Ã' = 'Í'
    'Ã“' = 'Ó'
    'Ãš' = 'Ú'
    'Ã‘' = 'Ñ'
    'Â©' = '©'
    'Â·' = '·'
    'Â' = ''
    'â€”' = ' - '
    'â†’' = '→'
    'â†“' = '↓'
    'â˜…' = '★'
    'âœ“' = '✓'
    'âœ—' = '✗'
    'â—' = '◐'
    'â­' = '⭐'
    'â–¶' = '▶'
    'ðŸš€' = '🚀'
    'ðŸ†' = '🏆'
    'ðŸ¤–' = '🤖'
    'ðŸ”' = '🔍'
    'ðŸ’°' = '💰'
    'ðŸŽ¨' = '🎨'
    'ðŸ“±' = '📱'
    'ðŸ“ˆ' = '📈'
    'âœï¸' = '✍️'
    'ðŸ“Š' = '📊'
    'ðŸ”„' = '🔄'
    'ðŸŽ¯' = '🎯'
    'ðŸ‘‘' = '👔'
    'ðŸ”®' = '🔮'
    'ðŸŽ¬' = '🎬'
    'ðŸ§ ' = '🧠'
    'ðŸ“' = '📝'
    'ðŸ›¡ï¸' = '🛡️'
    'ðŸ‘¤' = '👤'
    'ðŸ’¬' = '💬'
    'ðŸ“¡' = '📡'
    'ðŸ“¸' = '📸'
    'ð•' = 'X'
    'ðŸŽµ' = '🎵'
    'ï¿½' = '-'
    '�' = '-'
    '?? Top AI Marketing Agency 2025' = 'Top AI Marketing Agency 2025'
    'form_privacy_note: "?? 100% confidential. We never share your information."' = 'form_privacy_note: "100% confidential. We never share your information."'
    'Learn More ?' = 'Learn More →'
    'Explore Services ?' = 'Explore Services ↓'
    'Send Message & Get Free Audit ?' = 'Send Message & Get Free Audit →'
    'Sent! ?' = 'Sent! ✓'
    '4.9?' = '4.9★'
    '<div class="logo-icon">??</div>' = '<div class="logo-icon">🌐</div>'
}

$files = Get-ChildItem -Path $SiteRoot -Recurse -Include *.html,*.js,*.css

foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file.FullName)

    foreach ($pair in $replacements.GetEnumerator()) {
        $text = $text.Replace($pair.Key, $pair.Value)
    }

    $text = [regex]::Replace(
        $text,
        '<button class="lang-btn active" data-lang="en" id="lang-en">\s*<span class="flag">.*?</span>\s*English\s*</button>',
@'
<button class="lang-btn active" data-lang="en" id="lang-en">
      English
    </button>
'@,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    $text = [regex]::Replace(
        $text,
        '<button class="lang-btn" data-lang="es" id="lang-es">\s*<span class="flag">.*?</span>\s*Español\s*</button>',
@'
<button class="lang-btn" data-lang="es" id="lang-es">
      Español
    </button>
'@,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )

    [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
}
