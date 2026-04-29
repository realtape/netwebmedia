<?php
/**
 * One-time dedupe: keep the oldest contact per email (lowest id), delete the rest.
 * Token-protected. Safe to re-run (idempotent — only removes true duplicates).
 *
 * POST /api/?r=dedupe&token=NWM_DEDUPE_2026
 *   Optional: &dry_run=1  -> report only, no deletes
 */
if ($method !== 'POST') jsonError('Use POST', 405);
if (!hash_equals(DEDUPE_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

$dryRun = !empty($_GET['dry_run']);
$db = getDB();

// Count before
$total = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();

// Find duplicate email groups (case-insensitive, ignore blanks/NULLs)
$dups = $db->query("
    SELECT LOWER(TRIM(email)) AS em, COUNT(*) AS n, MIN(id) AS keep_id,
           GROUP_CONCAT(id ORDER BY id) AS ids
    FROM contacts
    WHERE email IS NOT NULL AND TRIM(email) <> ''
    GROUP BY LOWER(TRIM(email))
    HAVING n > 1
")->fetchAll(PDO::FETCH_ASSOC);

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
    // Delete in chunks to avoid oversized IN() clauses
    foreach (array_chunk($toDelete, 500) as $chunk) {
        $ph = implode(',', array_fill(0, count($chunk), '?'));
        $stmt = $db->prepare("DELETE FROM contacts WHERE id IN ($ph)");
        $stmt->execute($chunk);
        $deleted += $stmt->rowCount();
    }
}

$after = (int)$db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();

jsonResponse([
    'dry_run'        => $dryRun,
    'total_before'   => $total,
    'duplicate_groups' => $groups,
    'rows_targeted'  => count($toDelete),
    'rows_deleted'   => $deleted,
    'total_after'    => $after,
    'sample_targets' => array_slice($toDelete, 0, 10),
]);
