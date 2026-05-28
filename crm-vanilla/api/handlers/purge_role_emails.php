<?php
/**
 * Purge role-based email contacts (contact@, contacto@, admin@, hello@, team@).
 *
 * One-off cleanup of unfollowableable role-aliased leads. Local-parts are
 * HARD-CODED here so a token leak cannot expand the blast radius.
 *
 * Token-protected. Idempotent (re-running just deletes anything new that
 * matches). Pinned to master org so a paying org's contacts cannot be purged
 * via X-Org-Slug spoof.
 *
 * GET  ?r=purge_role_emails&token=NWM_FILTER_ID_2026&action=count
 *      → { total_contacts, would_delete, breakdown: { contact: N, contacto: N, ... } }
 *
 * POST ?r=purge_role_emails&token=NWM_FILTER_ID_2026&action=purge&confirm=1
 *      → { contacts_deleted, total_after, breakdown }
 */

require_once __DIR__ . '/../lib/tenancy.php';

$TOKEN = defined('FILTER_ID_TOKEN') ? FILTER_ID_TOKEN : 'NWM_FILTER_ID_2026';
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
pin_org_to_master();

$ROLE_PREFIXES = ['contact', 'contacto', 'admin', 'hello', 'team', 'info', 'office'];

$action = (string)($_GET['action'] ?? 'count');
$db     = getDB();
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); }
$andOw = $ow ? ' AND ' . $ow : '';
$whrOw = $ow ? ' WHERE ' . $ow : '';

$ph     = implode(',', array_fill(0, count($ROLE_PREFIXES), '?'));
$where  = "LOWER(SUBSTRING_INDEX(email,'@',1)) IN ($ph) AND email LIKE '%@%'" . $andOw;
$params = array_merge($ROLE_PREFIXES, $owp);

$run = function (string $sql, array $p = []) use ($db) {
    $st = $db->prepare($sql); $st->execute($p); return $st;
};

$breakdown = [];
$rows = $run("
    SELECT LOWER(SUBSTRING_INDEX(email,'@',1)) AS lp, COUNT(*) AS c
    FROM contacts
    WHERE $where
    GROUP BY lp
", $params)->fetchAll(PDO::FETCH_ASSOC);
foreach ($ROLE_PREFIXES as $p) $breakdown[$p] = 0;
foreach ($rows as $r) $breakdown[$r['lp']] = (int)$r['c'];
$wouldDelete = array_sum($breakdown);

if ($action === 'count' && $method === 'GET') {
    $total = (int)$run("SELECT COUNT(*) FROM contacts" . $whrOw, $owp)->fetchColumn();
    jsonResponse([
        'total_contacts' => $total,
        'would_delete'   => $wouldDelete,
        'breakdown'      => $breakdown,
        'prefixes'       => $ROLE_PREFIXES,
    ]);
}

if ($action === 'purge' && $method === 'POST') {
    if ((string)($_GET['confirm'] ?? '') !== '1') {
        jsonError('Add &confirm=1 to authorize destructive purge', 400);
    }

    $stmt = $db->prepare("DELETE FROM contacts WHERE $where");
    $stmt->execute($params);
    $deleted = $stmt->rowCount();

    $after = (int)$run("SELECT COUNT(*) FROM contacts" . $whrOw, $owp)->fetchColumn();
    jsonResponse([
        'contacts_deleted' => $deleted,
        'total_after'      => $after,
        'breakdown'        => $breakdown,
        'prefixes'         => $ROLE_PREFIXES,
    ]);
}

// Legacy 'Chat Visitor' shells: rows the old webhook_chat.php created when a
// visitor opened the chat widget without supplying an email. Pre-2026-05-28
// upstream fix. Unlink conversations first so ON DELETE CASCADE doesn't wipe
// chat history.
$cvWhere  = "name = 'Chat Visitor' AND (email IS NULL OR email = '')" . $andOw;

if ($action === 'chat_visitor_count' && $method === 'GET') {
    $count = (int)$run("SELECT COUNT(*) FROM contacts WHERE $cvWhere", $owp)->fetchColumn();
    $linkedConvs = (int)$run("
        SELECT COUNT(*) FROM conversations
        WHERE contact_id IN (SELECT id FROM contacts WHERE $cvWhere)
    ", $owp)->fetchColumn();
    jsonResponse([
        'chat_visitor_contacts' => $count,
        'linked_conversations'  => $link