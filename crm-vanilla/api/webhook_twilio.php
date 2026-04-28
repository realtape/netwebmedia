<?php
/**
 * Twilio Inbound Webhook — SMS & WhatsApp
 *
 * Register this URL in Twilio console:
 *   SMS:       https://netwebmedia.com/crm-vanilla/api/webhook_twilio.php
 *   WhatsApp:  same URL (Twilio sends To as "whatsapp:+1...")
 *
 * Twilio POSTs: From, To, Body, MessageSid, NumMedia, etc.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/twilio_client.php';

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

// Store inbound message
$db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')
   ->execute([$convId, 'them', $body]);

// AI bot auto-reply
$botReply = ai_bot_reply($body, $contactName, $channel);

if ($botReply) {
    // Save outbound message
    $db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')
       ->execute([$convId, 'me', $botReply]);
    $db->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$convId]);
}

twiml_reply($botReply ?: '');

// ── Helpers ─────────────────────────────────────────────────────────────────

function twiml_reply(string $msg): never {
    header('Content-Type: text/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response>';
    if ($msg !== '') {
        echo '<Message>' . htmlspecialchars($msg, ENT_XML1) . '</Message>';
    }
    echo '</Response>';
    exit;
}

function ai_bot_reply(string $message, string $name, string $channel): string {
    if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '') {
        return "Hi $name! Thanks for reaching out to NetWebMedia. A team member will reply shortly. Questions? Visit netwebmedia.com";
    }

    $system = "You are NetWebMedia's AI assistant handling inbound $channel messages. NetWebMedia is a US AI marketing agency offering: ai-automations, ai-agents, crm, ai-websites, paid-ads, ai-seo, social media. Reply in the SAME language as the incoming message. Be warm, concise (max 2 sentences), and end with a clear next step. Sign as 'NetWebMedia Team'.";

    $payload = [
        'model'      => 'claude-haiku-4-5-20251001',
        'max_tokens' => 200,
        'system'     => $system,
        'messages'   => [['role' => 'user', 'content' => $message]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'x-api-key: '          . ANTHROPIC_API_KEY,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        return "Hi $name! Thanks for reaching out to NetWebMedia. A team member will be in touch shortly.";
    }

    $resp = json_decode($raw, true);
    return trim($resp['content'][0]['text'] ?? '');
}
