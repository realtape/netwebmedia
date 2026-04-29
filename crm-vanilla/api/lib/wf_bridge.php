<?php
/**
 * Workflow trigger bridge — lets crm-vanilla/api/handlers fire workflows that
 * live in the canonical api-php codebase (resources(type=workflow)).
 *
 * Both codebases run on the same InMotion PHP-FPM and share webmed6_crm DB,
 * so we just include the canonical workflow lib and call wf_trigger().
 *
 * Fail-open: any include or call error is swallowed — the CRM API never
 * blocks user actions because of a workflow failure.
 *
 * Usage:
 *   wf_fire('deal_stage', ['stage' => 'Qualified'], $ctx);
 *   wf_fire('tag_added',  ['tag'   => 'mql'],      $ctx);
 */

if (!function_exists('wf_fire')) {

  function wf_fire(string $type, array $match = [], array $ctx = [], int $org_id = 1): array {
    static $loaded = null;
    static $loadError = null;

    if ($loaded === null) {
      $loaded = false;
      try {
        $libPath = realpath(__DIR__ . '/../../../api-php/lib');
        if ($libPath && is_file($libPath . '/db.php') && is_file($libPath . '/workflows.php')) {
          require_once $libPath . '/db.php';
          require_once $libPath . '/workflows.php';
          $loaded = function_exists('wf_trigger');
        } else {
          $loadError = 'api-php/lib not found at ' . ($libPath ?: 'unresolved path');
        }
      } catch (Throwable $e) {
        $loadError = 'load failed: ' . $e->getMessage();
      }
    }

    if (!$loaded) {
      error_log('[wf_bridge] skipped trigger=' . $type . ' (' . ($loadError ?: 'unknown') . ')');
      return ['ok' => false, 'reason' => 'bridge_unavailable'];
    }

    try {
      $fired = wf_trigger($type, $match, $ctx, $org_id);
      return ['ok' => true, 'count' => count($fired), 'fired' => $fired];
    } catch (Throwable $e) {
      error_log('[wf_bridge] trigger=' . $type . ' threw: ' . $e->getMessage());
      return ['ok' => false, 'reason' => 'trigger_threw', 'error' => $e->getMessage()];
    }
  }

}
