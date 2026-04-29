<?php
/**
 * Tenancy helpers — scope CRUD queries to the authenticated user.
 *
 * Rows with user_id IS NULL are treated as legacy/shared and visible to everyone.
 * Rows with a user_id only match the authenticated user (or any user for superadmin).
 *
 * After all data is backfilled, the IS NULL clause should be removed.
 */

require_once __DIR__ . '/guard.php';

function tenant_id(): ?int {
    $u = guard_user();
    return ($u && !empty($u['id'])) ? (int)$u['id'] : null;
}

function tenant_is_superadmin(): bool {
    $u = guard_user();
    return $u && ($u['role'] ?? '') === 'superadmin';
}

/**
 * Append a "(user_id = ? OR user_id IS NULL)" clause to existing WHERE conditions.
 * Returns [whereSqlFragment, paramsToAppend]. Empty array if no scope needed (superadmin or guest).
 */
function tenant_where(string $tableAlias = ''): array {
    if (tenant_is_superadmin()) return ['', []];
    $uid = tenant_id();
    if ($uid === null) return ['', []]; // guest/demo — passthrough (read-only by router gate)
    $col = $tableAlias ? ($tableAlias . '.user_id') : 'user_id';
    return ["($col = ? OR $col IS NULL)", [$uid]];
}

/**
 * Verify that a row's user_id matches the current tenant (or is NULL legacy data).
 * Returns false if not allowed; handlers should jsonError(404) to avoid leaking existence.
 */
function tenant_owns(?int $rowUserId): bool {
    if (tenant_is_superadmin()) return true;
    if ($rowUserId === null) return true; // legacy/shared
    $uid = tenant_id();
    return $uid !== null && $rowUserId === $uid;
}
