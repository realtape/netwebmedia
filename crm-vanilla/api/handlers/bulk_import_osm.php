<?php
/**
 * Bulk import for OSM-scraped contacts. Token-protected, idempotent (INSERT IGNORE on email).
 *
 * POST /api/?r=bulk_import_osm&token=<IMPORT_BEST_TOKEN>
 *   body: { "contacts": [ {name,email,phone,company,website,city,country,segment,...}, ... ] }
 *
 * Accepts batches up to 1,000 contacts per request. Returns counters:
 *   { inserted, skipped_dup, skipped_missing, total_received, ms }
 */
require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/guard.php';

if ($method !== 'POST') jsonError('POST required', 405);

// Auth: accept EITHER a valid IMPORT_BEST_TOKEN (for cron/CI) OR an authenticated
// superadmin session (for one-off imports from a logged-in operator browser).
$tokenOk = false;
$TOKEN = defined('IMPORT_BEST_TOKEN') ? IMPORT_BEST_TOKEN : 'NWM_IMPORT_BEST_2026';
$providedToken = (string)($_GET['token'] ?? '');
if ($providedToken && hash_equals($TOKEN, $providedToken)) {
    $tokenOk = true;
}
$sessionOk = false;
if (!$tokenOk) {
    $u = guard_user();
    if ($u && ($u['role'] ?? '') === 'superadmin') {
        $sessionOk = true;
    }
}
if (!$tokenOk && !$sessionOk) jsonError('Auth required (token or superadmin session)', 403);

// SECURITY (C2): pin to master org so a token leak + X-Org-Slug can't redirect this.
pin_org_to_master();

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || !is_array($body['contacts'] ?? null)) {
    jsonError('Body must be {"contacts":[...]}', 400);
}
$contacts = $body['contacts'];
$n = count($contacts);
if ($n === 0) jsonResponse(['inserted' => 0, 'received' => 0, 'msg' => 'empty batch']);
if ($n > 1000) jsonError('Batch too large (max 1000 per request)', 413);

$db = getDB();

// Ensure UNIQUE index on email (idempotent — will skip if exists)
try {
    $db->exec('ALTER TABLE contacts ADD UNIQUE KEY idx_email_unique (email)');
} catch (Throwable $_) { /* index exists */ }

$orgId = is_org_schema_applied() ? (current_org_id() ?? ORG_MASTER_ID) : null;

$t0 = microtime(true);
$inserted = 0;
$skipped_dup = 0;
$skipped_missing = 0;

if ($orgId !== null) {
    $stmt = $db->prepare(
        'INSERT IGNORE INTO contacts
         (organization_id, user_id, name, email, phone, company, status, value, last_contact,
          notes, segment)
         VALUES (?, NULL, ?, ?, ?, ?, ?, 0, NULL, ?, ?)'
    );
} else {
    $stmt = $db->prepare(
        'INSERT IGNORE INTO contacts
         (user_id, name, email, phone, company, status, value, last_contact, notes, segment)
         VALUES (NULL, ?, ?, ?, ?, ?, 0, NULL, ?, ?)'
    );
}

$db->beginTransaction();
try {
    foreach ($contacts as $c) {
        $name  = trim((string)($c['name'] ?? ''));
        $email = strtolower(trim((string)($c['email'] ?? '')));
        $phone = trim((string)($c['phone'] ?? ''));
        if (!$name || (!$email && !$phone)) {
            $skipped_missing++;
            continue;
        }
        // notes payload — keep address / website / lat-lon / OSM ID for later
        $notesPayload = [
            'website'      => (string)($c['website']  ?? ''),
            'city'         => (string)($c['city']     ?? ''),
            'country'      => (string)($c['country']  ?? ''),
            'niche'        => (string)($c['niche']    ?? ''),
            'address'      => (string)($c['address']  ?? ''),
            'place_id'     => (string)($c['place_id'] ?? ''),
            'lat'          => (string)($c['lat']      ?? ''),
            'lon'          => (string)($c['lon']      ?? ''),
            'osm_category' => (string)($c['osm_category'] ?? ''),
            'source'       => (string)($c['source']   ?? 'osm_overpass_2026_05_12'),
        ];

        $params = [
            $name,
            $email ?: null,
            $phone ?: null,
            (string)($c['company'] ?? $name),
            (string)($c['status']  ?? 'lead'),
            json_encode($notesPayload, JSON_UNESCAPED_UNICODE),
            (string)($c['segment'] ?? ''),
        ];
        if ($orgId !== null) array_unshift($params, $orgId);

        try {
            $stmt->execute($params);
            if ($stmt->rowCount() > 0) {
                $inserted++;
            } else {
                $skipped_dup++;  // INSERT IGNORE hit unique constraint on email
            }
        } catch (PDOException $e) {
            $skipped_missing++;
        }
    }
    $db->commit();
} catch (Throwable $e) {
    $db->rollBack();
    jsonError('Transaction failed: ' . $e->getMessage(), 500);
}

$ms = (int)((microtime(true) - $t0) * 1000);
jsonResponse([
    'inserted'         => $inserted,
    'skipped_dup'      => $skipped_dup,
    'skipped_missing'  => $skipped_missing,
    'total_received'   => $n,
    'ms'               => $ms,
]);
