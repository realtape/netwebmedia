<?php
// One-shot: copy /app → /crm, create /demo/crm (copy of /app) + /demo/cms (copy of /cms)
// Then self-delete.
@set_time_limit(0);
@ini_set('memory_limit', '512M');

function rcopy($src, $dst) {
  if (!is_dir($src)) { return false; }
  if (!is_dir($dst)) { mkdir($dst, 0755, true); }
  $it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
  );
  $n = 0;
  foreach ($it as $item) {
    $rel = substr($item->getPathname(), strlen($src) + 1);
    $target = $dst . DIRECTORY_SEPARATOR . $rel;
    if ($item->isDir()) {
      if (!is_dir($target)) mkdir($target, 0755, true);
    } else {
      copy($item->getPathname(), $target);
      $n++;
    }
  }
  return $n;
}

$root = __DIR__;                                  // /home/webmed6/public_html
$results = [];

// /app → /crm
if (is_dir($root.'/crm')) {
  $results['crm'] = 'exists (skipped copy)';
} else {
  $n = rcopy($root.'/app', $root.'/crm');
  $results['crm'] = $n === false ? 'source /app missing' : "copied $n files";
}

// /demo
if (!is_dir($root.'/demo')) { mkdir($root.'/demo', 0755, true); }

// /demo/crm ← /app
if (is_dir($root.'/demo/crm')) {
  $results['demo_crm'] = 'exists';
} else {
  $n = rcopy($root.'/app', $root.'/demo/crm');
  $results['demo_crm'] = $n === false ? 'source /app missing' : "copied $n files";
}

// /demo/cms ← /cms
if (is_dir($root.'/demo/cms')) {
  $results['demo_cms'] = 'exists';
} else {
  $n = rcopy($root.'/cms', $root.'/demo/cms');
  $results['demo_cms'] = $n === false ? 'source /cms missing' : "copied $n files";
}

// Write .htaccess redirects for legacy paths
$htaccess_app = "RewriteEngine On\nRewriteRule ^(.*)$ /crm/$1 [R=301,L]\n";
$htaccess_app_demo = "RewriteEngine On\nRewriteRule ^(.*)$ /demo/crm/$1 [R=301,L]\n";
$htaccess_cms_demo = "RewriteEngine On\nRewriteRule ^(.*)$ /demo/cms/$1 [R=301,L]\n";
@file_put_contents($root.'/app/.htaccess', $htaccess_app);
@file_put_contents($root.'/app-demo/.htaccess', $htaccess_app_demo);
@file_put_contents($root.'/cms-demo/.htaccess', $htaccess_cms_demo);
$results['htaccess'] = 'wrote 3 redirect files';

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT);

// Self-delete
@unlink(__FILE__);
