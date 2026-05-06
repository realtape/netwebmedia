<?php
/**
 * Export contacts as a Bird-compatible CSV.
 *
 * GET /crm-vanilla/api/?r=export_bird&token=<MIGRATE_TOKEN>
 *   → Downloads contacts.csv with Bird column headers.
 *
 * Optional filters:
 *   ?status=lead|client|...  filter by status
 *   ?segment=usa             prefix match on segment
 *   ?limit=N                 max rows (default all, hard cap 50000)
 *
 * Auth: token-based (uses MIGRATE_TOKEN). Token-gated bulk export — pinned to
 * master org, never per-tenant.
 *
 * Bird column spec: https://docs.bird.com/api/contacts
 *   Required: email -OR- phone (at least one)
 */

if ($method !== 'GET') jsonError('Use GET', 405);

if (!hash_equals(MIGRATE_TOKEN, (string)($_GET['token'] ?? ''))) {
    jsonError('Invalid token', 403);
}

require_once __DIR__ . '/../lib/tenancy.php';
pin_org_to_master();

$db = getDB();

$where  = [];
$params = [];

if (!empty($_GET['status'])) {
    $where[] = 'status = ?';
    $params[] = $_GET['status'];
}
if (!empty($_GET['segment'])) {
    $where[] = 'segment LIKE ?';
    $params[] = $_GET['segment'] . '%';
}

// Bird requires at least an email or phone per contact
$where[] = '((email IS NOT NULL AND email <> \'\') OR (phone IS NOT NULL AND phone <> \'\'))';

$limit  = max(1, min(50000, (int)($_GET['limit'] ?? 50000)));
$wSql   = $where ? (' WHERE ' . implode(' AND ', $where)) : '';
$sql    = 'SELECT id, name, email, phone, company, role, status, segment, notes, last_contact'
        . ' FROM contacts' . $wSql
        . ' ORDER BY id ASC LIMIT ' . $limit;

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="nwm-contacts-bird.csv"');
header('Cache-Control: no-store');

$out = fopen('php://output', 'w');

fputcsv($out, [
    'email',
    'phone',
    'firstName',
    'lastName',
    'company',
    'jobTitle',
    'status',
    'niche',
    'notes',
    'lastContact',
    'crmId',
]);

foreach ($rows as $r) {
    $parts     = explode(' ', trim($r['name'] ?? ''), 2);
    $firstName = $parts[0] ?? '';
    $lastName  = $parts[1] ?? '';

    $phone = preg_replace('/\D/', '', $r['phone'] ?? '');
    if ($phone !== '') {
        if (strlen($phone) === 9 && $phone[0] === '9') {
            $phone = '+56' . $phone;
        } elseif (strlen($phone) === 10) {
            $phone = '+1' . $phone;
        } elseif ($phone[0] !== '+') {
            $phone = '+' . $phone;
        }
    }

    fputcsv($out, [
        $r['email']        ?? '',
        $phone,
        $firstName,
        $lastName,
        $r['company']      ?? '',
        $r['role']         ?? '',
        $r['status']       ?? '',
        $r['segment']      ?? '',
        $r['notes']        ?? '',
        $r['last_contact'] ?? '',
        (int)$r['id'],
    ]);
}

fclose($out);
exit;
