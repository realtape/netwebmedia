<?php
/**
 * Returns last 60 lines of the US campaign log.
 * Does NOT self-delete — call manually, remove when done.
 */
$log = '/home/webmed6/logs/us_campaign.log';
if (!file_exists($log)) {
    echo json_encode(['error' => 'log not found', 'path' => $log]);
} else {
    $lines = file($log, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $tail  = array_slice($lines, -60);
    echo json_encode(['lines' => $tail, 'total_lines' => count($lines)]);
}
