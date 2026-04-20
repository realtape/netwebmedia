<?php
/**
 * HubSpot client — shared functions for contacts sync.
 * Pure library: no routing, no HTTP response.
 */
if (defined('HS_CLIENT_LOADED')) return;
define('HS_CLIENT_LOADED', true);

if (!defined('HS_BASE')) define('HS_BASE', 'https://api.hubapi.com');

function hs_request(string $method, string $path, array $payload = null): array {
    if (!defined('HUBSPOT_TOKEN') || HUBSPOT_TOKEN === '') {
        return ['code' => 0, 'body' => ['error' => 'no_token']];
    }
    $ch = curl_init(HS_BASE . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . HUBSPOT_TOKEN,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 30,
    ]);
    if ($payload !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($raw, true) ?: []];
}

function hs_split_name(string $full): array {
    $parts = preg_split('/\s+/', trim($full), 2);
    return [$parts[0] ?? '', $parts[1] ?? ''];
}

function hs_find_by_email(string $email): ?string {
    $r = hs_request('POST', '/crm/v3/objects/contacts/search', [
        'filterGroups' => [[
            'filters' => [[
                'propertyName' => 'email', 'operator' => 'EQ', 'value' => $email,
            ]],
        ]],
        'properties' => ['email'],
        'limit' => 1,
    ]);
    return $r['body']['results'][0]['id'] ?? null;
}

function hs_upsert_contact(array $c): ?string {
    if (empty($c['email'])) return null;
    [$first, $last] = hs_split_name($c['name'] ?? '');
    $props = [
        'email'     => $c['email'],
        'firstname' => $first ?: ($c['first_name'] ?? ''),
        'lastname'  => $last  ?: ($c['last_name']  ?? ''),
        'phone'     => $c['phone']   ?? '',
        'company'   => $c['company'] ?? '',
        'lifecyclestage' => ($c['status'] ?? '') === 'customer' ? 'customer' : 'lead',
    ];
    $existing = hs_find_by_email($c['email']);
    if ($existing) {
        $r = hs_request('PATCH', "/crm/v3/objects/contacts/$existing", ['properties' => $props]);
        return $r['code'] < 300 ? $existing : null;
    }
    $r = hs_request('POST', '/crm/v3/objects/contacts', ['properties' => $props]);
    return $r['body']['id'] ?? null;
}

function hs_pull_into_local(PDO $db): array {
    $after = null; $inserted = 0; $updated = 0; $skipped = 0;
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

function hs_push_all(PDO $db): array {
    $stmt = $db->query("SELECT * FROM contacts WHERE email IS NOT NULL AND email <> ''");
    $pushed = 0; $failed = 0;
    while ($c = $stmt->fetch()) {
        $hsId = hs_upsert_contact($c);
        if ($hsId) $pushed++; else $failed++;
    }
    return compact('pushed', 'failed');
}
