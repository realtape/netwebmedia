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
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

$dryRun = ($method === 'GET');
$db = getDB();

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

$total = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();

// Count targets: no email, no company, or free domain
$countSql = "
    SELECT COUNT(*) FROM contacts
    WHERE
        email IS NULL OR TRIM(email) = '' OR email NOT LIKE '%@%'
        OR LOWER(TRIM(company)) = '' OR company IS NULL
        OR LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) IN ($placeholders)
";
$stmt = $db->prepare($countSql);
$stmt->execute($freeDomains);
$targets = (int)$stmt->fetchColumn();

$deleted = 0;

if (!$dryRun) {
    $deleteSql = "
        DELETE FROM contacts
        WHERE
            email IS NULL OR TRIM(email) = '' OR email NOT LIKE '%@%'
            OR LOWER(TRIM(company)) = '' OR company IS NULL
            OR LOWER(SUBSTRING_INDEX(TRIM(email),'@',-1)) IN ($placeholders)
    ";
    $stmt = $db->prepare($deleteSql);
    $stmt->execute($freeDomains);
    $deleted = $stmt->rowCount();
}

$after = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();

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
