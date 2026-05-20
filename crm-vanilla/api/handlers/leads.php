<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
// Public endpoint: resolve org from host (subdomain / custom domain).
// Falls back to master org (id 1) when nothing matches — the legacy default.
$leadOrgId = null;
if (is_org_schema_applied()) {
    $resolvedOrg = org_from_request();
    $leadOrgId = $resolvedOrg ? (int)$resolvedOrg['id'] : ORG_MASTER_ID;
}

switch ($method) {
    case 'POST':
        // Rate limit unauthenticated POST: 10 per 5 min per IP
        require_once __DIR__ . '/../lib/rate_limit.php';
        rate_limit('leads', 10, 300);

        $data = getInput();
        if (empty($data['name']) || empty($data['email'])) {
            jsonError('Name and email required');
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            jsonError('Valid email required');
        }

        $name = trim($data['name']);
        $email = strtolower(trim($data['email']));
        $company = trim($data['company'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $source = $data['source'] ?? 'demo_signup';

        // Split name into first/last
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0];
        $lastName = isset($nameParts[1]) ? $nameParts[1] : '';

        // Check if lead already exists — scope by org when applied so the same
        // email landing on two different white-label sites creates two distinct leads.
        if ($leadOrgId !== null) {
            $stmt = $db->prepare('SELECT id FROM leads WHERE email = ? AND organization_id = ?');
            $stmt->execute([$email, $leadOrgId]);
        } else {
            $stmt = $db->prepare('SELECT id FROM leads WHERE email = ?');
            $stmt->execute([$email]);
        }
        $existing = $stmt->fetch();

        if ($existing) {
            // Update existing lead
            $db->prepare('UPDATE leads SET last_login = NOW(), login_count = login_count + 1, company = COALESCE(NULLIF(?, ""), company), phone = COALESCE(NULLIF(?, ""), phone) WHERE id = ?')
                ->execute([$company, $phone, $existing['id']]);
            $leadId = (int)$existing['id'];
            $isReturning = true;
        } else {
            // Insert new lead
            if ($leadOrgId !== null) {
                $stmt = $db->prepare('INSERT INTO leads (organization_id, name, email, company, phone, source, created_at, last_login, login_count) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)');
                $stmt->execute([$leadOrgId, $name, $email, $company, $phone, $source]);
            } else {
                $stmt = $db->prepare('INSERT INTO leads (name, email, company, phone, source, created_at, last_login, login_count) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)');
                $stmt->execute([$name, $email, $company, $phone, $source]);
            }
            $leadId = (int)$db->lastInsertId();
            $isReturning = false;
        }

        // Push to HubSpot (async - don't block the response)
        pushToHubSpot($firstName, $lastName, $email, $company, $phone, $source);

        jsonResponse([
            'id' => $leadId,
            'returning' => $isReturning
        ], $isReturning ? 200 : 201);
        break;

    case 'GET':
        // Public route, but if a session-resolved org is present we still
        // filter by it (a logged-in sub-account user calling this can never
        // see another org's leads). Note: leads.php is in $public_routes so
        // tenancy_where() returns '1=0' for unauthenticated callers — preserve
        // the legacy "list everything" behaviour for guest GETs.
        if (function_exists('current_org_id') && is_org_schema_applied() && current_org_id() !== null) {
            [$tWhere, $tParams] = org_where();
            $sql = 'SELECT * FROM leads';
            $params = [];
            if ($tWhere) { $sql .= ' WHERE ' . $tWhere; $params = $tParams; }
            $sql .= ' ORDER BY created_at DESC';
            $st = $db->prepare($sql);
            $st->execute($params);
            jsonResponse($st->fetchAll());
        }
        $stmt = $db->query('SELECT * FROM leads ORDER BY created_at DESC');
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonError('Method not allowed', 405);
}

/**
 * Push contact to HubSpot CRM via v3 API
 */
function pushToHubSpot(string $firstName, string $lastName, string $email, string $company, string $phone, string $source): void {
    $apiKey = defined('HUBSPOT_TOKEN') ? HUBSPOT_TOKEN : '';
    if (empty($apiKey)) return; // Skip if no token configured

    $properties = [
        'firstname' => $firstName,
        'lastname'  => $lastName,
        'email'     => $email,
        'lifecyclestage' => 'lead',
        'hs_lead_status' => 'NEW',
    ];

    if ($company) $properties['company'] = $company;
    if ($phone)   $properties['phone'] = $phone;

    $payload = json_encode(['properties' => $properties]);

    // Try to create contact first
    $ch = curl_init('https://api.hubapi.com/crm/v3/objects/contacts');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // If 409 conflict (contact exists), update instead
    if ($httpCode === 409) {
        $responseData = json_decode($response, true);
        $existingId = $responseData['message'] ?? '';

        // Search for existing contact by email
        $searchPayload = json_encode([
            'filterGroups' => [[
                'filters' => [[
                    'propertyName' => 'email',
                    'operator' => 'EQ',
                    'value' => $email
                ]]
            ]],
            'limit' => 1
        ]);

        $ch = curl_init('https://api.hubapi.com/crm/v3/objects/contacts/search');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $searchPayload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
        ]);

        $searchResult = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if (!empty($searchResult['results'][0]['id'])) {
            $contactId = $searchResult['results'][0]['id'];
            // Update the existing contact
            $ch = curl_init('https://api.hubapi.com/crm/v3/objects/contacts/' . $contactId);
            curl_setopt_array($ch, [
                CURLOPT_CUSTOMREQUEST  => 'PATCH',
                CURLOPT_POSTFIELDS     => json_encode(['properties' => $properties]),
                CURLOPT_HTTPHEADER     => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey,
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 5,
            ]);
            curl_exec($ch);
            curl_close($ch);
        }
    }
}
