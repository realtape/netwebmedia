<?php
/**
 * NetWebMedia OS — Per-tenant agent activation  (Phase 4)
 *
 *   GET  /crm/api/?r=os_agents                          -> {enabled:[slug,...]}
 *   POST /crm/api/?r=os_agents {action:"toggle",slug,on} -> updates os_agents_enabled
 *
 * Admin-only writes. Stores the enabled set as a JSON array on
 * organizations.os_agents_enabled. NULL means "use the default-on roster".
 */

require_once __DIR__ . '/../lib/tenancy.php';
require_once __DIR__ . '/../lib/agent_dispatcher.php';

$db = getDB();
$u  = guard_user();
if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
$orgId = current_org_id();
if ($orgId === null) jsonError('No organization resolved', 400);
require_org_access($orgId, 'member');

$stmt = $db->prepare('SELECT os_agents_enabled FROM organizations WHERE id = ? LIMIT 1');
$stmt->execute([$orgId]);
$cur = $stmt->fetchColumn();
$enabled = (function ($json) {
    if ($json) { $a = json_decode($json, true); if (is_array($a) && $a) return array_values(array_filter($a, 'is_string')); }
    return os_default_on_agents();
})($cur);

if ($method === 'GET') {
    jsonResponse(['enabled' => $enabled]);
}

if ($method !== 'POST') jsonError('Use GET or POST', 405);
require_org_access_for_write('admin');

$in   = getInput();
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($in['slug'] ?? '')));
$on   = !empty($in['on']);
$catalog = os_agent_catalog();
if (($in['action'] ?? '') !== 'toggle') jsonError('Unknown action', 400);
if (!isset($catalog[$slug]))            jsonError('Unknown agent', 404);

$set = array_values(array_unique(array_filter($enabled, fn($s) => isset($catalog[$s]))));
if ($on && !in_array($slug, $set, true))      $set[] = $slug;
if (!$on)                                      $set = array_values(array_filter($set, fn($s) => $s !== $slug));

$db->prepare('UPDATE organizations SET os_agents_enabled = ? WHERE id = ?')
   ->execute([json_encode(array_values($set)), $orgId]);

try {
    $db->prepare('INSERT INTO os_audit_log (organization_id, user_id, action, target, meta_json, ip)
                  VALUES (?, ?, "agents.toggle", ?, ?, ?)')
       ->execute([$orgId, (int)$u['id'], $slug, json_encode(['on' => $on]), $_SERVER['REMOTE_ADDR'] ?? null]);
} catch (Throwable $e) { /* audit table optional */ }

jsonResponse(['ok' => true, 'enabled' => array_values($set)]);
