<?php
/*
 * Vapi routes
 *   GET  /api/vapi/assistants         list assistants
 *   POST /api/vapi/assistants         create assistant
 *   GET  /api/vapi/calls              list recent calls
 *   POST /api/vapi/calls              place an outbound call
 *   GET  /api/vapi/calls/{id}         get call status
 *   POST /api/vapi/provision          link Twilio number to Vapi (one-time setup)
 */
require_once __DIR__ . '/../lib/vapi.php';

function route_vapi(array $parts, string $method): void {
  requirePaidAccess();

  $sub = $parts[0] ?? '';

  if ($sub === 'assistants' && $method === 'GET') {
    $res = vapi_list_assistants();
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['items' => is_array($res) ? $res : []]);
  }

  if ($sub === 'assistants' && $method === 'POST') {
    $b = required(['name', 'prompt']);
    $res = vapi_create_assistant($b['name'], $b['prompt'], $b['opts'] ?? []);
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['ok' => true, 'assistant' => $res], 201);
  }

  if ($sub === 'calls' && empty($parts[1]) && $method === 'GET') {
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $res = vapi_list_calls($limit);
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['items' => is_array($res) ? $res : []]);
  }

  if ($sub === 'calls' && empty($parts[1]) && $method === 'POST') {
    $b = required(['to']);
    $res = vapi_call($b['to'], $b['assistant_id'] ?? null);
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['ok' => true, 'call_id' => $res['id'] ?? null, 'status' => $res['status'] ?? 'queued'], 202);
  }

  if ($sub === 'calls' && !empty($parts[1]) && $method === 'GET') {
    $res = vapi_call_status($parts[1]);
    if (!empty($res['error'])) err($res['error'], 503);
    json_out($res);
  }

  if ($sub === 'provision' && $method === 'POST') {
    requireAdmin();
    $b = required(['twilio_sid', 'twilio_token', 'phone_number']);
    $res = vapi_provision_twilio_number($b['twilio_sid'], $b['twilio_token'], $b['phone_number']);
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['ok' => true, 'phone_number_id' => $res['id'] ?? null, 'result' => $res]);
  }

  err('Vapi route not found', 404);
}
