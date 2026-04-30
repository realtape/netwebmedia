<?php
/**
 * AI Inbox Triage — POST /api/?r=ai_triage
 *
 * Body: { "conversation_id": <int> }
 *
 * Pulls the last 5 messages of the given conversation (tenant-scoped via
 * tenancy_where), sends them to Claude Haiku, and returns:
 *   { intent, urgency, draft_reply, suggested_action }
 *
 * Side effects:
 *   - Writes the result back to conversations.triage_json + triage_at.
 *   - Counts against an org-scoped daily rate limit (100 / org / day).
 *
 * Failure modes are non-fatal: any Claude / network / JSON error returns the
 * fallback shape with HTTP 200 so the UI can still render something useful.
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/rate_limit.php';

if ($method !== 'POST') jsonError('Use POST', 405);

$db = getDB();
$input = getInput();
$convId = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
if ($convId <= 0) jsonError('conversation_id required', 400);

// --- Tenancy: load + own the conversation -----------------------------------
[$tWhere, $tParams] = tenancy_where('conv');
$sql = 'SELECT conv.id, conv.channel, conv.subject, conv.contact_id,
               c.name AS contact_name
        FROM conversations conv
        LEFT JOIN contacts c ON conv.contact_id = c.id
        WHERE conv.id = ?';
$params = [$convId];
if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
$stmt = $db->prepare($sql);
$stmt->execute($params);
$conv = $stmt->fetch();
if (!$conv) jsonError('Conversation not found', 404);

// --- Rate limit: 100 triages / org / day ------------------------------------
// Bucket key includes the resolved org so one tenant can't spend another's
// quota. Falls back to user_id, then IP, when org schema isn't applied.
$bucket = 'org' . (current_org_id() ?? ('u' . (tenant_id() ?? 0)));
rate_limit('ai_triage_' . preg_replace('/[^a-z0-9]/i', '', $bucket), 100, 86400);

// --- Pull last 5 messages ---------------------------------------------------
$stmt = $db->prepare(
    'SELECT sender, body, sent_at FROM messages
     WHERE conversation_id = ?
     ORDER BY sent_at DESC, id DESC
     LIMIT 5'
);
$stmt->execute([$convId]);
$recent = array_reverse($stmt->fetchAll() ?: []);

// --- Build prompt -----------------------------------------------------------
$threadText = '';
foreach ($recent as $m) {
    $who = ($m['sender'] === 'me') ? 'Agent' : 'Customer';
    // Trim each message to keep prompt size bounded.
    $body = mb_substr((string)$m['body'], 0, 1000);
    $threadText .= $who . ': ' . $body . "\n";
}
if ($threadText === '') $threadText = '(empty thread)';

$systemPrompt =
    "You are a CRM triage assistant for NetWebMedia. Classify the conversation and produce a draft reply.\n" .
    "Output ONLY valid JSON: {intent, urgency, draft_reply, suggested_action}.\n" .
    "intent: one of [pricing, booking, support, complaint, feedback, spam, other]\n" .
    "urgency: one of [low, normal, urgent]\n" .
    "draft_reply: 1-2 sentences, professional tone, same language as thread.\n" .
    "suggested_action: one of [reply_now, schedule_followup, route_to_human, mark_spam]";

$contactLabel = $conv['contact_name'] ?: 'Unknown contact';
$channelLabel = $conv['channel'] ?: 'email';
$userPrompt =
    "Channel: {$channelLabel}\n" .
    "Contact: {$contactLabel}\n" .
    "Subject: " . ($conv['subject'] ?: '(none)') . "\n\n" .
    "Thread (last 5 messages, oldest first):\n" .
    $threadText .
    "\nReturn ONLY the JSON object.";

// --- Fallback shape (used on any error) -------------------------------------
$fallback = [
    'intent' => 'other',
    'urgency' => 'normal',
    'draft_reply' => '',
    'suggested_action' => 'reply_now',
    'fallback' => true,
];

$result = $fallback;

if (defined('ANTHROPIC_API_KEY') && ANTHROPIC_API_KEY !== '') {
    $payload = [
        'model' => 'claude-haiku-4-5',
        'max_tokens' => 300,
        'temperature' => 0.2,
        'system' => $systemPrompt,
        'messages' => [['role' => 'user', 'content' => $userPrompt]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'x-api-key: ' . ANTHROPIC_API_KEY,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
        CURLOPT_TIMEOUT => 20,
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if (!$curlErr && $code === 200) {
        $j = json_decode($raw, true) ?: [];
        $text = '';
        foreach (($j['content'] ?? []) as $blk) {
            if (($blk['type'] ?? '') === 'text') $text .= $blk['text'];
        }
        // Strip markdown fences if any
        $text = preg_replace('/^```(?:json)?|```$/mi', '', trim($text));
        $parsed = json_decode($text, true);
        if (is_array($parsed)) {
            $result = ai_triage_normalize($parsed);
        } else {
            error_log('ai_triage: unparseable Claude output: ' . substr($text, 0, 200));
        }
    } else {
        error_log('ai_triage: Claude HTTP ' . $code . ' err=' . $curlErr . ' raw=' . substr((string)$raw, 0, 200));
    }
}

// --- Persist on the conversation row ----------------------------------------
try {
    $upd = $db->prepare(
        'UPDATE conversations SET triage_json = ?, triage_at = NOW() WHERE id = ?'
    );
    $upd->execute([json_encode($result, JSON_UNESCAPED_UNICODE), $convId]);
} catch (Throwable $e) {
    // Column may not exist if schema_orgid_triage.sql hasn't run yet — don't
    // fail the request on a missing column. The UI still gets the triage data.
    error_log('ai_triage: persist failed (likely missing column): ' . $e->getMessage());
}

jsonResponse($result);


/**
 * Coerce arbitrary Claude output into a strict shape with allow-listed enums.
 * Anything outside the allow-list collapses to a safe default — this is the
 * last line of defence before the value gets rendered in the CRM UI.
 */
function ai_triage_normalize(array $p): array {
    static $intents = ['pricing','booking','support','complaint','feedback','spam','other'];
    static $urgencies = ['low','normal','urgent'];
    static $actions = ['reply_now','schedule_followup','route_to_human','mark_spam'];

    $intent = strtolower(trim((string)($p['intent'] ?? 'other')));
    if (!in_array($intent, $intents, true)) $intent = 'other';

    $urgency = strtolower(trim((string)($p['urgency'] ?? 'normal')));
    if (!in_array($urgency, $urgencies, true)) $urgency = 'normal';

    $action = strtolower(trim((string)($p['suggested_action'] ?? 'reply_now')));
    if (!in_array($action, $actions, true)) $action = 'reply_now';

    $reply = (string)($p['draft_reply'] ?? '');
    // Cap at ~600 chars — 1-2 sentences should be well under this.
    if (mb_strlen($reply) > 600) $reply = mb_substr($reply, 0, 600);

    return [
        'intent' => $intent,
        'urgency' => $urgency,
        'draft_reply' => $reply,
        'suggested_action' => $action,
    ];
}
