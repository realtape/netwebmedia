<?php
/**
 * Bulk-import best-prospect leads (Chile or USA) into the CRM contacts table.
 *
 * Token-protected. Safe to run multiple times — uses INSERT IGNORE on email.
 *
 * GET /api/?r=import_best&token=NWM_IMPORT_BEST_2026&country=chile
 *   → reads api-php/data/chile_best_prospects.csv
 * GET /api/?r=import_best&token=NWM_IMPORT_BEST_2026&country=usa
 *   → reads api-php/data/usa_best_prospects.csv
 * Add &dry=1 to preview without DB writes.
 */
if ($method !== 'GET') jsonError('Use GET', 405);
if (!hash_equals(IMPORT_BEST_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
// SECURITY (C2): pin to master — token-gated bulk import, never per-org.
require_once __DIR__ . '/../lib/tenancy.php';
pin_org_to_master();

$dry        = !empty($_GET['dry']);
$country    = strtolower(trim($_GET['country'] ?? ''));
$chunkStart = max(0, (int)($_GET['offset'] ?? 0));
$chunkSize  = min(10000, max(100, (int)($_GET['chunk'] ?? 5000)));

$csvMap = [
    'chile'    => '/api-php/data/chile_best_prospects.csv',
    'usa'      => '/api-php/data/usa_best_prospects.csv',
    'usa_full' => '/api-php/data/usa_best_200.csv',
];
if (!isset($csvMap[$country])) {
    jsonError('Param country must be: chile | usa | usa_full', 400);
}

$ROOT    = realpath(__DIR__ . '/../../..');
$csvFile = $ROOT . $csvMap[$country];

if (!file_exists($csvFile)) {
    jsonError(basename($csvFile) . ' not found — run gen_best_prospects.py first', 500);
}

// Ensure UNIQUE index on email (idempotent)
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
try {
    $db->exec('ALTER TABLE contacts ADD UNIQUE KEY idx_email_unique (email)');
} catch (Throwable $e) { /* already exists */ }
$importOrgId = is_org_schema_applied() ? (current_org_id() ?? ORG_MASTER_ID) : null;

// Parse CSV (with optional chunking for large files) --------------------------
$rows    = [];
$lineNum = 0;
$fp      = fopen($csvFile, 'r');
$headers = fgetcsv($fp);
$headers[0] = ltrim($headers[0], "\xEF\xBB\xBF");   // strip BOM
$hMap    = array_flip($headers);

$get = function (array $row, string $col) use ($hMap): string {
    return isset($hMap[$col]) ? trim($row[$hMap[$col]] ?? '') : '';
};

while ($raw = fgetcsv($fp)) {
    if (count($raw) !== count($headers)) { $lineNum++; continue; }
    // Chunked windowing: skip rows outside [chunkStart, chunkStart+chunkSize)
    if ($lineNum < $chunkStart)                        { $lineNum++; continue; }
    if ($lineNum >= $chunkStart + $chunkSize)          { break; }
    $lineNum++;

    $email = strtolower(trim($raw[$hMap['email'] ?? 0] ?? ''));
    if ($email === '' || strpos($email, '@') === false) continue;

    // Build notes JSON with campaign metadata
    $meta = [
        'city'      => $get($raw, 'city'),
        'niche_key' => $get($raw, 'niche_key'),
        'niche'     => $get($raw, 'niche'),
        'website'   => $get($raw, 'website'),
        'source'    => $country . '_best_2026',
    ];
    if ($country === 'usa') {
        $meta['state']      = $get($raw, 'state');
        $meta['state_code'] = $get($raw, 'state_code');
    }
    $existing = $get($raw, 'notes');
    if ($existing !== '' && $existing !== '{}') {
        $decoded = json_decode($existing, true);
        if ($decoded) {
            $meta = array_merge($decoded, $meta);  // merge, our keys win
        } else {
            $meta['original_notes'] = $existing;
        }
    }

    // Segment: chile_<city> or usa_<state_code>
    if ($country === 'chile') {
        $segment = 'chile_' . ($meta['city'] ?: 'unknown');
    } else {
        $code    = strtolower($get($raw, 'state_code') ?: 'us');
        $segment = 'usa_' . $code;
    }

    $rows[] = [
        'name'         => $get($raw, 'name')    ?: $get($raw, 'company'),
        'email'        => $email,
        'phone'        => $get($raw, 'phone'),
        'company'      => $get($raw, 'company'),
        'role'         => $get($raw, 'role'),
        'status'       => 'lead',
        'value'        => 0,
        'last_contact' => date('Y-m-d'),
        'notes'        => json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'segment'      => $segment,
    ];
}
fclose($fp);

$parsed   = count($rows);
$inserted = 0;
$skipped  = 0;

// Insert ----------------------------------------------------------------------
if (!$dry) {
    if ($importOrgId !== null) {
        $stmt = $db->prepare(
            'INSERT IGNORE INTO contacts
                 (organization_id, name, email, phone, company, role, status, value, last_contact, notes, segment)
             VALUES
                 (:organization_id, :name, :email, :phone, :company, :role, :status, :value, :last_contact, :notes, :segment)'
        );
    } else {
        $stmt = $db->prepare(
            'INSERT IGNORE INTO contacts
                 (name, email, phone, company, role, status, value, last_contact, notes, segment)
             VALUES
                 (:name, :email, :phone, :company, :role, :status, :value, :last_contact, :notes, :segment)'
        );
    }
    foreach ($rows as $c) {
        $bind = [
            ':name'         => $c['name'],
            ':email'        => $c['email'],
            ':phone'        => $c['phone'],
            ':company'      => $c['company'],
            ':role'         => $c['role'],
            ':status'       => $c['status'],
            ':value'        => $c['value'],
            ':last_contact' => $c['last_contact'],
            ':notes'        => $c['notes'],
            ':segment'      => $c['segment'],
        ];
        if ($importOrgId !== null) $bind[':organization_id'] = $importOrgId;
        $stmt->execute($bind);
        $inserted += $stmt->rowCount();
        $skipped  += (1 - $stmt->rowCount());
    }
}

// Niche breakdown -------------------------------------------------------------
$niches = [];
foreach ($rows as $r) {
    $nk = json_decode($r['notes'], true)['niche_key'] ?? 'unknown';
    $niches[$nk] = ($niches[$nk] ?? 0) + 1;
}
ksort($niches);

// State/city breakdown (top 10) -----------------------------------------------
$regions = [];
foreach ($rows as $r) {
    $meta = json_decode($r['notes'], true) ?? [];
    $key  = $country === 'usa'
        ? ($meta['state'] ?? 'unknown')
        : ($meta['city']  ?? 'unknown');
    $regions[$key] = ($regions[$key] ?? 0) + 1;
}
arsort($regions);
$regions = array_slice($regions, 0, 20, true);

jsonResponse([
    'dry_run'         => $dry,
    'country'         => $country,
    'csv'             => basename($csvFile),
    'chunk_start'     => $chunkStart,
    'chunk_size'      => $chunkSize,
    'next_offset'     => $chunkStart + $chunkSize,
    'parsed'          => $parsed,
    'inserted'        => $dry ? 0 : $inserted,
    'skipped_dupe'    => $dry ? 0 : $skipped,
    'by_niche'        => $niches,
    'by_region_top20' => $regions,
]);
