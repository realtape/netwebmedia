<?php
/**
 * Domain audit + bulk purge by domain list.
 *
 * Workflow: caller pulls distinct email domains, validates them via async DNS
 * (locally — much faster than PHP's sequential checkdnsrr), then POSTs back the
 * list of confirmed-dead domains for deletion.
 *
 * Token-protected. Idempotent.
 *
 * GET  ?r=domain_audit&token=NWM_FILTER_ID_2026&action=count
 *      → { total_contacts, distinct_domains }
 *
 * GET  ?r=domain_audit&token=NWM_FILTER_ID_2026&action=list&limit=10000&offset=0
 *      → { domains: ["a.com","b.com",…], offset, limit, has_more }
 *
 * POST ?r=domain_audit&token=NWM_FILTER_ID_2026&action=purge
 *      body: { "domains": ["dead1.com","dead2.com",…] }
 *      → { domains_received, contacts_deleted, total_after }
 */

require_once __DIR__ . '/../lib/tenancy.php';
$TOKEN = defined('FILTER_ID_TOKEN') ? FILTER_ID_TOKEN : 'NWM_FILTER_ID_2026';
if (!hash_equals($TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
// SECURITY (C2): pin to master so a token leak cannot be combined with
// X-Org-Slug to purge a specific paying org's domains.
pin_org_to_master();

$action = (string)($_GET['action'] ?? '');
$db     = getDB();
$ow = ''; $owp = [];
if (is_org_schema_applied()) { [$ow, $owp] = org_where(); }
$andOw = $ow ? ' AND ' . $ow : '';
$whrOw = $ow ? ' WHERE ' . $ow : '';
$run = function (string $sql, array $params = []) use ($db) {
    $st = $db->prepare($sql); $st->execute($params); return $st;
};

if ($action === 'count' && $method === 'GET') {
    $total    = (int)$run("SELECT COUNT(*) FROM contacts" . $whrOw, $owp)->fetchColumn();
    $distinct = (int)$run("
        SELECT COUNT(DISTINCT LOWER(SUBSTRING_INDEX(email,'@',-1)))
        FROM contacts WHERE email LIKE '%@%'" . $andOw . "
    ", $owp)->fetchColumn();
    jsonResponse([
        'total_contacts'   => $total,
        'distinct_domains' => $distinct,
    ]);
}

if ($action === 'list' && $method === 'GET') {
    $limit  = max(100, min(50000, (int)($_GET['limit']  ?? 10000)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $stmt   = $db->prepare("
        SELECT DISTINCT LOWER(SUBSTRING_INDEX(email,'@',-1)) AS d
        FROM contacts
        WHERE email LIKE '%@%'" . $andOw . "
        ORDER BY d
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($owp);
    $domains = $stmt->fetchAll(PDO::FETCH_COLUMN);
    jsonResponse([
        'offset'   => $offset,
        'limit'    => $limit,
        'returned' => count($domains),
        'has_more' => count($domains) === $limit,
        'domains'  => $domains,
    ]);
}

if ($action === 'purge' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $list = $body['domains'] ?? [];
    if (!is_array($list) || !$list) jsonError('Body must be {"domains":[...]}', 400);

    // Sanitize
    $clean = [];
    foreach ($list as $d) {
        $d = strtolower(trim((string)$d));
        if ($d !== '' && preg_match('/^[a-z0-9.\-]+$/', $d)) $clean[] = $d;
    }
    if (!$clean) jsonError('No valid domains in payload', 400);

    $deleted = 0;
    foreach (array_chunk($clean, 500) as $chunk) {
        $ph   = implode(',', array_fill(0, count($chunk), '?'));
        $sql  = "DELETE FROM contacts WHERE LOWER(SUBSTRING_INDEX(email,'@',-1)) IN ($ph)" . $andOw;
        $stmt = $db->prepare($sql);
        $stmt->execute(array_merge($chunk, $owp));
        $deleted += $stmt->rowCount();
    }

    $after = (int)$run("SELECT COUNT(*) FROM contacts" . $whrOw, $owp)->fetchColumn();
    jsonResponse([
        'domains_received'  => count($clean),
        'contacts_deleted'  => $deleted,
        'total_after'       => $after,
    ]);
}

jsonError('Unknown action. Use action=count|list|purge', 400);
