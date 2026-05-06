<?php
/**
 * One-shot cleanup for smoke-test rows created during 2026-05-05 audit.
 *
 * Scope: rows where the data.email matches '@nwm-test.local' (a TLD that
 * does not exist publicly — guarantees no real customer is touched).
 *
 * Token-gated with MIGRATE_TOKEN. Run once via curl, then this file is
 * deleted in the same commit. Idempotent: re-running returns zero counts.
 *
 * Usage:
 *   curl -A "Mozilla/5.0" "https://netwebmedia.com/api/_cleanup_smoke_test_2026_05_05.php?token=..."
 */
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/db.php';

$token = $_GET['token'] ?? '';
$expected = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : 'NWM_MIGRATE_2026';
if (!hash_equals($expected, $token)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'forbidden']);
    exit;
}

header('Content-Type: application/json');

$pattern = '%@nwm-test.local%';
$results = [];

$db = pdo();

// 1. Delete contacts in resources table where data.email LIKE pattern
try {
    // Find them first so we can return ids
    $stmt = $db->prepare(
        "SELECT id, JSON_EXTRACT(data, '$.email') AS email FROM resources " .
        "WHERE type='contact' AND JSON_EXTRACT(data, '$.email') LIKE ?"
    );
    $stmt->execute([$pattern]);
    $contactIds = [];
    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $contactIds[] = (int)$r['id'];
    }
    if ($contactIds) {
        $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
        $del = $db->prepare("DELETE FROM resources WHERE id IN ($placeholders)");
        $del->execute($contactIds);
        $results['resources_contacts'] = ['deleted' => $del->rowCount(), 'ids' => $contactIds];
    } else {
        $results['resources_contacts'] = ['deleted' => 0, 'ids' => []];
    }
} catch (Throwable $e) {
    $results['resources_contacts'] = ['error' => $e->getMessage()];
}

// 2. Delete form_submissions where data.email LIKE pattern
try {
    $stmt = $db->prepare(
        "SELECT id FROM form_submissions WHERE JSON_EXTRACT(data, '$.email') LIKE ?"
    );
    $stmt->execute([$pattern]);
    $subIds = [];
    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $subIds[] = (int)$r['id'];
    }
    if ($subIds) {
        $placeholders = implode(',', array_fill(0, count($subIds), '?'));
        $del = $db->prepare("DELETE FROM form_submissions WHERE id IN ($placeholders)");
        $del->execute($subIds);
        $results['form_submissions'] = ['deleted' => $del->rowCount(), 'ids' => $subIds];
    } else {
        $results['form_submissions'] = ['deleted' => 0, 'ids' => []];
    }
} catch (Throwable $e) {
    $results['form_submissions'] = ['error' => $e->getMessage()];
}

// 3. Delete queued email_sequence_queue rows for those test emails
try {
    $stmt = $db->prepare("DELETE FROM email_sequence_queue WHERE email LIKE ?");
    $stmt->execute([$pattern]);
    $results['email_sequence_queue'] = ['deleted' => $stmt->rowCount()];
} catch (Throwable $e) {
    // Table may not have an 'email' column directly — try via contact_id JOIN
    try {
        $stmt = $db->prepare(
            "DELETE eq FROM email_sequence_queue eq " .
            "INNER JOIN resources r ON r.id = eq.contact_id " .
            "WHERE JSON_EXTRACT(r.data, '$.email') LIKE ?"
        );
        $stmt->execute([$pattern]);
        $results['email_sequence_queue'] = ['deleted_via_join' => $stmt->rowCount()];
    } catch (Throwable $e2) {
        $results['email_sequence_queue'] = ['error' => $e->getMessage(), 'fallback_error' => $e2->getMessage()];
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
