<?php
/**
 * ONE-TIME: Add `segment` column to contacts + backfill from notes JSON.
 * GET https://app.netwebmedia.com/add_segment.php?token=nwm-seg-2026
 * DELETE after running.
 */
require_once __DIR__ . '/api/config.php';
define('TOKEN', 'nwm-seg-2026');
header('Content-Type: text/plain; charset=utf-8');
if (($_GET['token'] ?? '') !== TOKEN) { http_response_code(403); die("Forbidden\n"); }
set_time_limit(120);
$db = getDB();
$steps = [
  'ADD COLUMN'  => "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT NULL",
  'ADD INDEX'   => "ALTER TABLE contacts ADD INDEX IF NOT EXISTS idx_segment (segment)",
  'BACKFILL'    => "UPDATE contacts SET segment = JSON_UNQUOTE(JSON_EXTRACT(notes, '$.segment')) WHERE notes IS NOT NULL AND notes != '' AND notes LIKE '%\"segment\"%' AND segment IS NULL",
];
foreach ($steps as $name => $sql) {
  try { $db->exec($sql); echo "$name: OK\n"; }
  catch (Throwable $e) { echo "$name: " . $e->getMessage() . "\n"; }
  flush();
}
// Report counts
$total = $db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();
$usa   = $db->query("SELECT COUNT(*) FROM contacts WHERE segment='usa'")->fetchColumn();
$chile = $db->query("SELECT COUNT(*) FROM contacts WHERE segment='chile'")->fetchColumn();
$null  = $db->query("SELECT COUNT(*) FROM contacts WHERE segment IS NULL")->fetchColumn();
echo "\nContacts total : $total\n";
echo "segment=usa    : $usa\n";
echo "segment=chile  : $chile\n";
echo "segment=null   : $null\n";
echo "\nDone. Delete add_segment.php from the repo.\n";
