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

        // ─── PR 5: Operator phone discriminator ──────────────────────────
        // Inbound messages whose conversation phone matches OPERATOR_WHATSAPP_NUMBER
        // are approval/rejection commands from Carlos, not customer messages.
        // Parse them, act on the referenced draft, then skip the auto-reply pipeline.
        $isOperatorMessage = false;
        {
            $opPhone = defined('OPERATOR_WHATSAPP_NUMBER')
                ? OPERATOR_WHATSAPP_NUMBER
                : (getenv('OPERATOR_WHATSAPP_NUMBER') ?: '');
            if ($sender === 'them' && $opPhone) {
                try {
                    $opRow = $db->prepare('SELECT phone FROM conversations WHERE id = ? LIMIT 1');
                    $opRow->execute([$convId]);
                    $convPhone = (string)($opRow->fetchColumn() ?: '');
                    $convNorm  = preg_replace('/[^\d]/', '', $convPhone);
                    $opNorm    = preg_replace('/[^\d]/', '', $opPhone);
                    if ($convNorm !== '' && $convNorm === $opNorm) {
                        $isOperatorMessage = true;
                        // Commands: "Y 42" / "yes 42" / "approve 42"  →  approve
                        //           "N 42" / "no 42"  / "reject 42"   →  reject
                        if (preg_match('/^(y|yes|approve|send)\s+#?(\d+)/i', trim($body), $m)) {
                            $refId = (int)$m[2];
                            $upd = $db->prepare(
                                "UPDATE conversation_drafts
                                    SET status='approved', approved_at=NOW(),
                                        approval_channel='whatsapp', updated_at=NOW()
                                  WHERE id = ? AND status = 'pending_approval'"
                            );
                            $upd->execute([$refId]);
                            if ($upd->rowCount() > 0) {
                                // Won the first-write-wins race — send immediately.
                                require_once __DIR__ . '/../lib/wf_crm.php';
                                wf_crm_send_approved_draft($db, $refId);
                            }
                        } elseif (preg_match('/^(n|no|reject|skip)\s+#?(\d+)/i', trim($body), $m)) {
                            $refId = (int)$m[2];
                            $db->prepare(
                                "UPDATE conversation_drafts
                                    SET status='rejected', updated_at=NOW()
                                  WHERE id = ? AND status = 'pending_approval'"
                            )->execute([$refId]);
                        }
                    }
                } catch (\Throwable $_) { /* never block message storage on operator parse error */ }
            }
        }

        // ─── Auto-reply trigger (PR 3) ───────────────────────────────
        // Fire `conversation_inbound` workflows ONLY on inbound customer messages.
        // Operator approval commands (above) are excluded via $isOperatorMessage.
        // Wrapped in try/catch: inbound persistence already succeeded above.
        // A trigger failure must NEVER surface as an HTTP 500 — silent fallthrough.
        if ($sender === 'them' && !$isOperatorMessage) {
            try {
                require_once __DIR__ . '/../lib/wf_crm.php';

                // Hydrate the conversation row to enrich the trigger context.
                // Single SELECT in webmed6_crm — no cross-DB call. Tolerate failure.
                $convChannel = null; $convContactId = null; $convUserId = null;
                try {
                    $cstmt = $db->prepare('SELECT channel, contact_id, user_id FROM conversations WHERE id = ?');
                    $cstmt->execute([$convId]);
                    $crow = $cstmt->fetch();
                    if ($crow) {
                        $convChannel   = $crow['channel'] ?? null;
                        $convContactId = isset($crow['contact_id']) ? (int)$crow['contact_id'] : null;
                        $convUserId    = isset($crow['user_id'])    ? (int)$crow['user_id']    : null;
                    }
                } catch (\Throwable $_) { /* user_id column may be missing pre-migrate; ok */ }

                wf_crm_trigger('conversation_inbound', [
                    'channel' => $convChannel,
                ], [
                    'conversation_id' => $convId,
                    'message_id'      => $msgId,
                    'channel'         => $convChannel,
                    'contact_id'      => $convContactId,
                    'inbound_body'    => $body,
                ], $convUserId, $convOrgId);
            } catch (\Throwable $e) {
                error_log('conversation_inbound trigger failed: ' . $e->getMessage()
                    . ' (conv=' . $convId . ', msg=' . $msgId . ')');
                // Persistence already succeeded — silent fallthrough.
            }
        }

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
