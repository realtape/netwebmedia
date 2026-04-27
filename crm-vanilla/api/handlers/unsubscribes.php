<?php
/**
 * Unsubscribes: GET-only listing for the campaigns dashboard.
 *
 * GET /api/?r=unsubscribes  → { total, items: [{email, reason, created_at}, ...] }
 *
 * Writes to this table happen out-of-band — from /unsubscribe.php (one-click)
 * and from inbound bounce/complaint handling. This endpoint is read-only on
 * purpose: opening a public POST surface here would let attackers DoS the
 * suppression list with junk addresses.
 */

if ($method !== 'GET') {
    jsonError('Method not allowed', 405);
}

$db = getDB();

$rows = $db->query("
    SELECT email, reason, created_at
    FROM unsubscribes
    ORDER BY created_at DESC
    LIMIT 50
")->fetchAll();

$totalRow = $db->query("SELECT COUNT(*) AS n FROM unsubscribes")->fetch();
$total = (int)($totalRow['n'] ?? 0);

jsonResponse([
    'total' => $total,
    'items' => $rows,
]);
