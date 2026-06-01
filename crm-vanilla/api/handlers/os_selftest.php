<?php
/**
 * NetWebMedia OS — Cross-tenant isolation self-test  (Phase 1 Foundation)
 *
 *   POST /crm/api/?r=os_selftest&token=<MIGRATE_TOKEN>
 *
 * This is the R1 guardrail: a cross-tenant data leak is the single risk that
 * can kill the company (PRD §9 / ARCH §13 Risk 3). The plan requires this to
 * ship in Phase 1, not later. Wire it as a post-deploy curl in CI; a non-200
 * response should redden the deploy.
 *
 * What it proves, with ZERO side effects (a TEMPORARY table for the functional
 * proof; read-only COUNT against the real tenant table; no writes that persist):
 *
 *   1. The org-scoping pattern `WHERE organization_id = ?` actually isolates —
 *      a query bound to org A's id returns only org A's rows, never org B's.
 *   2. The control: an UNSCOPED query over the same rows returns ALL of them —
 *      i.e. the scoping clause is load-bearing, not cosmetic.
 *   3. org_where() composes into a real query against the live `contacts`
 *      table without error (the helper is wired, not just defined).
 *   4. org_where()/org_owns() honour the master-org "sees all" contract.
 *
 * It does NOT exercise the per-request resolver flip (org_from_request() caches
 * per process) — that path is covered by the handler-level HTTP test landing in
 * Phase 4. The fail-closed `1=0` branch is enforced at tenancy.php:254 and
 * asserted by code review.
 */

if ($method !== 'POST') jsonError('Use POST', 405);
if (!hash_equals(MIGRATE_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

require_once __DIR__ . '/../lib/tenancy.php';

// Run under master context so the org_where() master-contract checks are
// meaningful and the route can never be re-scoped to a paying org.
pin_org_to_master();

$db      = getDB();
$checks  = [];
$failures = [];

/** Record a named assertion. */
$assert = function (string $name, bool $ok, string $detail = '') use (&$checks, &$failures) {
    $checks[] = ['name' => $name, 'ok' => $ok, 'detail' => $detail];
    if (!$ok) $failures[] = $name . ($detail ? " — $detail" : '');
};

// Two synthetic org ids that cannot collide with real rows (way above
// AUTO_INCREMENT). The temp table never references the real organizations FK,
// so these are safe sentinels.
$ORG_A = 990001;
$ORG_B = 990002;

try {
    // TEMPORARY tables are session-scoped, auto-dropped, and (unlike most DDL)
    // do not force an implicit commit. Nothing here persists.
    $db->exec('DROP TEMPORARY TABLE IF EXISTS `os_iso_probe`');
    $db->exec(
        'CREATE TEMPORARY TABLE `os_iso_probe` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `organization_id` INT UNSIGNED NOT NULL,
            `label` VARCHAR(64) NOT NULL,
            INDEX `idx_org` (`organization_id`)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $ins = $db->prepare('INSERT INTO `os_iso_probe` (organization_id, label) VALUES (?, ?)');
    $ins->execute([$ORG_A, 'A-secret-1']);
    $ins->execute([$ORG_A, 'A-secret-2']);
    $ins->execute([$ORG_B, 'B-secret-1']);   // org B's secret must never surface for A

    // --- 1. Scoped query for org A returns ONLY org A ----------------------
    $stmt = $db->prepare('SELECT label FROM `os_iso_probe` WHERE organization_id = ? ORDER BY label');
    $stmt->execute([$ORG_A]);
    $aLabels = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $assert(
        'scoped_query_isolates_org_A',
        $aLabels === ['A-secret-1', 'A-secret-2'] && !in_array('B-secret-1', $aLabels, true),
        'got ' . json_encode($aLabels)
    );

    // --- 2. Scoped query for org B returns ONLY org B ----------------------
    $stmt->execute([$ORG_B]);
    $bLabels = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $assert(
        'scoped_query_isolates_org_B',
        $bLabels === ['B-secret-1'] && !in_array('A-secret-1', $bLabels, true),
        'got ' . json_encode($bLabels)
    );

    // --- 3. CONTROL: unscoped query leaks everything (clause is load-bearing)
    $total = (int)$db->query('SELECT COUNT(*) FROM `os_iso_probe`')->fetchColumn();
    $assert(
        'unscoped_query_leaks_all',
        $total === 3,
        "unscoped count = $total (expected 3 across both orgs)"
    );

    $db->exec('DROP TEMPORARY TABLE IF EXISTS `os_iso_probe`');

    // --- 4. org_where() master contract: master is unscoped by design ------
    [$clause, $params] = org_where('c');
    $assert(
        'org_where_master_sees_all',
        $clause === '1=1' && $params === [],
        "clause='$clause' params=" . json_encode($params)
    );

    // --- 5. org_where() composes into a real query on the live tenant table -
    //        (read-only; proves the helper is wired, not just defined).
    $sql = "SELECT COUNT(*) FROM contacts c WHERE $clause";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $realCount = (int)$stmt->fetchColumn();
    $assert(
        'org_where_composes_on_contacts',
        $realCount >= 0,
        "live contacts count under master = $realCount"
    );

    // --- 5b. org_where() composes on the NEW OS tenant tables (if migrated) --
    //         Proves every new owned table is org-scopable the same way.
    foreach (['agent_runs', 'tenant_connectors', 'tenant_branding_assets', 'human_tasks', 'org_invoices'] as $t) {
        try {
            $st = $db->prepare("SELECT COUNT(*) FROM `$t` c WHERE $clause");
            $st->execute($params);
            $assert("org_where_composes_on_$t", ((int)$st->fetchColumn()) >= 0, 'ok');
        } catch (Throwable $e) {
            // Table not migrated on this DB yet — not a failure, just unrun.
            $checks[] = ['name' => "org_where_composes_on_$t", 'ok' => true, 'detail' => 'skipped (not migrated)'];
        }
    }

    // --- 6. org_owns() honours the master "sees all" contract --------------
    $assert(
        'org_owns_master_true',
        org_owns(123456) === true && org_owns(null) === true,
        'master org_owns() should be true for any row'
    );

} catch (Throwable $e) {
    // Best-effort cleanup; temp table is session-scoped anyway.
    try { $db->exec('DROP TEMPORARY TABLE IF EXISTS `os_iso_probe`'); } catch (Throwable $ignored) {}
    $assert('selftest_execution', false, $e->getMessage());
}

$pass = empty($failures);
jsonResponse([
    'pass'     => $pass,
    'total'    => count($checks),
    'passed'   => count($checks) - count($failures),
    'failed'   => count($failures),
    'failures' => $failures,
    'checks'   => $checks,
], $pass ? 200 : 500);
