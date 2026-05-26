<?php
/**
 * Twilio Inbound Webhook — SMS & WhatsApp
 *
 * Twilio webhook URL: https://netwebmedia.com/crm-vanilla/api/webhook_twilio.php
 * Replaces ManyChat. Handles all inbound SMS and WhatsApp:
 *   1. Saves message to CRM conversations table
 *   2. Sends Claude AI auto-reply via TwiML
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/twilio_client.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

if (!twilio_validate_signature()) {
    http_response_code(403);
    exit('Forbidden');
}

try {

$from   = trim($_POST['From'] ?? '');
$to     = trim($_POST['To']   ?? '');
$body   = trim($_POST['Body'] ?? '');

if (!$from || !$body) {
    twiml_reply('');
}

$channel = (stripos($to, 'whatsapp:') === 0 || stripos($from, 'whatsapp:') === 0)
    ? 'whatsapp' : 'sms';

$phone = preg_replace('/^whatsapp:/i', '', $from);

$db = getDB();

// Find or create contact by phone
$stmt = $db->prepare('SELECT id, name FROM contacts WHERE phone = ? LIMIT 1');
$stmt->execute([$phone]);
$contact = $stmt->fetch();

if (!$contact) {
    $db->prepare('INSERT INTO contacts (name, phone, status) VALUES (?, ?, ?)')->execute([$phone, $phone, 'lead']);
    $contactId   = (int)$db->lastInsertId();
    $contactName = $phone;
} else {
    $contactId   = (int)$contact['id'];
    $contactName = $contact['name'];
}

// Find or create conversation
$stmt = $db->prepare('SELECT id FROM conversations WHERE contact_id = ? AND channel = ? ORDER BY updated_at DESC LIMIT 1');
$stmt->execute([$contactId, $channel]);
$conv = $stmt->fetch();

if (!$conv) {
    $db->prepare('INSERT INTO conversations (contact_id, channel, phone, unread) VALUES (?, ?, ?, 1)')->execute([$contactId, $channel, $phone]);
    $convId = (int)$db->lastInsertId();
} else {
    $convId = (int)$conv['id'];
    $db->prepare('UPDATE conversations SET unread = unread + 1, updated_at = NOW() WHERE id = ?')->execute([$convId]);
}

// Save inbound message
$db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')->execute([$convId, 'them', $body]);

// Claude AI auto-reply
$reply = ai_reply($body, $contactName, $channel, $db, $convId);

// Save outbound reply
$db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')->execute([$convId, 'me', $reply]);
$db->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$convId]);

twiml_reply($reply);

} catch (Throwable $e) {
    // Return error as TwiML comment so Twilio doesn't retry, and log for debugging
    error_log('webhook_twilio.php error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    header('Content-Type: text/xml');
    http_response_code(200); // 200 so Twilio won't retry
    echo '<?xml version="1.0" encoding="UTF-8"?><Response><!-- ERROR: ' . htmlspecialchars($e->getMessage(), ENT_XML1) . ' --></Response>';
    exit;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function twiml_reply(string $msg): void {
    header('Content-Type: text/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?><Response>';
    if ($msg !== '') echo '<Message>' . htmlspecialchars($msg, ENT_XML1) . '</Message>';
    echo '</Response>';
    exit;
}

function ai_reply(string $message, string $name, string $channel, PDO $db, int $convId): string {
    // Load last 10 messages for context
    $stmt = $db->prepare('SELECT sender, body FROM messages WHERE conversation_id = ? ORDER BY sent_at DESC LIMIT 10');
    $stmt->execute([$convId]);
    $history = array_reverse($stmt->fetchAll());

    if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '') {
        return "Hi $name! Thanks for reaching out to NetWebMedia. A strategist will reply shortly. Questions? netwebmedia.com";
    }

    $messages = [];
    foreach ($history as $m) {
        $messages[] = ['role' => $m['sender'] === 'me' ? 'assistant' : 'user', 'content' => $m['body']];
    }
    if (!$messages || end($messages)['content'] !== $message) {
        $messages[] = ['role' => 'user', 'content' => $message];
    }

    $system = "You are the AI sales assistant for NetWebMedia, a US AI marketing agency. Services: AI Automations, AI Agents, CRM, AI Websites, Paid Ads, AI SEO, Social Media. You are responding via $channel. Reply in the SAME language as the message. Be warm, helpful, and concise (2-3 sentences for $channel). Qualify interest and guide toward booking a free strategy call at netwebmedia.com/contact.html. Never make up prices. Sign as 'NetWebMedia AI'.";

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode([
            'model'      => 'claude-haiku-4-5-20251001',
            'max_tokens' => 250,
            'system'     => $system,
            'messages'   => $messages,
        ]),
        CURLOPT_HTTPHEADER => [
            'x-api-key: ' . ANTHROPIC_API_KEY,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        return "Hi $name! Thanks for reaching out to NetWebMedia. We'll be in touch shortly.";
    }
    $resp = json_decode($raw, true);
    return trim($resp['content'][0]['text'] ?? "Hi $name! Thanks for reaching out. Visit netwebmedia.com for more info.");
}
