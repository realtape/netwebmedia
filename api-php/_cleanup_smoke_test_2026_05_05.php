<?php
/**
 * One-shot cleanup for smoke-test rows created during 2026-05-05 audit.
 *
 * Scope: rows where the data.email matches '@nwm-test.local' (a TLD that
 * does not exist publicly — guarantees no real customer is touched).
 *
 * Token-gated with MIGRATE_TOKEN. Invoked via the router group
 * `cleanup-smoke-test-20260505` registered in index.php.
 *
 * Usage:
 *   curl "https://netwebmedia.com/api/cleanup-smoke-test-20260505?token=..."
 *
 * Idempotent: re-running returns zero counts after the first success.
 */
declare(strict_types=1);

// db.php is already required by index.php; no extra requires needed here.

$token = $_GET['token'] ?? '';
$expected = defined('MIGRATE_TOKEN') ? MIGRATE_TOKEN : 'NWM_MIGRATE_2026';
if (!hash_equals($expected, $token)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'forbidden']);
    return;
}

header('Content-Type: application/json');

$pattern = '%@nwm-test.local%';
$results = [];

// 1. Delete contacts in resources table where data.email LIKE pattern
try {
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT id FROM resources " .
        "WHERE type='contact' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) LIKE ?"
    );
    $stmt->execute([$pattern]);
    $contactIds = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN, 0));
    if ($contactIds) {
        $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
        $del = $pdo->prepare("DELETE FROM resources WHERE id IN ($placeholders)");
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
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT id FROM form_submissions WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) LIKE ?"
    );
    $stmt->execute([$pattern]);
    $subIds = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN, 0));
    if ($subIds) {
        $placeholders = implode(',', array_fill(0, count($subIds), '?'));
        $del = $pdo->prepare("DELETE FROM form_submissions WHERE id IN ($placeholders)");
        $del->execute($subIds);
        $results['form_submissions'] = ['deleted' => $del->rowCount(), 'ids' => $subIds];
    } else {
        $results['form_submissions'] = ['deleted' => 0, 'ids' => []];
    }
} catch (Throwable $e) {
    $results['form_submissions'] = ['error' => $e->getMessage()];
}

// 3. Delete email_sequence_queue rows for those test emails
try {
    $pdo  = db();
    $stmt = $pdo->prepare("DELETE FROM email_sequence_queue WHERE email LIKE ?");
    $stmt->execute([$pattern]);
    $results['email_sequence_queue'] = ['deleted' => $stmt->rowCount()];
} catch (Throwable $e) {
    $results['email_sequence_queue'] = ['error' => $e->getMessage()];
}

echo json_encode($results, JSON_PRETTY_PRINT);
