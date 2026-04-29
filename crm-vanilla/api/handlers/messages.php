<?php
require_once __DIR__ . '/../lib/tenancy.php';
$db = getDB();
$orgId = is_org_schema_applied() ? current_org_id() : null;

// Ownership check helper — returns true iff the current tenant can touch this conversation.
// Uses tenancy_where() so post-migration the check is org-scoped, pre-migration it
// remains the legacy per-user check.
$canAccessConv = function(int $convId) use ($db): bool {
    [$where, $params] = tenancy_where();
    $sql = 'SELECT id FROM conversations WHERE id = ?';
    $p   = [$convId];
    if ($where) { $sql .= ' AND ' . $where; $p = array_merge($p, $params); }
    $st = $db->prepare($sql);
    $st->execute($p);
    return (bool)$st->fetch();
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

        // SECURITY (H1/H3): derive organization_id from the conversation row
        // itself, not from current_org_id() / X-Org-Slug. A message belongs to
        // a conversation belongs to an org; the request's org context is just
        // a hint and must not become the source of truth on the write.
        // Then assert the requester has access to that org for writes.
        $convOrgId = null;
        if (is_org_schema_applied()) {
            $cstmt = $db->prepare('SELECT organization_id FROM conversations WHERE id = ?');
            $cstmt->execute([$convId]);
            $cOrg = $cstmt->fetchColumn();
            if ($cOrg !== false && $cOrg !== null) {
                $convOrgId = (int)$cOrg;
                // Verify the writer is a member of the conv's org. Master-org
                // owners/admins are virtual admins everywhere via org_role().
                $u = guard_user();
                if ($u && !empty($u['id'])) {
                    require_org_access($convOrgId, 'member');
                }
            }
        }

        if ($convOrgId !== null) {
            $stmt = $db->prepare('INSERT INTO messages (organization_id, conversation_id, sender, body) VALUES (?, ?, ?, ?)');
            $stmt->execute([$convOrgId, $convId, $sender, $body]);
        } else {
            $stmt = $db->prepare('INSERT INTO messages (conversation_id, sender, body) VALUES (?, ?, ?)');
            $stmt->execute([$convId, $sender, $body]);
        }
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
