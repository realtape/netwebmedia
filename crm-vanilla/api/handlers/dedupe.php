<?php
/**
 * One-time dedupe: keep the oldest contact per email (lowest id), delete the rest.
 * Token-protected. Safe to re-run (idempotent — only removes true duplicates).
 *
 * POST /api/?r=dedupe&token=NWM_DEDUPE_2026
 *   Optional: &dry_run=1  -> report only, no deletes
 */
if (!in_array($method, ['GET', 'POST'], true)) jsonError('Use GET or POST', 405);
require_once __DIR__ . '/../lib/tenancy.php';
if (!hash_equals(DEDUPE_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
// SECURITY (C2): token-gated routes are master-org admin operations. Ignore
// X-Org-Slug / session / host resolution so a token leak cannot be combined
// with a target slug to dedupe a specific paying org's data.
pin_org_to_master();

$dryRun = !empty($_GET['dry_run']);
$db = getDB();

// Scope to master post-pin. org_where() returns '1=1' for master, preserving
// the legacy global-dedupe behaviour for this token-protected cron route.
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); }
$andOw = $ow ? ' AND ' . $ow : '';
$whrOw = $ow ? ' WHERE ' . $ow : '';

// Count before
$ts = $db->prepare("SELECT COUNT(*) FROM contacts" . $whrOw);
$ts->execute($owp);
$total = (int)$ts->fetchColumn();

// Find duplicate email groups (case-insensitive, ignore blanks/NULLs)
$ds = $db->prepare("
    SELECT LOWER(TRIM(email)) AS em, COUNT(*) AS n, MIN(id) AS keep_id,
           GROUP_CONCAT(id ORDER BY id) AS ids
    FROM contacts
    WHERE email IS NOT NULL AND TRIM(email) <> ''" . $andOw . "
    GROUP BY LOWER(TRIM(email))
    HAVING n > 1
");
$ds->execute($owp);
$dups = $ds->fetchAll(PDO::FETCH_ASSOC);

$toDelete = [];
$groups = 0;
foreach ($dups as $d) {
    $groups++;
    $ids = array_map('intval', explode(',', $d['ids']));
    $keep = (int)$d['keep_id'];
    foreach ($ids as $id) {
        if ($id !== $keep) $toDelete[] = $id;
    }
}

$deleted = 0;
if (!$dryRun && $toDelete) {
    // Delete in chunks to avoid oversized IN() clauses. Repeat the org clause
    // on the DELETE so the candidate ids must also belong to the current org.
    foreach (array_chunk($toDelete, 500) as $chunk) {
        $ph = implode(',', array_fill(0, count($chunk), '?'));
        $sql = "DELETE FROM contacts WHERE id IN ($ph)" . $andOw;
        $stmt = $db->prepare($sql);
        $stmt->execute(array_merge($chunk, $owp));
        $deleted += $stmt->rowCount();
    }
}

$as = $db->prepare("SELECT COUNT(*) FROM contacts" . $whrOw);
$as->execute($owp);
$after = (int)$as->fetchColumn();

jsonResponse([
    'dry_run'        => $dryRun,
    'total_before'   => $total,
    'duplicate_groups' => $groups,
    'rows_targeted'  => count($toDelete),
    'rows_deleted'   => $deleted,
    'total_after'    => $after,
    'sample_targets' => array_slice($toDelete, 0, 10),
]);
