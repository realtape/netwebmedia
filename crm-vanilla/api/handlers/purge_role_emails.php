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
 * GET  ?r=purge_role_emails&token=<FILTER_ID_TOKEN>&action=count
 *      → { total_contacts, would_delete, breakdown: { contact: N, contacto: N, ... } }
 *
 * POST ?r=purge_role_emails&token=<FILTER_ID_TOKEN>&action=purge&confirm=1
 *      → { contacts_deleted, total_after, breakdown }
 *
 * Optional &prefixes=sales,info  — restricts the operation to a subset of the
 * allowlist. Any value not in $ALLOWED_PREFIXES is silently dropped, so a
 * token leak still cannot expand blast radius beyond the hardcoded list.
 * Omit &prefixes= to keep the historic behaviour of "all known role prefixes".
 */

require_once __DIR__ . '/../lib/tenancy.php';

$TOKEN = defined('FILTER_ID_TOKEN') ? FILTER_ID_TOKEN : bin2hex(random_bytes(16));
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
pin_org_to_master();

// Hardcoded allowlist. Token leak cannot expand this set.
// 2026-05-28 expansion: added ventas/hola/reservations/reservas/secretaria/frontdesk/support
// after top_prefixes(min=50) surfaced them as bloat. All 7 are role-aliases — no
// individual person uses an address that 50+ unrelated businesses also use.
$ALLOWED_PREFIXES = [
    'contact', 'contacto', 'admin', 'hello', 'team', 'info', 'office', 'sales',
    'ventas', 'hola', 'reservations', 'reservas', 'secretaria', 'frontdesk', 'support',
];

// Optional ?prefixes=sales,info — restrict to a subset of the allowlist.
// Default (no param) = all of $ALLOWED_PREFIXES (preserves prior behavior).
if (!empty($_GET['prefixes'])) {
    $requested = array_filter(array_map('trim', explode(',', (string)$_GET['prefixes'])));
    $ROLE_PREFIXES = array_values(array_intersect($requested, $ALLOWED_PREFIXES));
    if (empty($ROLE_PREFIXES)) jsonError('No valid prefixes after intersection with allowlist', 400);
} else {
    $ROLE_PREFIXES = $ALLOWED_PREFIXES;
}

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
        'linked_conversations'  => $linkedConvs,
        'note'                  => 'Purge will NULL conversations.contact_id first, then DELETE contacts. Chat history preserved.',
    ]);
}

if ($action === 'chat_visitor_purge' && $method === 'POST') {
    if ((string)($_GET['confirm'] ?? '') !== '1') {
        jsonError('Add &confirm=1 to authorize destructive purge', 400);
    }
    // 1. Unlink conversations so cascade-delete doesn't take chat history
    $unlinkStmt = $db->prepare("
        UPDATE conversations
        SET contact_id = NULL
        WHERE contact_id IN (SELECT id FROM contacts WHERE $cvWhere)
    ");
    $unlinkStmt->execute($owp);
    $unlinked = $unlinkStmt->rowCount();

    // 2. Delete the shell contacts
    $delStmt = $db->prepare("DELETE FROM contacts WHERE $cvWhere");
    $delStmt->execute($owp);
    $deleted = $delStmt->rowCount();

    $after = (int)$run("SELECT COUNT(*) FROM contacts" . $whrOw, $owp)->fetchColumn();
    jsonResponse([
        'conversations_unlinked' => $unlinked,
        'contacts_deleted'       => $deleted,
        'total_after'            => $after,
    ]);
}

if ($action === 'top_prefixes' && $method === 'GET') {
    $min = max(2, (int)($_GET['min'] ?? 1000));
    $stmt = $db->prepare("
        SELECT LOWER(SUBSTRING_INDEX(email,'@',1)) AS lp, COUNT(*) AS c
        FROM contacts
        WHERE email LIKE '%@%'" . $andOw . "
        GROUP BY lp
        HAVING c >= ?
        ORDER BY c DESC
        LIMIT 200
    ");
    $stmt->execute(array_merge($owp, [$min]));
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse([
        'min_count' => $min,
        'returned'  => count($rows),
        'prefixes'  => array_map(fn($r) => ['local_part' => $r['lp'], 'count' => (int)$r['c']], $rows),
    ]);
}

jsonError('Unknown action. Use action=count|top_prefixes|chat_visitor_count (GET) or action=purge|chat_visitor_purge&confirm=1 (POST)', 400);
