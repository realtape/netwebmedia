<?php
/*
 * Vapi.ai API helper — outbound + inbound voice AI agents
 *
 * Config keys (in /home/webmed6/.netwebmedia-config.php):
 *   vapi_api_key          — Vapi private key (Dashboard → Org → API Keys)
 *   vapi_assistant_id     — default assistant ID to use for outbound calls
 *   vapi_phone_number_id  — Vapi phone number ID (linked to Twilio number)
 *
 * Usage:
 *   vapi_call($to_phone, $assistant_id)     → call object
 *   vapi_call_status($call_id)              → status
 *   vapi_list_calls($limit)                 → recent calls
 *   vapi_create_assistant($name, $prompt)   → assistant object
 *   vapi_list_assistants()                  → assistant list
 */

function vapi_api(string $method, string $path, array $body = []): array {
  $cfg = config();
  $key = $cfg['vapi_api_key'] ?? '';
  if (!$key) return ['error' => 'vapi_api_key not configured'];

  $ch = curl_init('https://api.vapi.ai' . $path);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_HTTPHEADER     => [
      'Authorization: Bearer ' . $key,
      'Content-Type: application/json',
    ],
  ];

  if ($method === 'POST') {
    $opts[CURLOPT_POST]       = true;
    $opts[CURLOPT_POSTFIELDS] = json_encode($body);
  } elseif ($method !== 'GET') {
    $opts[CURLOPT_CUSTOMREQUEST] = $method;
    if ($body) $opts[CURLOPT_POSTFIELDS] = json_encode($body);
  }

  curl_setopt_array($ch, $opts);
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $j = json_decode($resp, true) ?: [];
  if ($code >= 300) $j['_http'] = $code;
  return $j;
}

/*
 * Place an outbound call to $to_phone.
 * Uses vapi_phone_number_id from config as the caller ID.
 * $assistant_id defaults to vapi_assistant_id from config.
 */
function vapi_call(string $to_phone, ?string $assistant_id = null, array $extra = []): array {
  $cfg          = config();
  $assistant_id = $assistant_id ?? ($cfg['vapi_assistant_id'] ?? null);
  $phone_id     = $cfg['vapi_phone_number_id'] ?? null;

  if (!$assistant_id) return ['error' => 'vapi_assistant_id not configured'];
  if (!$phone_id)     return ['error' => 'vapi_phone_number_id not configured'];

  return vapi_api('POST', '/call/phone', array_merge([
    'assistantId'   => $assistant_id,
    'phoneNumberId' => $phone_id,
    'customer'      => ['number' => $to_phone],
  ], $extra));
}

/* Get status of a call */
function vapi_call_status(string $call_id): array {
  return vapi_api('GET', '/call/' . urlencode($call_id));
}

/* List recent calls */
function vapi_list_calls(int $limit = 50): array {
  return vapi_api('GET', '/call?limit=' . $limit);
}

/*
 * Create a new assistant.
 * $system_prompt — the assistant's persona + instructions
 */
function vapi_create_assistant(string $name, string $system_prompt, array $opts = []): array {
  return vapi_api('POST', '/assistant', array_merge([
    'name'  => $name,
    'model' => [
      'provider' => 'anthropic',
      'model'    => 'claude-haiku-4-5-20251001',
      'messages' => [['role' => 'system', 'content' => $system_prompt]],
    ],
    'voice' => [
      'provider' => 'playai',
      'voiceId'  => 'jennifer',
    ],
    'firstMessage'         => $opts['first_message'] ?? 'Hi! Thanks for calling. How can I help you today?',
    'endCallFunctionEnabled' => true,
    'recordingEnabled'       => true,
  ], $opts));
}

/* List all assistants */
function vapi_list_assistants(): array {
  return vapi_api('GET', '/assistant');
}

/*
 * Provision a Vapi phone number linked to your Twilio credentials.
 * Only needed once during setup.
 */
function vapi_provision_twilio_number(string $twilio_sid, string $twilio_token, string $phone_number): array {
  return vapi_api('POST', '/phone-number', [
    'provider'    => 'twilio',
    'number'      => $phone_number,
    'twilioAccountSid'  => $twilio_sid,
    'twilioAuthToken'   => $twilio_token,
  ]);
}
