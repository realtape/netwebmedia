<?php
/**
 * Organizations handler — white-label sub-account management.
 *
 * Routing (query-string style, matches the rest of this API):
 *   GET    /api/?r=organizations
 *       List orgs the current user is a member of.
 *       Master-org owners see all sub-accounts.
 *
 *   POST   /api/?r=organizations
 *       Create a sub-account. MASTER-ORG OWNERS ONLY.
 *       Body: { slug, display_name, plan, parent_org_id?, subdomain?, sender_email?,
 *               branding_logo_url?, branding_primary_color?, branding_secondary_color? }
 *
 *   GET    /api/?r=organizations&slug=acme
 *       Fetch one org's details + branding.
 *
 *   PATCH  /api/?r=organizations&slug=acme   (or PUT)
 *       Update branding/settings. Org admin OR master-org admin.
 *
 *   POST   /api/?r=organizations&slug=acme&sub=members
 *       Invite/add a member.  Body: { user_id|email, role }
 *
 *   DELETE /api/?r=organizations&slug=acme&sub=members&user_id=42
 *       Remove a member.
 *
 *   POST   /api/?r=organizations&slug=acme&sub=suspend
 *       Suspend an org. MASTER-ORG OWNERS ONLY. Sets status='suspended'.
 *
 *   POST   /api/?r=organizations&sub=switch    Body: { organization_id }
 *       Set the active org for this session (org switcher).
 *
 * Wired in /api/index.php router as 'organizations'.
 */

require_once __DIR__ . '/../lib/tenancy.php';

$db   = getDB();
$user = guard_user();
if (!$user) jsonError('Authentication required', 401);

$slug    = isset($_GET['slug']) ? preg_replace('/[^a-z0-9\-]/', '', strtolower($_GET['slug'])) : '';
$subRoute= $_GET['sub'] ?? '';

// -----------------------------------------------------------------------------
// helpers local to this handler
// -----------------------------------------------------------------------------
$find_org = function (string $slug) use ($db): ?array {
    if ($slug === '') return null;
    $stmt = $db->prepare('SELECT * FROM organizations WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    return $stmt->fetch() ?: null;
};

$require_master_owner = function () use ($db, $user) {
    $role = org_role(ORG_MASTER_ID, (int)$user['id']);
    if ($role !== 'owner') {
        jsonError('Only NetWebMedia owners can perform this action', 403);
    }
};

/**
 * Validate a tenant-supplied CSS color. Mirrors crm-vanilla/js/branding.js
 * (safeColor) — server is the source of truth so a malicious admin can't
 * smuggle CSS payloads via a hand-crafted PATCH that bypasses the UI.
 * Accepts #rgb / #rrggbb / #rrggbbaa, rgb(), rgba(). Returns the trimmed
 * value on success or null on failure.
 */
function nwm_validate_color($v): ?string {
    if (!is_string($v)) return null;
    $v = trim($v);
    if ($v === '') return null;
    if (preg_match('/^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\))$/', $v)) {
        return $v;
    }
    return null;
}

/**
 * Validate a tenant-supplied logo URL. Mirrors crm-vanilla/js/branding.js
 * (safeLogoUrl). Allows https://, data:image/(png|jpeg|webp|gif), and
 * http://localhost for dev. Rejects javascript:, data:image/svg+xml
 * (SVG can carry script when rendered as <object>), and malformed URLs.
 */
function nwm_validate_logo_url($v): ?string {
    if (!is_string($v)) return null;
    $v = trim($v);
    if ($v === '') return null;
    // data: image — restrict to raster MIME types only.
    if (stripos($v, 'data:') === 0) {
        if (preg_match('/^data:image\/(png|jpe?g|webp|gif);/i', $v)) return $v;
        return null;
    }
    $parts = parse_url($v);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) return null;
    $scheme = strtolower($parts['scheme']);
    $host   = strtolower($parts['host']);
    if ($scheme === 'https') return $v;
    if ($scheme === 'http' && ($host === 'localhost' || $host === '127.0.0.1')) return $v;
    return null;
}

// =============================================================================
// CURRENT ACTIVE ORG  (GET /api/?r=organizations&sub=current)
// =============================================================================
// Returns the org resolved by org_from_request() (session/header/subdomain),
// plus the caller's role on it. Used by branding.js on every page load.
if ($method === 'GET' && $subRoute === 'current') {
    $active = function_exists('org_from_request') ? org_from_request() : null;
    if (!$active) {
        // Fall back to the user's primary org membership.
        $stmt = $db->prepare(
            'SELECT o.* FROM organizations o
             JOIN org_members m ON m.organization_id = o.id
             WHERE m.user_id = ? AND o.status = "active"
             ORDER BY m.is_primary DESC, m.created_at ASC
             LIMIT 1'
        );
        $stmt->execute([(int)$user['id']]);
        $active = $stmt->fetch() ?: null;
    }
    if (!$active) jsonError('No active organization for this user', 404);
    $myRole = org_role((int)$active['id'], (int)$user['id']);
    $payload = $active;
    $payload['my_role'] = $myRole;
    jsonResponse($payload);
}

// =============================================================================
// SWITCH ACTIVE ORG  (POST /api/?r=organizations&sub=switch)
// =============================================================================
if ($method === 'POST' && $subRoute === 'switch') {
    $data = getInput();
    $orgId = (int)($data['organization_id'] ?? 0);
    if ($orgId <= 0) jsonError('organization_id is required');
    set_session_org($orgId);
    jsonResponse(['ok' => true, 'organization_id' => $orgId]);
}

// =============================================================================
// LIST ORGS  (GET /api/?r=organizations)
// =============================================================================
if ($method === 'GET' && $slug === '') {
    $isMasterOwner = org_role(ORG_MASTER_ID, (int)$user['id']) === 'owner';

    if ($isMasterOwner) {
        // Master-org owners see EVERY org in the system (the whole hierarchy).
        $stmt = $db->query(
            'SELECT o.*,
                    (SELECT COUNT(*) FROM org_members m WHERE m.organization_id = o.id) AS member_count
             FROM organizations o
             ORDER BY o.plan = "master" DESC, o.created_at ASC'
        );
        jsonResponse(['organizations' => $stmt->fetchAll()]);
    }

    // Everyone else: only orgs they're a member of.
    $stmt = $db->prepare(
        'SELECT o.*, m.role AS my_role, m.is_primary
         FROM organizations o
         JOIN org_members m ON m.organization_id = o.id
         WHERE m.user_id = ?
         ORDER BY m.is_primary DESC, o.display_name ASC'
    );
    $stmt->execute([(int)$user['id']]);
    jsonResponse(['organizations' => $stmt->fetchAll()]);
}

// =============================================================================
// CREATE SUB-ACCOUNT  (POST /api/?r=organizations)
// =============================================================================
if ($method === 'POST' && $slug === '' && $subRoute === '') {
    $require_master_owner();

    $data = getInput();
    $newSlug = preg_replace('/[^a-z0-9\-]/', '', strtolower(trim($data['slug'] ?? '')));
    $name    = trim($data['display_name'] ?? '');
    $plan    = in_array($data['plan'] ?? '', ['agency', 'client'], true) ? $data['plan'] : 'client';

    if ($newSlug === '' || strlen($newSlug) < 2 || strlen($newSlug) > 64) {
        jsonError('slug must be 2-64 chars, lowercase a-z, 0-9, hyphen');
    }
    if ($name === '') jsonError('display_name is required');

    $parentOrgId = (int)($data['parent_org_id'] ?? ORG_MASTER_ID);
    // Verify parent exists and caller has rights to nest under it.
    $stmt = $db->prepare('SELECT id, plan FROM organizations WHERE id = ? LIMIT 1');
    $stmt->execute([$parentOrgId]);
    $parent = $stmt->fetch();
    if (!$parent) jsonError('parent_org_id not found', 400);
    if ($parent['plan'] === 'client') jsonError('Cannot nest under a client org', 400);

    // Optional fields
    $subdomain = isset($data['subdomain']) ? strtolower(trim($data['subdomain'])) : null;
    $custom    = isset($data['custom_domain']) ? strtolower(trim($data['custom_domain'])) : null;
    if ($subdomain === '') $subdomain = null;
    if ($custom === '')    $custom = null;

    $sender    = isset($data['sender_email']) ? trim($data['sender_email']) : null;
    if ($sender !== null && !filter_var($sender, FILTER_VALIDATE_EMAIL)) {
        jsonError('sender_email is not a valid email', 400);
    }

    $rawLogo   = $data['branding_logo_url']        ?? null;
    $rawPrim   = $data['branding_primary_color']   ?? '#010F3B';
    $rawSec    = $data['branding_secondary_color'] ?? '#FF671F';

    // Defense-in-depth: full color/URL validation, not just legacy hex check.
    $primary   = nwm_validate_color($rawPrim);
    $secondary = nwm_validate_color($rawSec);
    if ($primary === null || $secondary === null) {
        jsonError('Invalid color — accepted formats: #rgb, #rrggbb, #rrggbbaa, rgb(), rgba()', 400);
    }
    $logo = null;
    if ($rawLogo !== null && $rawLogo !== '') {
        $logo = nwm_validate_logo_url($rawLogo);
        if ($logo === null) {
            jsonError('Invalid logo URL — must be https:// or a data:image/(png|jpeg|webp|gif) URI', 400);
        }
    }

    try {
        $stmt = $db->prepare(
            'INSERT INTO organizations
              (slug, display_name, parent_org_id, plan,
               branding_logo_url, branding_primary_color, branding_secondary_color,
               subdomain, custom_domain, sender_email, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")'
        );
        $stmt->execute([
            $newSlug, $name, $parentOrgId, $plan,
            $logo, $primary, $secondary,
            $subdomain, $custom, $sender,
        ]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), '1062') !== false) {
            jsonError('slug, subdomain, or custom_domain already in use', 409);
        }
        throw $e;
    }

    $newId = (int)$db->lastInsertId();

    // Auto-add the creator as owner of the new org.
    $db->prepare(
        'INSERT INTO org_members (organization_id, user_id, role, is_primary)
         VALUES (?, ?, "owner", 0)'
    )->execute([$newId, (int)$user['id']]);

    $row = $db->prepare('SELECT * FROM organizations WHERE id = ?');
    $row->execute([$newId]);
    jsonResponse($row->fetch(), 201);
}

// -----------------------------------------------------------------------------
// All routes below require a slug.
// -----------------------------------------------------------------------------
$org = $find_org($slug);
if (!$org) jsonError('Organization not found', 404);
$orgId = (int)$org['id'];

// =============================================================================
// MEMBER MANAGEMENT  (.../slug=acme&sub=members)
// =============================================================================
if ($subRoute === 'members') {

    // List members (org admin+)
    if ($method === 'GET') {
        require_org_access($orgId, 'member');
        $stmt = $db->prepare(
            'SELECT m.id, m.role, m.is_primary, m.created_at,
                    u.id AS user_id, u.name, u.email, u.company
             FROM org_members m
             JOIN users u ON u.id = m.user_id
             WHERE m.organization_id = ?
             ORDER BY m.role = "owner" DESC, m.created_at ASC'
        );
        $stmt->execute([$orgId]);
        jsonResponse(['members' => $stmt->fetchAll()]);
    }

    // Add member by user_id or email — admin+
    if ($method === 'POST') {
        require_org_access($orgId, 'admin');
        $data = getInput();
        $role = in_array($data['role'] ?? '', ['owner','admin','member','viewer'], true)
              ? $data['role'] : 'member';

        $newUserId = null;
        if (!empty($data['user_id'])) {
            $newUserId = (int)$data['user_id'];
        } elseif (!empty($data['email'])) {
            $email = strtolower(trim($data['email']));
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            $newUserId = $stmt->fetchColumn() ?: null;
            if (!$newUserId) jsonError('No user with that email — invite flow not yet wired', 404);
        } else {
            jsonError('user_id or email required');
        }

        try {
            $db->prepare(
                'INSERT INTO org_members (organization_id, user_id, role) VALUES (?, ?, ?)'
            )->execute([$orgId, $newUserId, $role]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), '1062') !== false) {
                jsonError('User is already a member of this org', 409);
            }
            throw $e;
        }
        jsonResponse(['ok' => true, 'organization_id' => $orgId, 'user_id' => $newUserId, 'role' => $role], 201);
    }

    // Remove member — admin+
    if ($method === 'DELETE') {
        require_org_access($orgId, 'admin');
        $targetUserId = (int)($_GET['user_id'] ?? 0);
        if ($targetUserId <= 0) jsonError('user_id required');

        // Don't let an org delete its last owner.
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM org_members WHERE organization_id = ? AND role = "owner"'
        );
        $stmt->execute([$orgId]);
        $ownerCount = (int)$stmt->fetchColumn();
        $stmt = $db->prepare(
            'SELECT role FROM org_members WHERE organization_id = ? AND user_id = ? LIMIT 1'
        );
        $stmt->execute([$orgId, $targetUserId]);
        $targetRole = $stmt->fetchColumn();
        if ($targetRole === 'owner' && $ownerCount <= 1) {
            jsonError('Cannot remove the last owner. Promote someone else first.', 400);
        }

        $db->prepare(
            'DELETE FROM org_members WHERE organization_id = ? AND user_id = ?'
        )->execute([$orgId, $targetUserId]);
        jsonResponse(['ok' => true]);
    }

    jsonError('Method not allowed', 405);
}

// =============================================================================
// SUSPEND  (POST .../slug=acme&sub=suspend)  master-only
// =============================================================================
if ($subRoute === 'suspend' && $method === 'POST') {
    $require_master_owner();
    if ($orgId === ORG_MASTER_ID) jsonError('Cannot suspend the master organization', 400);
    $db->prepare('UPDATE organizations SET status = "suspended" WHERE id = ?')->execute([$orgId]);
    jsonResponse(['ok' => true, 'status' => 'suspended']);
}

if ($subRoute === 'unsuspend' && $method === 'POST') {
    $require_master_owner();
    $db->prepare('UPDATE organizations SET status = "active" WHERE id = ?')->execute([$orgId]);
    jsonResponse(['ok' => true, 'status' => 'active']);
}

// =============================================================================
// GET / PATCH single org
// =============================================================================
if ($method === 'GET') {
    // Any member can read their org's branding. Master sees all.
    if (org_role($orgId, (int)$user['id']) === null) {
        jsonError('Organization not found', 404);
    }
    jsonResponse($org);
}

if ($method === 'PATCH' || $method === 'PUT') {
    require_org_access($orgId, 'admin');

    $data    = getInput();
    $allowed = [
        'display_name', 'branding_logo_url',
        'branding_primary_color', 'branding_secondary_color',
        'subdomain', 'custom_domain', 'sender_email',
    ];
    $fields = []; $params = [];
    foreach ($allowed as $f) {
        if (!array_key_exists($f, $data)) continue;
        $val = $data[$f];

        if (in_array($f, ['branding_primary_color', 'branding_secondary_color'], true)) {
            // null/empty clears the override (falls back to defaults on the
            // client). Anything non-empty must pass the strict validator.
            if ($val !== null && $val !== '') {
                $clean = nwm_validate_color($val);
                if ($clean === null) {
                    jsonError("Invalid color for $f — use #rgb, #rrggbb, #rrggbbaa, rgb(), or rgba()", 400);
                }
                $val = $clean;
            }
        }
        if ($f === 'branding_logo_url' && $val !== null && $val !== '') {
            $clean = nwm_validate_logo_url($val);
            if ($clean === null) {
                jsonError('Invalid logo URL — must be https:// or a data:image/(png|jpeg|webp|gif) URI', 400);
            }
            $val = $clean;
        }
        if ($f === 'sender_email' && $val !== null && $val !== ''
            && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
            jsonError('sender_email is not a valid email', 400);
        }
        if ($val === '') $val = null;

        $fields[] = "$f = ?";
        $params[] = $val;
    }
    if (!$fields) jsonError('No fields to update');
    $params[] = $orgId;

    try {
        $sql = 'UPDATE organizations SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $db->prepare($sql)->execute($params);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), '1062') !== false) {
            jsonError('subdomain or custom_domain already in use', 409);
        }
        throw $e;
    }

    $stmt = $db->prepare('SELECT * FROM organizations WHERE id = ?');
    $stmt->execute([$orgId]);
    jsonResponse($stmt->fetch());
}

if ($method === 'DELETE') {
    // Hard delete is intentionally NOT supported. Suspend instead.
    jsonError('Use POST .../suspend instead — orgs are never hard-deleted', 405);
}

jsonError('Method not allowed', 405);
