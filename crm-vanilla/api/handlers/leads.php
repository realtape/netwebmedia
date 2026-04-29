<?php
$db = getDB();

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

        // Check if lead already exists
        $stmt = $db->prepare('SELECT id FROM leads WHERE email = ?');
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Update existing lead
            $db->prepare('UPDATE leads SET last_login = NOW(), login_count = login_count + 1, company = COALESCE(NULLIF(?, ""), company), phone = COALESCE(NULLIF(?, ""), phone) WHERE id = ?')
                ->execute([$company, $phone, $existing['id']]);
            $leadId = (int)$existing['id'];
            $isReturning = true;
        } else {
            // Insert new lead
            $stmt = $db->prepare('INSERT INTO leads (name, email, company, phone, source, created_at, last_login, login_count) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)');
            $stmt->execute([$name, $email, $company, $phone, $source]);
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
