<?php
require_once '/home/webmed6/public_html/api/lib/db.php';

$rows = qAll("SELECT id, title, data FROM resources WHERE type='contact' ORDER BY id ASC");
$candidates = [];
foreach ($rows as $r) {
  $d = json_decode($r['data'], true);
  if (!is_array($d)) $d = [];
  $notes = isset($d['notes']) ? $d['notes'] : null;
  $hasPage = false;
  if (is_string($notes)) {
    $n = json_decode($notes, true);
    if (is_array($n) && !empty($n['page'])) $hasPage = true;
  } elseif (is_array($notes) && !empty($notes['page'])) {
    $hasPage = true;
  }
  if ($hasPage) continue;

  $email = strtolower((string)(isset($d['email']) ? $d['email'] : $r['title']));
  $source = isset($d['source']) ? strtolower((string)$d['source']) : '';
  $isDemo =
    strpos($email, 'test@') !== false ||
    strpos($email, '@test.') !== false ||
    strpos($email, 'maria.johnson') !== false ||
    strpos($email, 'carlos@netwebmedia') !== false ||
    strpos($email, 'demo@') !== false ||
    strpos($email, 'hello@netwebmedia') !== false ||
    strpos($source, 'demo') !== false ||
    strpos($source, 'seed') !== false;
  if (!$isDemo) continue;

  $candidates[] = ['id' => (int)$r['id'], 'title' => $r['title'], 'email' => $email, 'source' => isset($d['source']) ? $d['source'] : null];
}

$dry = !isset($_GET['go']) || $_GET['go'] !== '1';
if ($dry) {
  header('Content-Type: application/json');
  echo json_encode(['dry_run' => true, 'would_delete' => count($candidates), 'candidates' => $candidates], JSON_PRETTY_PRINT);
  exit;
}

$n = 0; $ids = array_map(function($c){ return $c['id']; }, $candidates);
if ($ids) {
  $ph = implode(',', array_fill(0, count($ids), '?'));
  qExec("DELETE FROM resources WHERE id IN ($ph)", $ids);
  $n = count($ids);
}
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'deleted' => $n, 'ids' => $ids, 'titles' => array_map(function($c){return $c['title'];}, $candidates)], JSON_PRETTY_PRINT);
@unlink(__FILE__);
