<?php
/**
 * NetWebMedia OS — Per-tenant branding CSS  (Phase 2)
 *
 *   GET /crm/api/?r=os_branding[&org=<slug>]
 *
 * Emits text/css that sets the brand custom properties for a tenant. The OS
 * shell can load it as a <link> for a no-flash themed boot. Brand colors are
 * non-sensitive, so this resolves by ?org slug (active orgs only) or the
 * current session org. Falls back to NWM Gulf-Oil defaults.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db = getDB();

// ---------------------------------------------- POST: persist brand settings --
// The onboarding wizard + settings page POST {display_name, primary_color,
// secondary_color} here. Admin-only; same-origin write gate already enforced
// by index.php.
if ($method === 'POST') {
    $u = guard_user();
    if (!$u || empty($u['id'])) jsonError('Authentication required', 401);
    $orgId = current_org_id();
    if ($orgId === null) jsonError('No organization resolved', 400);
    require_org_access_for_write('admin');

    $in = getInput();
    $fields = []; $params = [];
    if (isset($in['display_name'])) {
        $dn = trim((string)$in['display_name']);
        if ($dn !== '' && mb_strlen($dn) <= 255) { $fields[] = 'display_name = ?'; $params[] = $dn; }
    }
    foreach (['primary_color' => 'branding_primary_color', 'secondary_color' => 'branding_secondary_color'] as $k => $col) {
        if (isset($in[$k]) && preg_match('/^#[0-9a-fA-F]{6}$/', (string)$in[$k])) {
            $fields[] = "$col = ?"; $params[] = $in[$k];
        }
    }
    if ($fields) {
        $params[] = $orgId;
        $db->prepare('UPDATE organizations SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    try {
        $db->prepare('INSERT INTO os_audit_log (organization_id, user_id, action, ip)
                      VALUES (?, ?, "branding.update", ?)')
           ->execute([$orgId, (int)$u['id'], $_SERVER['REMOTE_ADDR'] ?? null]);
    } catch (Throwable $e) {}
    jsonResponse(['ok' => true, 'updated' => count($fields)]);
}

$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($_GET['org'] ?? '')));

$org = null;
if ($slug !== '') {
    $stmt = $db->prepare('SELECT branding_primary_color, branding_secondary_color, branding_logo_url, display_name
                            FROM organizations WHERE slug = ? AND status = "active" LIMIT 1');
    $stmt->execute([$slug]);
    $org = $stmt->fetch() ?: null;
}
if ($org === null) {
    $cur = org_from_request();
    if ($cur) $org = $cur;
}

$primary   = $org['branding_primary_color']   ?? '#010F3B';
$secondary = $org['branding_secondary_color'] ?? '#FF671F';
$logo      = $org['branding_logo_url'] ?? '';

// sanitize colors to #rrggbb
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $primary))   $primary   = '#010F3B';
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $secondary)) $secondary = '#FF671F';

header('Content-Type: text/css; charset=utf-8');
header('Cache-Control: public, max-age=300');
echo ":root{\n  --nwm-primary: $primary;\n  --nwm-secondary: $secondary;\n";
if ($logo !== '' && preg_match('#^/|^https://#', $logo)) {
    // Only allow same-origin or https logo URLs in the CSS var.
    $safe = str_replace(['"', "\n", "\r", ')'], '', $logo);
    echo "  --nwm-logo: url('" . $safe . "');\n";
}
echo "}\n";
exit;
