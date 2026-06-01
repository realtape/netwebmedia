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
