<?php
/**
 * =============================================================================
 * NetWebMedia CRM — Tenancy helpers
 * =============================================================================
 *
 * TWO LAYERS LIVE HERE — DO NOT CONFUSE THEM:
 *
 *   (A) USER-scoped helpers   [legacy, pre-org]
 *       tenant_id() / tenant_where() / tenant_owns() / tenant_is_superadmin()
 *       Filter rows by users.id via the user_id column added in schema_tenancy.sql.
 *       Still required by every existing handler. Do NOT delete until every
 *       handler has been migrated to the org-scoped API below.
 *
 *   (B) ORG-scoped helpers    [new, white-label foundation]
 *       org_from_request() / current_org_id() / require_org_access() / is_master_org()
 *       org_where() / org_owns()
 *       Filter rows by organizations.id via the organization_id column added in
 *       schema_organizations_migrate.sql. This is what new handlers MUST use.
 *
 * ---------------------------------------------------------------------------
 *  HARD RULE FOR FUTURE DEVS — READ THIS BEFORE WRITING SQL
 * ---------------------------------------------------------------------------
 *  Every SELECT / UPDATE / DELETE that touches a tenant table MUST go through
 *  org_where() (or its FK-joined equivalent). Hard-coding `WHERE organization_id = 1`
 *  is a bug. Forgetting the clause entirely is a CRITICAL CROSS-TENANT LEAK.
 *
 *  If you find yourself writing: $db->query("SELECT * FROM contacts");
 *  STOP. That query just dumped every tenant's data. Wrap it.
 * ---------------------------------------------------------------------------
 */

require_once __DIR__ . '/guard.php';

// =============================================================================
// (A) USER-scoped helpers (legacy — keep working until full org migration)
// =============================================================================

function tenant_id(): ?int {
    $u = guard_user();
    return ($u && !empty($u['id'])) ? (int)$u['id'] : null;
}

function tenant_is_superadmin(): bool {
    $u = guard_user();
    return $u && ($u['role'] ?? '') === 'superadmin';
}

function tenant_where(string $tableAlias = ''): array {
    if (tenant_is_superadmin()) return ['', []];
    $uid = tenant_id();
    if ($uid === null) return ['', []];
    $col = $tableAlias ? ($tableAlias . '.user_id') : 'user_id';
    return ["($col = ? OR $col IS NULL)", [$uid]];
}

function tenant_owns(?int $rowUserId): bool {
    if (tenant_is_superadmin()) return true;
    if ($rowUserId === null) return true;
    $uid = tenant_id();
    return $uid !== null && $rowUserId === $uid;
}

// =============================================================================
// (B) ORG-scoped helpers (white-label tenancy)
// =============================================================================

const ORG_MASTER_ID = 1;

/**
 * Resolve the active organization for this request.
 *
 * Resolution order (first match wins):
 *   1. Explicit X-Org-Slug header             — UI / API client picker
 *   2. Session-stored nwm_org_id              — last-selected org for this user
 *   3. Subdomain match against orgs.subdomain — e.g. acme.netwebmedia.com
 *   4. Custom domain match                    — full host match
 *   5. User's primary org_member row          — fallback default
 *
 * Returns the org row (assoc array) or null if unresolvable.
 *
 * NOTE: This DOES NOT enforce access — call require_org_access() for that.
 * It only resolves which org the user *intends* to operate in.
 */
function org_from_request(): ?array {
    static $cached = null;
    if ($cached !== null) return $cached;

    $db = getDB();
    $u  = guard_user();

    // 1. Explicit header
    $hdrSlug = $_SERVER['HTTP_X_ORG_SLUG'] ?? '';
    if ($hdrSlug !== '') {
        $hdrSlug = preg_replace('/[^a-z0-9\-]/', '', strtolower($hdrSlug));
        if ($hdrSlug !== '') {
            $stmt = $db->prepare('SELECT * FROM organizations WHERE slug = ? AND status = "active" LIMIT 1');
            $stmt->execute([$hdrSlug]);
            if ($row = $stmt->fetch()) return $cached = $row;
        }
    }

    // 2. Session
    if (session_status() === PHP_SESSION_NONE) _guard_session_start();
    if (!empty($_SESSION['nwm_org_id'])) {
        $stmt = $db->prepare('SELECT * FROM organizations WHERE id = ? AND status = "active" LIMIT 1');
        $stmt->execute([(int)$_SESSION['nwm_org_id']]);
        if ($row = $stmt->fetch()) return $cached = $row;
    }

    // 3 & 4. Host-based resolution
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    if ($host) {
        // Strip port if present
        if (($pos = strpos($host, ':')) !== false) $host = substr($host, 0, $pos);

        // Subdomain match (e.g. acme.netwebmedia.com -> orgs.subdomain = 'acme.netwebmedia.com')
        $stmt = $db->prepare('SELECT * FROM organizations WHERE subdomain = ? AND status = "active" LIMIT 1');
        $stmt->execute([$host]);
        if ($row = $stmt->fetch()) return $cached = $row;

        // Custom domain match
        $stmt = $db->prepare('SELECT * FROM organizations WHERE custom_domain = ? AND status = "active" LIMIT 1');
        $stmt->execute([$host]);
        if ($row = $stmt->fetch()) return $cached = $row;
    }

    // 5. User's primary org membership
    if ($u && !empty($u['id'])) {
        $stmt = $db->prepare(
            'SELECT o.* FROM organizations o
             JOIN org_members m ON m.organization_id = o.id
             WHERE m.user_id = ? AND o.status = "active"
             ORDER BY m.is_primary DESC, m.created_at ASC
             LIMIT 1'
        );
        $stmt->execute([(int)$u['id']]);
        if ($row = $stmt->fetch()) return $cached = $row;
    }

    return $cached = null;
}

/** Convenience accessor — int or null. */
function current_org_id(): ?int {
    $org = org_from_request();
    return $org ? (int)$org['id'] : null;
}

/** True if the resolved org is the master (NetWebMedia) org. */
function is_master_org(): bool {
    return current_org_id() === ORG_MASTER_ID;
}

/**
 * Get the current user's role in a given org. Returns null if not a member.
 * Master-org owners/admins are treated as having admin rights everywhere.
 */
function org_role(int $organizationId, ?int $userId = null): ?string {
    $u = guard_user();
    $userId = $userId ?? ($u['id'] ?? null);
    if (!$userId) return null;

    $db = getDB();

    // Master-org owner/admin elevation: cross-tenant support access.
    $stmt = $db->prepare(
        'SELECT role FROM org_members WHERE organization_id = ? AND user_id = ? LIMIT 1'
    );
    $stmt->execute([ORG_MASTER_ID, (int)$userId]);
    $masterRole = $stmt->fetchColumn();
    if (in_array($masterRole, ['owner', 'admin'], true)) {
        return 'admin'; // virtual admin in any org
    }

    if ($organizationId === ORG_MASTER_ID) {
        return $masterRole ?: null;
    }

    $stmt = $db->prepare(
        'SELECT role FROM org_members WHERE organization_id = ? AND user_id = ? LIMIT 1'
    );
    $stmt->execute([$organizationId, (int)$userId]);
    return $stmt->fetchColumn() ?: null;
}

/**
 * Throws 403 unless the current user has at least the required role on the org.
 * Role hierarchy: owner > admin > member > viewer.
 */
function require_org_access(int $organizationId, string $requiredRole = 'member'): string {
    static $rank = ['viewer' => 1, 'member' => 2, 'admin' => 3, 'owner' => 4];
    $have = org_role($organizationId);
    if ($have === null || ($rank[$have] ?? 0) < ($rank[$requiredRole] ?? 0)) {
        jsonError('Forbidden — insufficient role on this organization', 403);
    }
    return $have;
}

/**
 * SECURITY (write-side): assert the current user is a member of the org they
 * are about to write to. Designed to be called immediately before any INSERT
 * in a tenant-scoped handler.
 *
 * Resolution semantics:
 *   - If org schema is not yet applied → no-op (legacy per-user filter takes over).
 *   - If no org could be resolved      → no-op (demo/guest path; INSERT without organization_id).
 *   - If a logged-in user is operating in an org they don't belong to → 403.
 *   - Master-org owners/admins are virtual admins everywhere (org_role()).
 *
 * This is the fix for audit finding H2: org_from_request() honours X-Org-Slug,
 * which means an authenticated user can flip into another org and write into
 * its bucket. require_org_access_for_write() blocks that.
 */
function require_org_access_for_write(string $requiredRole = 'member'): void {
    if (!is_org_schema_applied()) return;
    $orgId = current_org_id();
    if ($orgId === null) return; // demo / unauthenticated guest — legacy path
    $u = guard_user();
    // No authenticated user but org resolved (e.g. via host or X-Org-Slug).
    // INSERTs without auth fall through to the demo write path; no escalation
    // possible because writes carry user_id = NULL anyway. Skip the check.
    if (!$u || empty($u['id'])) return;
    require_org_access($orgId, $requiredRole);
}

/**
 * Build a WHERE-clause fragment to scope a query to the current org.
 *
 *   [$sql, $params] = org_where('c');         // for SELECT ... FROM contacts c
 *   $stmt = $db->prepare("SELECT * FROM contacts c WHERE $sql");
 *   $stmt->execute($params);
 *
 * Returns ['1=0', []] if no org could be resolved — fail closed, never leak.
 * Master org sees everything (no clause), to support agency-wide reporting.
 */
function org_where(string $tableAlias = ''): array {
    $orgId = current_org_id();
    if ($orgId === null) return ['1=0', []]; // fail closed

    if ($orgId === ORG_MASTER_ID) {
        // Master org sees all rows by default. If you want master to be scoped
        // for a particular endpoint (e.g. "show me only NWM's own pipeline"),
        // pass an explicit X-Org-Slug header.
        return ['1=1', []];
    }

    $col = $tableAlias ? ($tableAlias . '.organization_id') : 'organization_id';
    return ["$col = ?", [$orgId]];
}

/** Check whether a row's organization_id matches the current org. */
function org_owns(?int $rowOrgId): bool {
    $orgId = current_org_id();
    if ($orgId === null)         return false;
    if ($orgId === ORG_MASTER_ID) return true; // NWM sees all
    return $rowOrgId !== null && $rowOrgId === $orgId;
}

/**
 * Set the active org for this session (called by the org switcher in the UI).
 * Verifies membership first.
 */
function set_session_org(int $organizationId): void {
    if (org_role($organizationId) === null) {
        jsonError('You are not a member of that organization', 403);
    }
    if (session_status() === PHP_SESSION_NONE) _guard_session_start();
    $_SESSION['nwm_org_id'] = $organizationId;
}

// =============================================================================
// (C) Migration-window glue — used by handlers that have been swapped to
//     org_where() but must still work on a database where
//     schema_organizations_migrate.sql has not yet been applied.
// =============================================================================

/**
 * True once `contacts.organization_id` exists. Cached per PHP-FPM worker.
 * We use `contacts` as the canary — every handler that filters by org also
 * touches contacts directly or transitively, and the migrate script adds the
 * column to contacts in the very first ALTER. If contacts has it, all 18
 * tenant tables will too.
 *
 * Failing closed (false) is the safe default: handlers fall back to the
 * legacy tenant_where() filter, which is the pre-migration behaviour.
 */
function is_org_schema_applied(): bool {
    static $cached = null;
    if ($cached !== null) return $cached;
    try {
        $db = getDB();
        $stmt = $db->query("SHOW COLUMNS FROM contacts LIKE 'organization_id'");
        $cached = (bool)$stmt->fetch();
    } catch (Throwable $e) {
        $cached = false;
    }
    return $cached;
}

/**
 * Migration-aware WHERE-clause builder.
 *
 *   [$sql, $params] = tenancy_where('c');     // for FROM contacts c
 *
 *   - When organization_id exists and a current org is resolved → org_where()
 *   - Otherwise → tenant_where() (legacy per-user filter)
 *
 * Same return shape as both underlying helpers, so handlers can swap a single
 * call without touching the surrounding SQL composition. Keep the alias arg
 * in sync with the table reference (e.g. tenancy_where('c') for `FROM x c`).
 */
function tenancy_where(string $tableAlias = ''): array {
    if (is_org_schema_applied()) {
        return org_where($tableAlias);
    }
    return tenant_where($tableAlias);
}

/**
 * Returns ['organization_id, ', current_org_id()] when the schema is applied,
 * or ['', null] otherwise. Designed to splice into INSERT column / value lists:
 *
 *   [$orgCol, $orgVal] = tenancy_insert_org();
 *   $sql = "INSERT INTO contacts (user_id, {$orgCol}name) VALUES (?, " . ($orgCol ? "?, " : "") . "?)";
 *   $params = $orgCol ? [$uid, $orgVal, $name] : [$uid, $name];
 *
 * That is verbose. Most handlers in this codebase use named SQL strings, so
 * the simpler pattern is:
 *
 *   $orgId = is_org_schema_applied() ? current_org_id() : null;
 *   if ($orgId !== null) {
 *       INSERT INTO ... (user_id, organization_id, ...)  // include org column
 *   } else {
 *       INSERT INTO ... (user_id, ...)                  // legacy form
 *   }
 *
 * We expose the helper for handlers that prefer the splice form.
 */
function tenancy_insert_org(): array {
    if (is_org_schema_applied()) {
        $oid = current_org_id();
        if ($oid !== null) return ['organization_id, ', $oid];
    }
    return ['', null];
}
