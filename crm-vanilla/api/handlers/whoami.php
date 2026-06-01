<?php
/**
 * NetWebMedia OS — Shell boot endpoint  (Phase 1 Foundation)
 *
 *   GET /crm/api/?r=whoami
 *
 * The OS shell (`/os/index.html`) calls this on boot. It makes NO assumption
 * about its host — it asks the server "who am I, which org am I in, and what's
 * turned on?" and themes itself from the answer.
 *
 * Returns:
 *   {
 *     "org":  { id, slug, display_name, plan, branding:{...}, os_enabled, os_plan } | null,
 *     "user": { id, name, email, role } | null,
 *     "features": [ "crm", "agents", ... ],
 *     "is_master": bool
 *   }
 *
 * Org resolution is delegated entirely to org_from_request() (header → session
 * → subdomain → custom_domain → primary membership). A logged-out visitor on a
 * host that matches no tenant gets org:null — the shell then shows a sign-in.
 *
 * Read-only (GET) so it is exempt from the write/CSRF gate in index.php.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$u   = guard_user();            // null for guest/demo
$org = org_from_request();      // null if unresolvable

// ---- user block -----------------------------------------------------------
$userOut = null;
if ($u && !empty($u['id'])) {
    $userOut = [
        'id'    => (int)$u['id'],
        'name'  => $u['name']  ?? null,
        'email' => $u['email'] ?? null,
        'role'  => $u['role']  ?? 'member',
    ];
}

// ---- org block ------------------------------------------------------------
$orgOut   = null;
$features = [];
$isMaster = false;

if ($org) {
    $orgId    = (int)$org['id'];
    $isMaster = ($orgId === ORG_MASTER_ID);

    // The caller's role *within this org* (admin/owner/member/viewer), if any.
    // org_role() elevates master-org owners/admins to virtual admin everywhere.
    $roleInOrg = ($userOut !== null) ? org_role($orgId) : null;

    $osEnabled = array_key_exists('os_enabled', $org) ? (int)$org['os_enabled'] : ($isMaster ? 1 : 0);
    $osPlan    = $org['os_plan'] ?? 'premium';

    // Which agents are enabled for this org (NULL → shell falls back to catalog default_on).
    $enabledAgents = null;
    if (!empty($org['os_agents_enabled'])) {
        $tmp = json_decode($org['os_agents_enabled'], true);
        if (is_array($tmp)) $enabledAgents = array_values(array_filter($tmp, 'is_string'));
    }

    $orgOut = [
        'id'           => $orgId,
        'slug'         => $org['slug'] ?? null,
        'display_name' => $org['display_name'] ?? null,
        'plan'         => $org['plan'] ?? 'client',
        'role'         => $roleInOrg,
        'os_enabled'    => $osEnabled === 1,
        'os_plan'       => $osPlan,
        'enabled_agents'=> $enabledAgents,
        'branding'     => [
            'logo_url'        => $org['branding_logo_url'] ?? null,
            'primary_color'   => $org['branding_primary_color']   ?? '#010F3B',
            'secondary_color' => $org['branding_secondary_color'] ?? '#FF671F',
            'subdomain'       => $org['subdomain']     ?? null,
            'custom_domain'   => $org['custom_domain'] ?? null,
        ],
    ];

    // Feature flags the shell uses to decide which nav/widgets to render.
    // CRM is always present once an org resolves. Agent + billing surfaces
    // light up only when the OS is enabled for this tenant.
    $features[] = 'crm';
    if ($osEnabled === 1) {
        $features[] = 'agents';
        $features[] = 'workflows';
        $features[] = 'connectors';
        $features[] = 'billing';
    }
}

jsonResponse([
    'org'       => $orgOut,
    'user'      => $userOut,
    'features'  => $features,
    'is_master' => $isMaster,
], 200);
