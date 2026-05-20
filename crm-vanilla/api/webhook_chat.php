<?php
/**
 * Chat Widget Backend
 *
 * POST /crm-vanilla/api/webhook_chat.php
 * Body (JSON): { session_id, name?, email?, message }
 *
 * Returns JSON: { reply, conversation_id, message_id }
 *
 * Public — no auth required (CORS open for widget embeds).
 */

require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); echo json_encode(['error' => 'POST required']); exit; }

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$sessionId = trim($data['session_id'] ?? '');
$name      = trim($data['name']       ?? 'Visitor');
$email     = trim($data['email']      ?? '');
$message   = trim($data['message']    ?? '');

if (!$sessionId || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'session_id and message required']);
    exit;
}

$db = getDB();

// Find or create contact (by email if supplied, else by session)
$contactId = null;
if ($email) {
    $stmt = $db->prepare('SELECT id FROM contacts WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if ($row) {
        $contactId = (int)$row['id'];
        // Update name if we now have one
        if ($name && $name !== 'Visitor') {
            $db->prepare('UPDATE contacts SET name = ? WHERE id = ? AND name = email')
               ->execute([$name, $contactId]);
        }
    }
}
if (!$contactId) {
    $displayName = ($name && $name !== 'Visitor') ? $name : ($email ?: 'Chat Visitor');
    $db->prepare('INSERT INTO contacts (name, email, status) VALUES (?, ?, ?)')->execute([$displayName, $email ?: null, 'lead']);
    $contactId = (int)$db->lastInsertId();
}

// Find or create chat conversation for this session
$stmt = $db->prepare(
    'SELECT id FROM conversations WHERE external_id = ? AND channel = ? LIMIT 1'
);
$stmt->execute([$sessionId, 'chat']);
$conv = $stmt->fetch();

if (!$conv) {
    $db->prepare(
        'INSERT INTO conversations (contact_id, channel, external_id, subject, unread) VALUES (?, ?, ?, ?, 1)'
    )->execute([$contactId, 'chat', $sessionId, 'Chat: ' . $name]);
    $convId = (int)$db->lastInsertId();
} else {
    $convId = (int)$conv['id'];
    $db->prepare('UPDATE conversations SET unread = unread + 1, updated_at = NOW() WHERE id = ?')
       ->execute([$convId]);
}

// Store visitor message
$db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')
   ->execute([$convId, 'them', $message]);
$msgId = (int)$db->lastInsertId();

// Generate AI reply
$reply = chat_bot_reply($message, $name, $db, $convId);

// Store bot reply
$db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)')
   ->execute([$convId, 'me', $reply]);
$db->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$convId]);

echo json_encode(['reply' => $reply, 'conversation_id' => $convId, 'message_id' => $msgId]);
exit;

// ── AI bot ───────────────────────────────────────────────────────────────────

function chat_bot_reply(string $message, string $visitorName, PDO $db, int $convId): string {
    // Load last 6 messages for context
    $stmt = $db->prepare('SELECT sender, body FROM messages WHERE conversation_id = ? ORDER BY sent_at DESC LIMIT 6');
    $stmt->execute([$convId]);
    $history = array_reverse($stmt->fetchAll());

    $messages = [];
    foreach ($history as $m) {
        $messages[] = ['role' => $m['sender'] === 'me' ? 'assistant' : 'user', 'content' => $m['body']];
    }
    // Ensure last message is the current one
    if (!$messages || end($messages)['content'] !== $message) {
        $messages[] = ['role' => 'user', 'content' => $message];
    }

    if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '') {
        return fallback_reply($visitorName);
    }

    $system = "You are the AI assistant on NetWebMedia's website. NetWebMedia is a US AI marketing agency. Services: AI Automations, AI Agents, CRM, AI Websites, Paid Ads, AI SEO, Social Media. Reply in the SAME language as the visitor. Be helpful, warm, and concise (2-3 sentences max). Qualify interest when appropriate. Never invent prices — say 'book a free strategy call' instead. End every first reply with a question to learn more about their business. Sign nothing.";

    $payload = [
        'model'      => 'claude-haiku-4-5-20251001',
        'max_tokens' => 250,
        'system'     => $system,
        'messages'   => $messages,
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

    if ($code !== 200) return fallback_reply($visitorName);

    $resp = json_decode($raw, true);
    return trim($resp['content'][0]['text'] ?? fallback_reply($visitorName));
}

function fallback_reply(string $name): string {
    $greet = ($name && $name !== 'Visitor') ? "Hi $name! " : "Hi! ";
    return $greet . "Thanks for reaching out to NetWebMedia. We help US brands grow with AI marketing. What's your biggest marketing challenge right now?";
}
