# NetWebMedia paste helper - loads each post to clipboard sequentially
# Run: powershell -ExecutionPolicy Bypass -File paste-helper.ps1

$base = "C:\Users\Usuario\Desktop\NetWebMedia\.tmp_social"

$queue = @(
    @{ name = "Facebook Post 1 (relaunch announcement)"; file = "fb_post1.txt"; where = "Facebook page > What's on your mind > Ctrl+V > Post (and Pin to top)" }
    @{ name = "Facebook Post 2 (value-first)";           file = "fb_post2.txt"; where = "Facebook page > What's on your mind > Ctrl+V > Post" }
    @{ name = "Facebook Post 3 (case study)";            file = "fb_post3.txt"; where = "Facebook page > What's on your mind > Ctrl+V > Post" }
    @{ name = "Facebook About - SHORT description";      file = "fb_about_short.txt"; where = "FB page > Edit Page Info > About > Short description (255 chars) > Ctrl+V > Save" }
    @{ name = "Facebook About - LONG description";       file = "fb_about_long.txt";  where = "FB page > Edit Page Info > About > Long description > Ctrl+V > Save" }
    @{ name = "Instagram Post 1 caption (identity card)"; file = "ig_post1.txt"; where = "Instagram > New post > upload assets/social/ig-identity-card.png > Caption > Ctrl+V > Share" }
    @{ name = "Instagram Post 2 caption (credibility)";  file = "ig_post2.txt"; where = "Instagram > New post > upload assets/social/ig-aeo-stat.png > Caption > Ctrl+V > Share" }
    @{ name = "Instagram Post 3 caption (niche callout)"; file = "ig_post3.txt"; where = "Instagram > New post > upload assets/social/reel-thumb.png > Caption > Ctrl+V > Share" }
    @{ name = "Instagram Post 4 caption (proof carousel)"; file = "ig_post4.txt"; where = "Instagram > New post > upload assets/social/ig-aeo-stat.png > Caption > Ctrl+V > Share" }
    @{ name = "Instagram Post 5 caption (BTS)";          file = "ig_post5.txt"; where = "Instagram > New post > upload assets/social/ig-cta.png > Caption > Ctrl+V > Share" }
    @{ name = "GBP description (744 chars)";             file = "gbp_description.txt"; where = "GBP dashboard (after verification) > Info > Description > Ctrl+V > Save" }
)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " NetWebMedia social paste helper" -ForegroundColor Cyan
Write-Host " 11 items queued. Press Enter to load each one." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$i = 0
foreach ($item in $queue) {
    $i++
    $path = Join-Path $base $item.file
    Get-Content -Raw -Encoding UTF8 $path | Set-Clipboard
    Write-Host "[$i/$($queue.Count)] LOADED: $($item.name)" -ForegroundColor Green
    Write-Host "         WHERE: $($item.where)" -ForegroundColor Yellow
    Write-Host "         (clipboard ready - paste with Ctrl+V)"
    Write-Host ""
    if ($i -lt $queue.Count) {
        Read-Host "         Press Enter when this one is published to load the NEXT item"
        Write-Host ""
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " All 11 items loaded. Done!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
