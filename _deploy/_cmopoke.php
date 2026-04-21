<?php
// Force-refresh mtime + invalidate opcache for CMO files
$files = [
  '/home/webmed6/public_html/api/index.php',
  '/home/webmed6/public_html/api/routes/billing.php',
  '/home/webmed6/public_html/api/routes/cmo.php',
  '/home/webmed6/public_html/api/lib/cmo.php',
];
foreach ($files as $f) {
  if (file_exists($f)) {
    if (function_exists('opcache_invalidate')) @opcache_invalidate($f, true);
    @touch($f);
  }
}
echo json_encode(['touched' => $files]);
@unlink(__FILE__);
