<?php
$db = getDB();

switch ($method) {
    case 'GET':
        $convId = $_GET['conversation_id'] ?? null;
        if (!$convId) jsonError('conversation_id required');
        $stmt = $db->prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC');
        $stmt->execute([(int)$convId]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['conversation_id']) || empty($data['body'])) {
            jsonError('conversation_id and body required');
        }
        $stmt = $db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)');
        $stmt->execute([
            (int)$data['conversation_id'],
            $data['sender'] ?? 'me',
            $data['body'],
        ]);
        // Update conversation timestamp
        $db->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([(int)$data['conversation_id']]);

        jsonResponse([
            'id' => (int)$db->lastInsertId(),
            'conversation_id' => (int)$data['conversation_id'],
            'sender' => $data['sender'] ?? 'me',
            'body' => $data['body'],
            'sent_at' => date('Y-m-d H:i:s'),
        ], 201);
        break;

    default:
        jsonError('Method not allowed', 405);
}
