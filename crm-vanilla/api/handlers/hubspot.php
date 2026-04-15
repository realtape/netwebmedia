<?php
/**
 * HubSpot ↔ CRM bidirectional sync
 *
 * Routes:
 *   GET  /api/hubspot?action=push     → push all local contacts up to HubSpot
 *   GET  /api/hubspot?action=pull     → pull HubSpot contacts down into local CRM
 *   GET  /api/hubspot?action=sync     → both directions (push then pull)
 *   POST /api/hubspot                 → upsert a single contact (body = {id?, name, email, phone, company})
 *   GET  /api/hubspot?action=status   → test connection and return HubSpot account info
 *
 * Requires HUBSPOT_TOKEN defined in config.php
 */

if (!defined('HUBSPOT_TOKEN') || HUBSPOT_TOKEN === '') {
    jsonError('HUBSPOT_TOKEN not configured on server', 500);
}

define('HS_BASE', 'https://api.hubapi.com');

function hs_request(string $method, string $path, array $payload = null): array {
    $ch = curl_init(HS_BASE . $path);
    $headers = [
        'Authorization: Bearer ' . HUBSPOT_TOKEN,
        'Content-Type: application/json',
    ];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 30,
    ]);
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = json_decode($raw, true) ?: [];
    return ['code' => $code, 'body' => $body];
}

/** Split "Jane Doe" → ["Jane","Doe"] */
function hs_split_name(string $full): array {
    $parts = preg_split('/\s+/', trim($full), 2);
    return [$parts[0] ?? '', $parts[1] ?? ''];
}

/** Find a HubSpot contact by email. Returns HS id or null. */
function hs_find_by_email(string $email): ?string {
    $r = hs_request('POST', '/crm/v3/objects/contacts/search', [
        'filterGroups' => [[
            'filters' => [[
                'propertyName' => 'email',
                'operator'     => 'EQ',
                'value'        => $email,
            ]],
        ]],
        'properties' => ['email', 'firstname', 'lastname', 'phone', 'company'],
        'limit' => 1,
    ]);
    return $r['body']['results'][0]['id'] ?? null;
}

/** Upsert one local contact into HubSpot. Returns HS id. */
function hs_upsert_contact(array $c): ?string {
    if (empty($c['email'])) return null;
    [$first, $last] = hs_split_name($c['name'] ?? '');
    $props = [
        'email'     => $c['email'],
        'firstname' => $first,
        'lastname'  => $last,
        'phone'     => $c['phone']   ?? '',
        'company'   => $c['company'] ?? '',
        'lifecyclestage' => $c['status'] === 'customer' ? 'customer' : 'lead',
    ];
    $existing = hs_find_by_email($c['email']);
    if ($existing) {
        $r = hs_request('PATCH', "/crm/v3/objects/contacts/$existing", ['properties' => $props]);
        return $r['code'] < 300 ? $existing : null;
    }
    $r = hs_request('POST', '/crm/v3/objects/contacts', ['properties' => $props]);
    return $r['body']['id'] ?? null;
}

/** Pull HubSpot contacts into local CRM (upsert by email). */
function hs_pull_into_local(PDO $db): array {
    $after = null;
    $inserted = 0; $updated = 0; $skipped = 0;
    do {
        $path = '/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,phone,company,lifecyclestage';
        if ($after) $path .= '&after=' . urlencode($after);
        $r = hs_request('GET', $path);
        $results = $r['body']['results'] ?? [];
        foreach ($results as $row) {
            $p = $row['properties'] ?? [];
            if (empty($p['email'])) { $skipped++; continue; }
            $name = trim(($p['firstname'] ?? '') . ' ' . ($p['lastname'] ?? '')) ?: $p['email'];
            $status = ($p['lifecyclestage'] ?? '') === 'customer' ? 'customer' : 'lead';

            $find = $db->prepare('SELECT id FROM contacts WHERE email = ? LIMIT 1');
            $find->execute([$p['email']]);
            $existing = $find->fetchColumn();

            if ($existing) {
                $db->prepare('UPDATE contacts SET name=?, phone=?, company=?, status=? WHERE id=?')
                   ->execute([$name, $p['phone'] ?? null, $p['company'] ?? null, $status, $existing]);
                $updated++;
            } else {
                $db->prepare('INSERT INTO contacts (name,email,phone,company,status) VALUES (?,?,?,?,?)')
                   ->execute([$name, $p['email'], $p['phone'] ?? null, $p['company'] ?? null, $status]);
                $inserted++;
            }
        }
        $after = $r['body']['paging']['next']['after'] ?? null;
    } while ($after);
    return compact('inserted', 'updated', 'skipped');
}

/** Push all local contacts with email up to HubSpot. */
function hs_push_all(PDO $db): array {
    $stmt = $db->query("SELECT * FROM contacts WHERE email IS NOT NULL AND email <> ''");
    $pushed = 0; $failed = 0;
    while ($c = $stmt->fetch()) {
        $hsId = hs_upsert_contact($c);
        if ($hsId) $pushed++; else $failed++;
    }
    return compact('pushed', 'failed');
}

// ---- Router ----
$db = getDB();
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'status') {
            $r = hs_request('GET', '/crm/v3/objects/contacts?limit=1');
            jsonResponse([
                'connected' => $r['code'] === 200,
                'http_code' => $r['code'],
                'sample_total' => $r['body']['total'] ?? null,
            ]);
        }
        if ($action === 'pull')  jsonResponse(['pull' => hs_pull_into_local($db)]);
        if ($action === 'push')  jsonResponse(['push' => hs_push_all($db)]);
        if ($action === 'sync') {
            $push = hs_push_all($db);
            $pull = hs_pull_into_local($db);
            jsonResponse(['push' => $push, 'pull' => $pull]);
        }
        jsonError('Unknown action. Use ?action=status|push|pull|sync');
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['email'])) jsonError('email is required');
        $hsId = hs_upsert_contact($data);
        jsonResponse(['hubspot_id' => $hsId, 'ok' => $hsId !== null]);
        break;

    default:
        jsonError('Method not allowed', 405);
}
