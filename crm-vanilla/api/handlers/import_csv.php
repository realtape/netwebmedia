<?php
/**
 * Bulk-import Chile campaign leads from all_leads_5x.csv into the CRM contacts table.
 *
 * Token-protected. Safe to run multiple times — uses INSERT IGNORE on email.
 *
 * GET /api/?r=import_csv&token=NWM_IMPORT_CHILE_2026
 *   → reads api-php/data/all_leads_5x.csv, inserts rows, returns stats.
 * GET /api/?r=import_csv&token=NWM_IMPORT_CHILE_2026&dry=1
 *   → parse + count only, no DB writes.
 */
if ($method !== 'GET') jsonError('Use GET', 405);
if (!hash_equals(IMPORT_CSV_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

$dry = !empty($_GET['dry']);

// Path to the 5x leads CSV (relative to public_html root)
$ROOT    = realpath(__DIR__ . '/../../..');
$csvPath = $ROOT . '/api-php/data/all_leads_5x.csv';

if (!file_exists($csvPath)) {
    jsonError('all_leads_5x.csv not found at ' . $csvPath, 500);
}

// Ensure UNIQUE index on email (idempotent)
$db = getDB();
try {
    $db->exec('ALTER TABLE contacts ADD UNIQUE KEY idx_email_unique (email)');
} catch (Throwable $e) {
    // Already exists — fine
}

// Parse CSV
$rows = [];
$fp   = fopen($csvPath, 'r');
$headers = fgetcsv($fp);
// Normalise headers (strip BOM)
$headers[0] = ltrim($headers[0], "\xEF\xBB\xBF");

$hMap = array_flip($headers);
$get  = function (array $row, string $col) use ($hMap): string {
    return isset($hMap[$col]) ? trim($row[$hMap[$col]] ?? '') : '';
};

while ($row = fgetcsv($fp)) {
    if (count($row) !== count($headers)) continue;
    $email = strtolower(trim($row[$hMap['email'] ?? 0] ?? ''));
    if ($email === '' || strpos($email, '@') === false || $email === 'not found') continue;

    // Build notes JSON with campaign metadata
    $meta = [
        'city'      => $get($row, 'city'),
        'niche_key' => $get($row, 'niche_key'),
        'niche'     => $get($row, 'niche'),
        'website'   => $get($row, 'website'),
        'source'    => 'chile_campaign_2026',
    ];
    // Preserve any existing notes content
    $existing = $get($row, 'notes');
    if ($existing !== '') {
        $meta['original_notes'] = $existing;
    }

    $rows[] = [
        'name'         => $get($row, 'name')    ?: $get($row, 'company'),
        'email'        => $email,
        'phone'        => $get($row, 'phone'),
        'company'      => $get($row, 'company'),
        'role'         => $get($row, 'role'),
        'status'       => 'lead',
        'value'        => 0,
        'last_contact' => date('Y-m-d'),
        'notes'        => json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'segment'      => 'chile_' . ($get($row, 'city') ?: 'unknown'),
    ];
}
fclose($fp);

$parsed    = count($rows);
$inserted  = 0;
$skipped   = 0;

if (!$dry) {
    $stmt = $db->prepare(
        'INSERT IGNORE INTO contacts (name, email, phone, company, role, status, value, last_contact, notes, segment)
         VALUES (:name, :email, :phone, :company, :role, :status, :value, :last_contact, :notes, :segment)'
    );
    foreach ($rows as $c) {
        $stmt->execute([
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
        ]);
        if ($stmt->rowCount() > 0) {
            $inserted++;
        } else {
            $skipped++;
        }
    }
}

// Niche breakdown
$niches = [];
foreach ($rows as $r) {
    $nk = json_decode($r['notes'], true)['niche_key'] ?? 'unknown';
    $niches[$nk] = ($niches[$nk] ?? 0) + 1;
}
ksort($niches);

jsonResponse([
    'dry_run'      => $dry,
    'csv'          => basename($csvPath),
    'parsed'       => $parsed,
    'inserted'     => $dry ? 0 : $inserted,
    'skipped_dupe' => $dry ? 0 : $skipped,
    'by_niche'     => $niches,
]);
