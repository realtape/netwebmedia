<?php
require_once __DIR__ . '/api/config.php';
define('TOKEN', 'nwm-seg-2026');
header('Content-Type: text/plain; charset=utf-8');
if (($_GET['token'] ?? '') !== TOKEN) { http_response_code(403); die("Forbidden\n"); }
set_time_limit(120);
$db = getDB();

$fix = isset($_GET['fix']);

if (!$fix) {
  // Initial migration: add column + USA backfill
  $steps = [
    'ADD COLUMN'  => "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT NULL",
    'ADD INDEX'   => "ALTER TABLE contacts ADD INDEX IF NOT EXISTS idx_segment (segment)",
    'BACKFILL USA'=> "UPDATE contacts SET segment = JSON_UNQUOTE(JSON_EXTRACT(notes, '$.segment')) WHERE notes IS NOT NULL AND notes != '' AND notes LIKE '%\"segment\"%' AND segment IS NULL",
  ];
} else {
  // Fix pass: set segment=chile for contacts that have "vertical" in notes (Chile) but no segment
  // Chile contacts use "vertical" field; USA contacts use "state" field
  $steps = [
    'BACKFILL CHILE' => "UPDATE contacts SET segment = 'chile' WHERE segment IS NULL AND notes IS NOT NULL AND notes LIKE '%\"vertical\"%'",
    'BACKFILL OTHER' => "UPDATE contacts SET segment = 'other' WHERE segment IS NULL",
  ];
}

foreach ($steps as $name => $sql) {
  try {
    $affected = $db->exec($sql);
    echo "$name: OK (rows affected: $affected)\n";
  } catch (Throwable $e) {
    echo "$name: " . $e->getMessage() . "\n";
  }
  flush();
}

// Report counts
$total = $db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();
$usa   = $db->query("SELECT COUNT(*) FROM contacts WHERE segment='usa'")->fetchColumn();
$chile = $db->query("SELECT COUNT(*) FROM contacts WHERE segment='chile'")->fetchColumn();
$other = $db->query("SELECT COUNT(*) FROM contacts WHERE segment='other'")->fetchColumn();
$null  = $db->query("SELECT COUNT(*) FROM contacts WHERE segment IS NULL")->fetchColumn();
echo "\nContacts total : $total\n";
echo "segment=usa    : $usa\n";
echo "segment=chile  : $chile\n";
echo "segment=other  : $other\n";
echo "segment=null   : $null\n";
echo "\nDone. Delete add_segment.php from the repo.\n";
