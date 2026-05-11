<?php
/**
 * One-shot test-data cleanup for the post-audit smoke test lead.
 *
 * The audit run on 2026-05-06 posted a sample contact to /api/public/forms/submit
 * which created form_submissions.id=22 + a resource of type='contact' with
 * email "audit-smoke-test+nwm@example.com". This endpoint deletes those rows
 * and any other audit-smoke-test entries.
 *
 * Auth: token query param must equal substr(jwt_secret, 0, 16) — same pattern as
 *       api-php/migrate.php so no new secrets are needed.
 *
 * Idempotent: DELETE WHERE email LIKE '%audit-smoke-test%' — safe to re-run.
 *
 * Usage: GET /api/_cleanup_audit_lead.php?token=<first-16-chars-of-jwt_secret>
 *
 * Triggered by .github/workflows/cleanup-audit-lead.yml (workflow_dispatch only).
 * Safe to delete this file after the cleanup has run successfully.
 */
// NOTE: This file is included from api-php/index.php after lib/db.php has
// already been required, so config() and db() are available. Do NOT re-require
// lib/db.php here — it would redeclare function db() and fatal-error.
header('Content-Type: application/json');

$cfg = config();
$expected = substr($cfg['jwt_secret'] ?? '', 0, 16);
$provided = $_GET['token'] ?? '';

if (!$expected || !hash_equals($expected, $provided)) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden']);
  exit;
}

$pdo = db();
$pattern = '%audit-smoke-test%';
$out = ['ok' => true, 'deleted' => []];

try {
  // form_submissions: stored as raw JSON in `data` column
  $stmt = $pdo->prepare("DELETE FROM form_submissions WHERE data LIKE ?");
  $stmt->execute([$pattern]);
  $out['deleted']['form_submissions'] = $stmt->rowCount();
} catch (PDOException $e) {
  $out['errors']['form_submissions'] = $e->getMessage();
}

try {
  // resources of type='contact' carrying the same email in the JSON blob
  $stmt = $pdo->prepare("DELETE FROM resources WHERE type='contact' AND data LIKE ?");
  $stmt->execute([$pattern]);
  $out['deleted']['resources_contact'] = $stmt->rowCount();
} catch (PDOException $e) {
  $out['errors']['resources_contact'] = $e->getMessage();
}

try {
  // activity_log entries referencing the deletion (if column exists)
  $stmt = $pdo->prepare("DELETE FROM activity_log WHERE meta LIKE ?");
  $stmt->execute([$pattern]);
  $out['deleted']['activity_log'] = $stmt->rowCount();
} catch (PDOException $e) {
  // table may not have a 'meta' column on older installs — non-fatal
  $out['warnings']['activity_log'] = $e->getMessage();
}

echo json_encode($out, JSON_PRETTY_PRINT);
