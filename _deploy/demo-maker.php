<?php
/* demo-maker.php — runs server-side to create /cms-demo/ and /app-demo/
   as mirrors of /cms/ and /app/, with paths rewritten and demo banner injected.
   Self-deletes on success. */
header('Content-Type: text/plain');

$root = '/home/webmed6/public_html';
$pairs = [
  ['src' => $root . '/cms', 'dst' => $root . '/cms-demo', 'swap_from' => '../app/', 'swap_to' => '../app-demo/'],
  ['src' => $root . '/app', 'dst' => $root . '/app-demo', 'swap_from' => '../cms/', 'swap_to' => '../cms-demo/'],
];

function rrmdir($dir) {
  if (!file_exists($dir)) return;
  if (is_dir($dir)) {
    foreach (scandir($dir) as $f) {
      if ($f === '.' || $f === '..') continue;
      rrmdir($dir . '/' . $f);
    }
    @rmdir($dir);
  } else {
    @unlink($dir);
  }
}

function rcopy($src, $dst) {
  if (is_dir($src)) {
    if (!is_dir($dst)) mkdir($dst, 0755, true);
    foreach (scandir($src) as $f) {
      if ($f === '.' || $f === '..') continue;
      rcopy($src . '/' . $f, $dst . '/' . $f);
    }
  } else {
    copy($src, $dst);
  }
}

function walk($dir, $cb) {
  if (!is_dir($dir)) return;
  foreach (scandir($dir) as $f) {
    if ($f === '.' || $f === '..') continue;
    $p = $dir . '/' . $f;
    if (is_dir($p)) walk($p, $cb);
    else $cb($p);
  }
}

$banner = '<div class="demo-banner">DEMO MODE — Public preview with sample data. Sign up for a real account at <a href="/">netwebmedia.com</a></div>';

foreach ($pairs as $pair) {
  echo "─── {$pair['src']} → {$pair['dst']}\n";

  if (!is_dir($pair['src'])) { echo "  ABORT: source missing\n"; continue; }

  // Clean old demo dir
  rrmdir($pair['dst']);

  // Copy
  rcopy($pair['src'], $pair['dst']);
  echo "  copied.\n";

  $count_rewritten = 0;
  $count_bannered = 0;

  // Rewrite + inject banner
  walk($pair['dst'], function($file) use ($pair, $banner, &$count_rewritten, &$count_bannered) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!in_array($ext, ['html', 'js', 'css'])) return;

    $c = file_get_contents($file);
    $orig = $c;

    // Rewrite cross-service links (both directions — idempotent for each file)
    $c = str_replace($pair['swap_from'], $pair['swap_to'], $c);

    // Inject demo banner in HTML if missing
    if ($ext === 'html' && strpos($c, 'demo-banner') === false) {
      if (preg_match('/<body[^>]*>/', $c, $m)) {
        $c = str_replace($m[0], $m[0] . "\n  " . $banner, $c);
        $count_bannered++;
      }
    }

    // Rebrand sidebar in js files (CMS and CRM buildSidebar strings)
    if ($ext === 'js') {
      $c = str_replace(
        "'<span class=\"brand-text\">NetWeb CMS</span>'",
        "'<span class=\"brand-text\">NetWeb CMS</span><span class=\"demo-chip\">DEMO</span>'",
        $c
      );
      $c = str_replace(
        "'<span class=\"brand-text\">NetWeb CRM</span>'",
        "'<span class=\"brand-text\">NetWeb CRM</span><span class=\"demo-chip\">DEMO</span>'",
        $c
      );
    }

    if ($c !== $orig) {
      file_put_contents($file, $c);
      $count_rewritten++;
    }
  });

  echo "  rewrote: $count_rewritten files\n";
  echo "  banners: $count_bannered html files\n";
}

echo "\nDONE.\n";
echo "Access demo at:\n";
echo "  https://netwebmedia.com/cms-demo/\n";
echo "  https://netwebmedia.com/app-demo/\n";

@unlink(__FILE__);
echo "(self-deleted)\n";
