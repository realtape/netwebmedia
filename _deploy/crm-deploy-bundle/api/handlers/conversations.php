<?php
$db = getDB();

switch ($method) {
    case 'GET':
        if ($id) {
            // Get conversation with messages
            $stmt = $db->prepare('SELECT conv.*, c.name as contact_name, c.avatar FROM conversations conv LEFT JOIN contacts c ON conv.contact_id = c.id WHERE conv.id = ?');
            $stmt->execute([$id]);
            $conv = $stmt->fetch();
            if (!$conv) jsonError('Conversation not found', 404);

            $stmt = $db->prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC');
            $stmt->execute([$id]);
            $conv['messages'] = $stmt->fetchAll();

            // Mark as read
            $db->prepare('UPDATE conversations SET unread = 0 WHERE id = ?')->execute([$id]);

            jsonResponse($conv);
        }
        $where = [];
        $params = [];
        if (!empty($_GET['channel'])) {
            $where[] = 'conv.channel = ?';
            $params[] = $_GET['channel'];
        }
        $sql = 'SELECT conv.*, c.name as contact_name, c.avatar, (SELECT body FROM messages WHERE conversation_id = conv.id ORDER BY sent_at DESC LIMIT 1) as preview FROM conversations conv LEFT JOIN contacts c ON conv.contact_id = c.id';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY conv.updated_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        $stmt = $db->prepare('INSERT INTO conversations (contact_id, channel, subject, unread) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['contact_id'] ?? null,
            $data['channel'] ?? 'email',
            $data['subject'] ?? null,
            $data['unread'] ?? 0,
        ]);
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    default:
        jsonError('Method not allowed', 405);
}
