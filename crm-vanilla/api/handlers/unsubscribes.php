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

require_once __DIR__ . '/../lib/tenancy.php';

if ($method !== 'GET') {
    jsonError('Method not allowed', 405);
}

$db = getDB();

// unsubscribes had no user_id pre-org-migration, so we cannot use tenancy_where()
// (which falls back to a user_id filter). Apply org_where directly when the
// schema is applied; otherwise leave the legacy global list behaviour intact.
$where = '';
$params = [];
if (is_org_schema_applied()) {
    [$where, $params] = org_where();
}

$listSql = 'SELECT email, reason, created_at FROM unsubscribes';
if ($where) $listSql .= ' WHERE ' . $where;
$listSql .= ' ORDER BY created_at DESC LIMIT 50';
$st = $db->prepare($listSql);
$st->execute($params);
$rows = $st->fetchAll();

$totalSql = 'SELECT COUNT(*) AS n FROM unsubscribes';
if ($where) $totalSql .= ' WHERE ' . $where;
$ts = $db->prepare($totalSql);
$ts->execute($params);
$totalRow = $ts->fetch();
$total = (int)($totalRow['n'] ?? 0);

jsonResponse([
    'total' => $total,
    'items' => $rows,
]);
