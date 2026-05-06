<?php
/**
 * Export contacts as a Bird-compatible CSV.
 *
 * GET /crm-vanilla/api/?r=export_bird
 *   → Downloads contacts.csv with Bird column headers.
 *
 * Optional filters (same as contacts list):
 *   ?status=lead|client|...  filter by status
 *   ?segment=usa             prefix match on segment
 *   ?limit=N                 max rows (default all, hard cap 50000)
 *
 * Auth: requires valid X-Auth-Token (same as CRM session).
 * Bird column spec: https://docs.bird.com/api/contacts
 *   Required: email -OR- phone (at least one)
 *   Optional: firstName, lastName + any custom identifier attribute
 */

require_once __DIR__ . '/../lib/tenancy.php';

if ($method !== 'GET') jsonError('Use GET', 405);

$db = getDB();
[$tWhere, $tParams] = tenancy_where();

$where  = [];
$params = [];
if ($tWhere) { $where[] = $tWhere; $params = array_merge($params, $tParams); }

if (!empty($_GET['status'])) {
    $where[] = 'status = ?';
    $params[] = $_GET['status'];
}
if (!empty($_GET['segment'])) {
    $where[] = 'segment LIKE ?';
    $params[] = $_GET['segment'] . '%';
}

// exclude rows with no email AND no phone — Bird requires at least one
$where[] = '(email IS NOT NULL AND email <> \'\') OR (phone IS NOT NULL AND phone <> \'\')';

$limit  = max(1, min(50000, (int)($_GET['limit'] ?? 50000)));
$wSql   = $where ? (' WHERE ' . implode(' AND ', $where)) : '';
$sql    = 'SELECT id, name, email, phone, company, role, status, segment, notes, last_contact'
        . ' FROM contacts' . $wSql
        . ' ORDER BY id ASC LIMIT ' . $limit;

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Stream CSV
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="nwm-contacts-bird.csv"');
header('Cache-Control: no-store');

$out = fopen('php://output', 'w');

// Bird column headers — firstName/lastName are the identifier attributes Bird maps
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
    // Split full name into first / last
    $parts     = explode(' ', trim($r['name'] ?? ''), 2);
    $firstName = $parts[0] ?? '';
    $lastName  = $parts[1] ?? '';

    // Normalise phone to E.164 if it doesn't already start with +
    $phone = preg_replace('/\D/', '', $r['phone'] ?? '');
    if ($phone !== '' && $phone[0] !== '+') {
        // Assume Chilean (+56) if 9-digit starting with 9, otherwise leave bare
        if (strlen($phone) === 9 && $phone[0] === '9') {
            $phone = '+56' . $phone;
        } elseif (strlen($phone) === 10) {
            // US 10-digit
            $phone = '+1' . $phone;
        } else {
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
