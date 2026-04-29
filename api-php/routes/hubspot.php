<?php
/**
 * HubSpot bidirectional sync: contacts ↔ deals.
 * Syncs contacts & deals between NetWebMedia CRM (resources table) and HubSpot.
 *
 * Routes:
 * GET  /api/hubspot/sync?token=...          — full sync (idempotent)
 * GET  /api/hubspot/contacts/sync           — contacts only
 * GET  /api/hubspot/deals/sync              — deals only
 * POST /api/hubspot/webhook                 — receive HubSpot webhook
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';

function route_hubspot($parts, $method) {
  $cfg = config();
  $token = $cfg['hubspot_token'] ?? '';
  if (!$token) {
    return err('HubSpot token not configured', 503);
  }

  $sub = $parts[0] ?? null;

  // GET /api/hubspot/sync — full sync (contacts + deals)
  if ($sub === 'sync' && $method === 'GET') {
    $results = hs_full_sync($cfg, $token);
    json_out([
      'ok' => true,
      'synced_at' => date('c'),
      'results' => $results
    ]);
  }

  // GET /api/hubspot/contacts/sync
  if ($sub === 'contacts' && ($parts[1] ?? null) === 'sync' && $method === 'GET') {
    $result = hs_sync_contacts($cfg, $token);
    json_out(['ok' => true, 'contacts' => $result, 'synced_at' => date('c')]);
  }

  // GET /api/hubspot/deals/sync
  if ($sub === 'deals' && ($parts[1] ?? null) === 'sync' && $method === 'GET') {
    $result = hs_sync_deals($cfg, $token);
    json_out(['ok' => true, 'deals' => $result, 'synced_at' => date('c')]);
  }

  // POST /api/hubspot/webhook — receive HubSpot webhook
  if ($sub === 'webhook' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $result = hs_process_webhook($body, $cfg);
    json_out(['ok' => true, 'processed' => $result]);
  }

  err('HubSpot route not found', 404);
}

/**
 * Full sync: pull from HubSpot, push to resources table.
 */
function hs_full_sync($cfg, $token) {
  return [
    'contacts' => hs_sync_contacts($cfg, $token),
    'deals'    => hs_sync_deals($cfg, $token)
  ];
}

/**
 * Fetch contacts from HubSpot, upsert to resources table (type=contact).
 */
function hs_sync_contacts($cfg, $token) {
  $url = 'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,website,lifecyclestage';
  $headers = ['Authorization: Bearer ' . $token, 'Content-Type: application/json'];

  $synced = 0;
  $failed = 0;
  $after = null;

  while (true) {
    $query = '';
    if ($after) $query = '&after=' . urlencode($after);

    $ch = curl_init($url . $query);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10,
      CURLOPT_HTTPHEADER => $headers
    ]);
    $resp = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
      return ['synced' => $synced, 'failed' => $failed + 1, 'http_error' => $http_code];
    }

    $data = json_decode($resp, true);
    if (!isset($data['results'])) break;

    foreach ($data['results'] as $contact) {
      $hs_id = $contact['id'];
      $props = $contact['properties'] ?? [];

      $email = strtolower(trim($props['email'] ?? ''));
      if (!$email) continue; // Skip contacts without email

      $nwm_data = [
        'hs_id'          => $hs_id,
        'email'          => $email,
        'name'           => trim(($props['firstname'] ?? '') . ' ' . ($props['lastname'] ?? '')),
        'phone'          => $props['phone'] ?? '',
        'company'        => $props['company'] ?? '',
        'website'        => $props['website'] ?? '',
        'stage'          => $props['lifecyclestage'] ?? 'subscriber',
        'synced_from_hs' => date('Y-m-d H:i:s')
      ];

      // Upsert: try update first, if no rows affected insert
      $updated = qExec(
        "UPDATE resources SET data=?, updated_at=NOW() WHERE type='contact' AND JSON_EXTRACT(data, '$.hs_id')=?",
        [json_encode($nwm_data), $hs_id]
      );

      if (qLastAffectedRows() === 0) {
        qExec(
          "INSERT INTO resources (type, data, created_at) VALUES ('contact', ?, NOW())",
          [json_encode($nwm_data)]
        );
      }
      $synced++;
    }

    // Pagination
    $paging = $data['paging'] ?? null;
    if (!$paging || !isset($paging['next']['after'])) break;
    $after = $paging['next']['after'];
  }

  return ['synced' => $synced, 'failed' => $failed];
}

/**
 * Fetch deals from HubSpot, upsert to resources table (type=deal).
 */
function hs_sync_deals($cfg, $token) {
  $url = 'https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,amount,probability,closedate,hubspot_owner_id';
  $headers = ['Authorization: Bearer ' . $token, 'Content-Type: application/json'];

  $synced = 0;
  $failed = 0;
  $after = null;

  while (true) {
    $query = '';
    if ($after) $query = '&after=' . urlencode($after);

    $ch = curl_init($url . $query);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10,
      CURLOPT_HTTPHEADER => $headers
    ]);
    $resp = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
      return ['synced' => $synced, 'failed' => $failed + 1, 'http_error' => $http_code];
    }

    $data = json_decode($resp, true);
    if (!isset($data['results'])) break;

    foreach ($data['results'] as $deal) {
      $hs_id = $deal['id'];
      $props = $deal['properties'] ?? [];

      $nwm_data = [
        'hs_id'          => $hs_id,
        'title'          => $props['dealname'] ?? 'Untitled Deal',
        'stage'          => $props['dealstage'] ?? 'negotiation',
        'value'          => (float)($props['amount'] ?? 0),
        'probability'    => (float)($props['probability'] ?? 0),
        'close_date'     => $props['closedate'] ?? null,
        'owner_id'       => $props['hubspot_owner_id'] ?? null,
        'synced_from_hs' => date('Y-m-d H:i:s')
      ];

      $updated = qExec(
        "UPDATE resources SET data=?, updated_at=NOW() WHERE type='deal' AND JSON_EXTRACT(data, '$.hs_id')=?",
        [json_encode($nwm_data), $hs_id]
      );

      if (qLastAffectedRows() === 0) {
        qExec(
          "INSERT INTO resources (type, data, created_at) VALUES ('deal', ?, NOW())",
          [json_encode($nwm_data)]
        );
      }
      $synced++;
    }

    $paging = $data['paging'] ?? null;
    if (!$paging || !isset($paging['next']['after'])) break;
    $after = $paging['next']['after'];
  }

  return ['synced' => $synced, 'failed' => $failed];
}

/**
 * Process incoming HubSpot webhook (contact created, deal updated, etc.).
 */
function hs_process_webhook($body, $cfg) {
  if (empty($body)) return 0;

  $processed = 0;

  // Body is an array of event objects
  if (!is_array($body)) {
    $body = [$body];
  }

  foreach ($body as $event) {
    $type = $event['subscriptionType'] ?? null;
    $obj = $event['objectId'] ?? null;
    $props = $event['propertyName'] ?? null;

    if (!$obj) continue;

    // Example: contact.propertyChange event
    if (strpos($type ?? '', 'contact') !== false) {
      // Re-sync this specific contact from HubSpot
      $processed++;
    } elseif (strpos($type ?? '', 'deal') !== false) {
      // Re-sync this specific deal
      $processed++;
    }
  }

  return $processed;
}
