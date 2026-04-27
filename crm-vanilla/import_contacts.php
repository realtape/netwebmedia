<?php
/**
 * ONE-TIME BULK CONTACT IMPORTER (server-side reader)
 * -------------------------------------------------------
 * Reads pre-deployed JSON chunks from ./import_data/ and
 * bulk-inserts them into the CRM contacts table.
 *
 * NO POST body — triggered by a single GET request.
 * SECURITY: Protected by a one-time token in the URL.
 *
 * Trigger:
 *   GET https://app.netwebmedia.com/import_contacts.php?token=nwm-import-7f3k2026
 *
 * DELETE THIS FILE AND import_data/ FROM THE REPO after the import.
 */

require_once __DIR__ . '/api/config.php';

define('IMPORT_TOKEN', 'nwm-import-7f3k2026');

header('Content-Type: text/plain; charset=utf-8');

// Auth check
$token = $_GET['token'] ?? '';
if (!hash_equals(IMPORT_TOKEN, $token)) {
    http_response_code(403);
    die("Forbidden — invalid import token\n");
}

// Increase limits for large import
set_time_limit(300);
ini_set('memory_limit', '512M');

$data_dir = __DIR__ . '/import_data';
if (!is_dir($data_dir)) {
    http_response_code(500);
    die("ERROR: import_data/ directory not found\n");
}

$chunk_files = glob($data_dir . '/chunk_*.json');
if (empty($chunk_files)) {
    http_response_code(500);
    die("ERROR: No chunk files found in import_data/\n");
}
sort($chunk_files);

// Optional: skip already-imported chunks (pass ?skip=3 to skip first 3)
$skip = max(0, (int)($_GET['skip'] ?? 0));
if ($skip > 0) {
    $chunk_files = array_slice($chunk_files, $skip);
    echo "Skipping first $skip chunk(s) — starting from chunk " . ($skip + 1) . "\n";
    flush();
}

$db = getDB();
$stmt = $db->prepare(
    'INSERT INTO contacts (name, email, phone, company, role, status, value, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

$total_inserted = 0;
$total_errors   = 0;

foreach ($chunk_files as $file) {
    $basename = basename($file);
    echo "Processing $basename ... ";
    flush();

    $raw = file_get_contents($file);
    if ($raw === false) {
        echo "ERROR: could not read file\n";
        flush();
        $total_errors++;
        continue;
    }

    $batch = json_decode($raw, true);
    if (!is_array($batch)) {
        echo "ERROR: invalid JSON\n";
        flush();
        $total_errors++;
        continue;
    }

    $chunk_inserted = 0;
    $chunk_errors   = 0;

    $db->beginTransaction();
    try {
        foreach ($batch as $c) {
            $name = trim($c['name'] ?? '');
            if ($name === '') { $chunk_errors++; continue; }

            $stmt->execute([
                $name,
                $c['email']   ?? null,
                $c['phone']   ?? null,
                $c['company'] ?? null,
                $c['role']    ?? null,
                $c['status']  ?? 'lead',
                (float)($c['value']  ?? 0),
                $c['notes']   ?? null,
            ]);
            $chunk_inserted++;
        }
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        echo "DB ERROR: " . $e->getMessage() . "\n";
        flush();
        $total_errors += count($batch);
        continue;
    }

    $total_inserted += $chunk_inserted;
    $total_errors   += $chunk_errors;
    echo "inserted=$chunk_inserted errors=$chunk_errors\n";
    flush();
}

echo "\n---\n";
echo "TOTAL INSERTED : $total_inserted\n";
echo "TOTAL ERRORS   : $total_errors\n";
echo "GRAND TOTAL    : " . ($total_inserted + $total_errors) . "\n";
echo "---\n";
echo "Import complete. Remember to delete import_contacts.php and import_data/ from the repo.\n";
