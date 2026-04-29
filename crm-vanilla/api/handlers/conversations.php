<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
[$tWhere, $tParams] = tenancy_where('conv');
$uid = tenant_id();
$orgId = is_org_schema_applied() ? current_org_id() : null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Get conversation with messages — tenant-scoped
            $sql = 'SELECT conv.*, c.name as contact_name, c.avatar
                    FROM conversations conv LEFT JOIN contacts c ON conv.contact_id = c.id
                    WHERE conv.id = ?';
            $params = [$id];
            if ($tWhere) { $sql .= ' AND ' . $tWhere; $params = array_merge($params, $tParams); }
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
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
        if ($tWhere) { $where[] = $tWhere; $params = array_merge($params, $tParams); }
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
        // SECURITY (H2): block X-Org-Slug-based cross-org INSERT.
        require_org_access_for_write('member');
        $data = getInput();
        if ($orgId !== null) {
            $stmt = $db->prepare('INSERT INTO conversations (user_id, organization_id, contact_id, channel, subject, unread) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $uid,
                $orgId,
                $data['contact_id'] ?? null,
                $data['channel'] ?? 'email',
                $data['subject'] ?? null,
                $data['unread'] ?? 0,
            ]);
        } else {
            $stmt = $db->prepare('INSERT INTO conversations (user_id, contact_id, channel, subject, unread) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $uid,
                $data['contact_id'] ?? null,
                $data['channel'] ?? 'email',
                $data['subject'] ?? null,
                $data['unread'] ?? 0,
            ]);
        }
        jsonResponse(['id' => (int)$db->lastInsertId()], 201);
        break;

    default:
        jsonError('Method not allowed', 405);
}
