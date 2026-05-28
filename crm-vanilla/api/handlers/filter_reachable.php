<?php
/**
 * Purge contacts that lack at least one direct contact method:
 *   - Email is NULL / empty, OR
 *   - Phone is NULL / empty.
 *
 * Strict-OR interpretation per Carlos's directive 2026-05-28.
 * Token-protected. Safe to re-run (idempotent — re-running on a clean DB is a no-op).
 * Master-org pinned (purges across all orgs once the org schema is applied).
 *
 *   GET  /crm/api/?r=filter_reachable&token=<FILTER_REACH_TOKEN>   → dry-run (count only)
 *   POST /crm/api/?r=filter_reachable&token=<FILTER_REACH_TOKEN>   → execute purge
 *
 * Mirrors crm-vanilla/api/handlers/filter_identifiable.php — same auth + tenancy posture.
 */
if (!in_array($method, ['GET', 'POST'])) jsonError('Use GET (dry-run) or POST (execute)', 405);

$TOKEN = defined('FILTER_REACH_TOKEN') ? FILTER_REACH_TOKEN : 'NWM_FILTER_REACH_2026';
require_once __DIR__ . '/../lib/tenancy.php';
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

// SECURITY: pin to master — token-gated cleanup op, never per-org.
pin_org_to_master();

$dryRun = ($method === 'GET');
$db = getDB();

// Org scope (master sees all when org schema applied)
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); }
$orgScope = $ow ? ' AND ' . $ow : '';
$whrOw    = $ow ? ' WHERE ' . $ow : '';

$noEmail     = "(email IS NULL OR TRIM(email) = '')";
$noPhone     = "(phone IS NULL OR TRIM(phone) = '')";
$strictOr    = "($noEmail OR $noPhone)";
$bothMissing = "($noEmail AND $noPhone)";

$count = function (string $where, array $params) use ($db): int {
    $stmt = $db->prepare("SELECT COUNT(*) FROM contacts WHERE $where");
    $stmt->execute($params);
    return (int)$stmt->fetchColumn();
};

$tsStmt = $db->prepare("SELECT COUNT(*) FROM contacts" . $whrOw);
$tsStmt->execute($owp);
$totalBefore = (int)$tsStmt->fetchColumn();

$cNoEmail = $count($noEmail . $orgScope, $owp);
$cNoPhone = $count($noPhone . $orgScope, $owp);
$cBoth    = $count($bothMissing . $orgScope, $owp);
$cEither  = $count($strictOr . $orgScope, $owp);

$deleted = 0;
if (!$dryRun) {
    $stmt = $db->prepare("DELETE FROM contacts WHERE $strictOr" . $orgScope);
    $stmt->execute($owp);
    $deleted = $stmt->rowCount();
}

$asStmt = $db->prepare("SELECT COUNT(*) FROM contacts" . $whrOw);
$asStmt->execute($owp);
$totalAfter = (int)$asStmt->fetchColumn();

jsonResponse([
    'dry_run'             => $dryRun,
    'total_before'        => $totalBefore,
    'breakdown'           => [
        'no_email'                            => $cNoEmail,
        'no_phone'                            => $cNoPhone,
        'no_email_AND_no_phone__unreachable'  => $cBoth,
        'no_email_OR_no_phone__will_delete'   => $cEither,
    ],
    'fully_reachable_kept' => $totalBefore - $cEither,
    'rows_deleted'         => $deleted,
    'total_after'          => $totalAfter,
    'filter_criteria'      => [
        'removed_if_email_null_or_empty' => true,
        'removed_if_phone_null_or_empty' => true,
        'combinator'                     => 'OR (strict)',
    ],
]);
