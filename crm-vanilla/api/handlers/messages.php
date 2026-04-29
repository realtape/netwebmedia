<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();

// Ownership check helper — returns true iff the current tenant can touch this conversation.
$canAccessConv = function(int $convId) use ($db): bool {
    $st = $db->prepare('SELECT user_id FROM conversations WHERE id = ?');
    $st->execute([$convId]);
    $r = $st->fetch();
    if (!$r) return false;
    return tenant_owns($r['user_id'] !== null ? (int)$r['user_id'] : null);
};

switch ($method) {
    case 'GET':
        $convId = $_GET['conversation_id'] ?? null;
        if (!$convId) jsonError('conversation_id required');
        $convId = (int)$convId;
        if (!$canAccessConv($convId)) jsonError('Conversation not found', 404);
        $stmt = $db->prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC');
        $stmt->execute([$convId]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['conversation_id']) || empty($data['body'])) {
            jsonError('conversation_id and body required');
        }
        $convId = (int)$data['conversation_id'];
        if (!$canAccessConv($convId)) jsonError('Conversation not found', 404);
        $sender = $data['sender'] ?? 'me';
        $body   = $data['body'];

        $stmt = $db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)');
        $stmt->execute([$convId, $sender, $body]);
        $msgId = (int)$db->lastInsertId();

        $db->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$convId]);

        // Deliver outbound message via Twilio when replying to SMS/WhatsApp
        $twilioSid = null;
        if ($sender === 'me') {
            $convRow = $db->prepare('SELECT channel, phone FROM conversations WHERE id = ?');
            $convRow->execute([$convId]);
            $conv = $convRow->fetch();
            if ($conv && in_array($conv['channel'], ['sms', 'whatsapp'], true) && !empty($conv['phone'])) {
                require_once __DIR__ . '/../lib/twilio_client.php';
                $twilioSid = twilio_send($conv['phone'], $body, $conv['channel']);
            }
        }

        jsonResponse([
            'id'              => $msgId,
            'conversation_id' => $convId,
            'sender'          => $sender,
            'body'            => $body,
            'sent_at'         => date('Y-m-d H:i:s'),
            'twilio_sid'      => $twilioSid,
        ], 201);
        break;

    default:
        jsonError('Method not allowed', 405);
}
