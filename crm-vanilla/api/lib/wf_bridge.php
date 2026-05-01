<?php
/**
 * Legacy shim — forwards wf_fire() calls to the CRM-native engine (wf_crm.php).
 *
 * The old bridge tried to cross-include api-php/lib/workflows.php (webmed6_nwm)
 * from the CRM context (webmed6_crm). This failed because the two codebases run
 * on different databases. All trigger calls now go through wf_crm_trigger() which
 * operates entirely within webmed6_crm.
 *
 * This shim exists for backward-compat with any handler that still calls wf_fire().
 * Migrate each call site to wf_crm_trigger() and delete this file when done.
 */

require_once __DIR__ . '/wf_crm.php';

if (!function_exists('wf_fire')) {
    function wf_fire(string $type, array $match = [], array $ctx = [], int $org_id = 1): array {
        $count = wf_crm_trigger($type, $match, $ctx, null, $org_id ?: null);
        return ['ok' => true, 'count' => $count, 'fired' => []];
    }
}
