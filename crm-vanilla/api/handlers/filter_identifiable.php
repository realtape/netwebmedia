<?php
/**
 * Purge contacts that don't pass the "Identifiable Business" filter:
 *   - Email is NULL / empty / not a real address, OR
 *   - Email domain is a free consumer provider (gmail, yahoo, hotmail…), OR
 *   - Company name is NULL / empty.
 *
 * Token-protected. Safe to re-run (idempotent).
 *
 * GET /api/?r=filter_identifiable&token=NWM_FILTER_ID_2026          → dry-run (count only)
 * POST /api/?r=filter_identifiable&token=NWM_FILTER_ID_2026         → execute purge
 */
if (!in_array($method, ['GET','POST'])) jsonError('Use GET (dry-run) or POST (execute)', 405);

$TOKEN = defined('FILTER_ID_TOKEN') ? FILTER_ID_TOKEN : 'NWM_FILTER_ID_2026';
require_once __DIR__ . '/../lib/tenancy.php';
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
// SECURITY (C2): pin to master — token-gated cron op, never per-org.
pin_org_to_master();

$dryRun = ($method === 'GET');
$db = getDB();

// Org-scope post-migration; master org sees all (org_where → '1=1').
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); }
$andOw = $ow ? ' AND ' . $ow : '';
$whrOw = $ow ? ' WHERE ' . $ow : '';

// Free consumer email domains to reject
$freeDomains = [
    'gmail.com','googlemail.com',
    'yahoo.com','yahoo.com.mx','yahoo.com.ar','yahoo.es','ymail.com',
    'hotmail.com','hotmail.es','hotmail.cl','hotmail.co.uk',
    'outlook.com','outlook.es',
    'live.com','live.cl','live.com.ar',
    'icloud.com','me.com','mac.com',
    'aol.com','msn.com',
];

// Build LOWER(SUBSTRING_INDEX(email,'@',-1)) IN (...) clause
$placeholders = implode(',', array_fill(0, count($freeDomains), '?'));

$ts = $db->prepare("SELECT COUNT(*) FROM contacts" . $whrOw);
$ts->execute($owp);
$total = (int)$ts->fetchColumn();

// Count targets: no email, no company, or free domain — scoped to org.
$countSql = "
    SELECT COUNT(*) FROM contacts
    WHERE (
        email IS NULL OR TRIM(email) = '' OR email NOT LIKE '%@%'
        OR LOWER(TRIM(company)) = '' OR company IS NULL
        OR LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) IN ($placeholders)
    )" . $andOw;
$stmt = $db->prepare($countSql);
$stmt->execute(array_merge($freeDomains, $owp));
$targets = (int)$stmt->fetchColumn();

$deleted = 0;

if (!$dryRun) {
    $deleteSql = "
        DELETE FROM contacts
        WHERE (
            email IS NULL OR TRIM(email) = '' OR email NOT LIKE '%@%'
            OR LOWER(TRIM(company)) = '' OR company IS NULL
            OR LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) IN ($placeholders)
        )" . $andOw;
    $stmt = $db->prepare($deleteSql);
    $stmt->execute(array_merge($freeDomains, $owp));
    $deleted = $stmt->rowCount();
}

$as = $db->prepare("SELECT COUNT(*) FROM contacts" . $whrOw);
$as->execute($owp);
$after = (int)$as->fetchColumn();

jsonResponse([
    'dry_run'             => $dryRun,
    'total_before'        => $total,
    'non_identifiable'    => $targets,
    'identifiable_kept'   => $total - $targets,
    'rows_deleted'        => $deleted,
    'total_after'         => $after,
    'filter_criteria'     => [
        'removed_if_no_email'     => true,
        'removed_if_no_company'   => true,
        'removed_free_domains'    => $freeDomains,
    ],
]);
