<?php
/* Tiny .env loader.
 * Looks for repo-root .env (two levels up from api-php/lib).
 * Idempotent — safe to require_once multiple times.
 * IMPORTANT: .env MUST be listed in .gitignore (it is, as of 2026-04-24).
 */
(function () {
  static $loaded = false;
  if ($loaded) return;
  $loaded = true;

  $paths = [
    __DIR__ . '/../../.env',
    __DIR__ . '/../.env',
  ];
  foreach ($paths as $path) {
    if (!is_readable($path)) continue;
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!$lines) continue;
    foreach ($lines as $line) {
      $line = trim($line);
      if ($line === '' || $line[0] === '#') continue;
      $eq = strpos($line, '=');
      if ($eq === false) continue;
      $k = trim(substr($line, 0, $eq));
      $v = trim(substr($line, $eq + 1));
      if ((strlen($v) >= 2) && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
        $v = substr($v, 1, -1);
      }
      if ($k !== '' && getenv($k) === false) { putenv("$k=$v"); $_ENV[$k] = $v; }
    }
    return; // first match wins
  }
})();
