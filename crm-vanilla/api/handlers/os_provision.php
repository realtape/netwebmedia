<?php
/**
 * NetWebMedia OS — Tenant provisioning endpoint  (Phase 1 Foundation)
 *
 * Master-org-only. Token-gated (MIGRATE_TOKEN) so it can be driven by curl /
 * a sales-director script, exactly like the migrate endpoint. Creates (or
 * idempotently updates) an `organizations` row for a new agency tenant.
 *
 *   POST /crm/api/?r=os_provision&token=<MIGRATE_TOKEN>
 *   body: {
 *     "slug": "tester-acme",                 // required, [a-z0-9-]
 *     "display_name": "Acme Digital",        // required
 *     "plan": "agency",                      // optional: agency|client (default agency)
 *     "os_plan": "premium",                  // optional: partner|starter|premium|custom
 *     "billing_status": "partner_comp",      // optional (design partner = partner_comp)
 *     "os_enabled": 1,                        // optional 0|1 (default 0 — dark until billing)
 *     "subdomain": "acme.netwebmedia.com",   // optional (default <slug>.netwebmedia.com)
 *     "primary_color": "#012169",            // optional
 *     "secondary_color": "#4A90D9",          // optional
 *     "sender_email": "hello@acme.com",      // optional
 *     "primary_user_email": "olivia@acme.com" // optional — linked as org owner if the user exists
 *   }
 *
 * Returns the resulting org. Idempotent on `slug` (re-running updates in place).
 *
 * SECURITY: pin_org_to_master() is called immediately after the token check so
 * this platform-level op can NEVER be re-scoped to a paying org via X-Org-Slug.
 */

if ($method !== 'POST') jsonError('Use POST', 405);
if (!hash_equals(MIGRATE_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

require_once __DIR__ . '/../lib/tenancy.php';
pin_org_to_master();

$in = getInput();

// ---- validate -------------------------------------------------------------
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(trim((string)($in['slug'] ?? ''))));
$slug = trim($slug, '-');
if ($slug === '')                 jsonError('slug is required ([a-z0-9-])', 422);
if (strlen($slug) > 64)           jsonError('slug too long (max 64)', 422);

$displayName = trim((string)($in['display_name'] ?? ''));
if ($displayName === '')          jsonError('display_name is required', 422);
if (mb_strlen($displayName) > 255) jsonError('display_name too long (max 255)', 422);

$ALLOWED_PLAN     = ['agency', 'client'];                 // never provision a second 'master'
$ALLOWED_OS_PLAN  = ['partner', 'starter', 'premium', 'custom'];
$ALLOWED_BILLING  = ['trialing', 'active', 'past_due', 'canceled', 'partner_comp'];

$plan = in_array(($in['plan'] ?? 'agency'), $ALLOWED_PLAN, true) ? $in['plan'] : 'agency';
$osPlan = in_array(($in['os_plan'] ?? 'premium'), $ALLOWED_OS_PLAN, true) ? $in['os_plan'] : 'premium';
$billing = in_array(($in['billing_status'] ?? 'trialing'), $ALLOWED_BILLING, true) ? $in['billing_status'] : 'trialing';
$osEnabled = !empty($in['os_enabled']) ? 1 : 0;

$subdomain = trim((string)($in['subdomain'] ?? ''));
if ($subdomain === '') $subdomain = $slug . '.netwebmedia.com';
$subdomain = strtolower($subdomain);
if (!preg_match('/^[a-z0-9.\-]{1,128}$/', $subdomain)) jsonError('invalid subdomain', 422);

$primaryColor   = (string)($in['primary_color']   ?? '#010F3B');
$secondaryColor = (string)($in['secondary_color'] ?? '#FF671F');
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $primaryColor))   $primaryColor   = '#010F3B';
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $secondaryColor)) $secondaryColor = '#FF671F';

$senderEmail = trim((string)($in['sender_email'] ?? ''));
if ($senderEmail !== '' && !filter_var($senderEmail, FILTER_VALIDATE_EMAIL)) $senderEmail = '';

$db = getDB();

// Guard: never let a provision call clobber the master org (id=1).
$stmt = $db->prepare('SELECT id, plan FROM organizations WHERE slug = ? LIMIT 1');
$stmt->execute([$slug]);
$existing = $stmt->fetch();
if ($existing && (int)$existing['id'] === ORG_MASTER_ID) {
    jsonError('Refusing to overwrite the master organization', 409);
}

// ---- upsert the core org row (columns that always exist) ------------------
$stmt = $db->prepare(
    'INSERT INTO organizations
        (slug, display_name, parent_org_id, plan,
         branding_primary_color, branding_secondary_color,
         subdomain, sender_email, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")
     ON DUPLICATE KEY UPDATE
        display_name             = VALUES(display_name),
        branding_primary_color   = VALUES(branding_primary_color),
        branding_secondary_color = VALUES(branding_secondary_color),
        sender_email             = VALUES(sender_email)'
);
try {
    $stmt->execute([
        $slug, $displayName, ORG_MASTER_ID, $plan,
        $primaryColor, $secondaryColor,
        $subdomain, ($senderEmail ?: null),
    ]);
} catch (PDOException $e) {
    // 1062 on uk_subdomain = the subdomain belongs to a different org.
    if (($e->errorInfo[1] ?? 0) == 1062) {
        jsonError('subdomain already in use by another organization', 409);
    }
    throw $e;
}

// Resolve the org id (works for both fresh INSERT and ON DUPLICATE no-op).
$orgId = (int)$db->lastInsertId();
if ($orgId === 0) {
    $stmt = $db->prepare('SELECT id FROM organizations WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    $orgId = (int)$stmt->fetchColumn();
}
if ($orgId === 0) jsonError('Provision failed — could not resolve org id', 500);

// ---- apply OS / billing columns (schema_os_orgs_extend.sql) ----------------
// Wrapped so provision still succeeds on a DB where the OS migration has not
// run yet (fresh-clone ordering safety). Skipped silently if columns missing.
$osApplied = false;
try {
    $stmt = $db->prepare(
        'UPDATE organizations
            SET os_plan = ?, billing_status = ?, os_enabled = ?
          WHERE id = ?'
    );
    $stmt->execute([$osPlan, $billing, $osEnabled, $orgId]);
    $osApplied = true;
} catch (PDOException $e) {
    // 1054 = unknown column → OS migration not applied yet. Non-fatal.
    if (($e->errorInfo[1] ?? 0) != 1054) throw $e;
}

// ---- optionally link a primary owner --------------------------------------
$primaryUserLinked = false;
$invitePending = false;
$primaryEmail = trim((string)($in['primary_user_email'] ?? ''));
if ($primaryEmail !== '' && filter_var($primaryEmail, FILTER_VALIDATE_EMAIL)) {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$primaryEmail]);
    $uid = $stmt->fetchColumn();
    if ($uid) {
        $db->prepare(
            'INSERT INTO org_members (organization_id, user_id, role, is_primary)
             VALUES (?, ?, "owner", 1)
             ON DUPLICATE KEY UPDATE role = "owner", is_primary = 1'
        )->execute([$orgId, (int)$uid]);
        $primaryUserLinked = true;
    } else {
        // User doesn't exist yet — V1 flow sends an invite/magic-link out of band.
        $invitePending = true;
    }
}

// ---- return the resulting org ---------------------------------------------
$cols = 'id, slug, display_name, parent_org_id, plan, subdomain, custom_domain, '
      . 'branding_primary_color, branding_secondary_color, sender_email, status';
if ($osApplied) $cols .= ', os_enabled, os_plan, billing_status';
$stmt = $db->prepare("SELECT $cols FROM organizations WHERE id = ? LIMIT 1");
$stmt->execute([$orgId]);
$org = $stmt->fetch() ?: [];

jsonResponse([
    'ok'                  => true,
    'created'             => !$existing,
    'os_schema_applied'   => $osApplied,
    'primary_user_linked' => $primaryUserLinked,
    'invite_pending'      => $invitePending,
    'org'                 => $org,
], 200);
