<?php
/**
 * Twilio Inbound Webhook — SMS & WhatsApp (tee to ManyChat + CRM)
 *
 * Acts as a transparent proxy:
 *   1. Saves the inbound message to the CRM conversations table
 *   2. Forwards the full POST to MANYCHAT_WEBHOOK_URL
 *   3. Returns ManyChat's TwiML response back to Twilio
 *
 * Twilio webhook URL: https://netwebmedia.com/crm-vanilla/api/webhook_twilio.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/twilio_client.php';

// ManyChat SMS webhook — original destination before the tee
define('MANYCHAT_WEBHOOK_URL', 'https://hooks.manychat.com/smswebhook/twilioSMSReply');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Validate Twilio signature
if (!twilio_validate_signature()) {
    http_response_code(403);
    exit('Forbidden');
}

$from    = trim($_POST['From'] ?? '');
$to      = trim($_POST['To']   ?? '');
$body    = trim($_POST['Body'] ?? '');
$msgSid  = trim($_POST['MessageSid'] ?? '');

if (!$from || !$body) {
    twiml_reply('');
}

// Determine channel from the 'To' number prefix
$channel = (stripos($to, 'whatsapp:') === 0 || stripos($from, 'whatsapp:') === 0)
    ? 'whatsapp' : 'sms';

// Normalise phone: strip "whatsapp:" prefix for storage
$phone = preg_replace('/^whatsapp:/i', '', $from);

$db = getDB();

// Find or create contact by phone
$stmt = $db->prepare('SELECT id, name FROM contacts WHERE phone = ? LIMIT 1');
$stmt->execute([$phone]);
$contact = $stmt->fetch();

if (!$contact) {
    $db->prepare('INSERT INTO contacts (name, phone, status) VALUES (?, ?, ?)')
       ->execute([$phone, $phone, 'lead']);
    $contactId   = (int)$db->lastInsertId();
    $contactName = $phone;
} else {
    $contactId   = (int)$contact['id'];
    $contactName = $contact['name'];
}

// Find or create open conversation for this phone+channel
$stmt = $db->prepare(
    'SELECT id FROM conversations WHERE contact_id = ? AND channel = ? ORDER BY updated_at DESC LIMIT 1'
);
$stmt->execute([$contactId, $channel]);
$conv = $stmt->fetch();

if (!$conv) {
    $db->prepare(
        'INSERT INTO conversations (contact_id, channel, phone, unread) VALUES (?, ?, ?, 1)'
    )->execute([$contactId, $channel, $phone]);
    $convId = (int)$db->lastInsertId();
} else {
    $convId = (int)$conv['id'];
    $db->prepare('UPDATE conversations SET unread = unread + 1, updated_at = NOW() WHERE id = ?')
       ->execute([$convId]);
}

// Store inbound message in CRM
$db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')
   ->execute([$convId, 'them', $body]);

// Forward to ManyChat and relay its TwiML back to Twilio
$twiml = proxy_to_manychat();

// Parse any <Message> from ManyChat's TwiML and save as outbound in CRM
$outbound = extract_twiml_message($twiml);
if ($outbound) {
    $db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')
       ->execute([$convId, 'me', $outbound]);
    $db->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$convId]);
}

header('Content-Type: text/xml');
echo $twiml;
exit;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Forward the raw Twilio POST to ManyChat and return its TwiML response.
 * Falls back to an empty <Response> if ManyChat is unreachable.
 */
function proxy_to_manychat(): string {
    $ch = curl_init(MANYCHAT_WEBHOOK_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $_POST,          // forward identical form fields
        CURLOPT_HTTPHEADER     => [
            // Pass through Twilio's signature header so ManyChat can validate
            'X-Twilio-Signature: ' . ($_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? ''),
        ],
        CURLOPT_TIMEOUT        => 25,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $response = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code >= 200 && $code < 300 && $response) {
        return $response;
    }
    // ManyChat unavailable — return empty TwiML so Twilio doesn't error
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

/**
 * Extract the text content of the first <Message> element from a TwiML string.
 */
function extract_twiml_message(string $twiml): string {
    if (preg_match('/<Message[^>]*>(.*?)<\/Message>/si', $twiml, $m)) {
        return html_entity_decode(strip_tags($m[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
    return '';
}
