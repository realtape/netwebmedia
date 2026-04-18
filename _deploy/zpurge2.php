<?php
require_once '/home/webmed6/public_html/api/lib/db.php';

$rows = qAll("SELECT id, title, data, created_at FROM resources WHERE type='contact' ORDER BY id ASC");
$noPage = [];
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
  if (!$hasPage) {
    $noPage[] = [
      'id'       => (int)$r['id'],
      'title'    => $r['title'],
      'email'    => isset($d['email']) ? $d['email'] : null,
      'source'   => isset($d['source']) ? $d['source'] : null,
      'created'  => $r['created_at'],
    ];
  }
}

$dry = !isset($_GET['go']) || $_GET['go'] !== '1';
$totalContacts = count($rows);
if ($dry) {
  header('Content-Type: application/json');
  echo json_encode([
    'dry_run' => true,
    'total_contacts'  => $totalContacts,
    'would_delete'    => count($noPage),
    'would_remain'    => $totalContacts - count($noPage),
    'candidates'      => $noPage,
  ], JSON_PRETTY_PRINT);
  exit;
}

$ids = array_map(function($c){ return $c['id']; }, $noPage);
$n = 0;
if ($ids) {
  $ph = implode(',', array_fill(0, count($ids), '?'));
  qExec("DELETE FROM resources WHERE id IN ($ph)", $ids);
  $n = count($ids);
}
header('Content-Type: application/json');
echo json_encode([
  'ok'             => true,
  'deleted'        => $n,
  'remaining'      => $totalContacts - $n,
  'deleted_ids'    => $ids,
], JSON_PRETTY_PRINT);
@unlink(__FILE__);
