<?php
/**
 * DB bridge — reuses crm-vanilla's getDB() which connects to webmed6_crm.
 *
 * Path resolution: superadmin/api/lib/ → up 3 = repo root → crm-vanilla/api/config.php
 */
$_crm_config = dirname(__DIR__, 3) . '/crm-vanilla/api/config.php';
if (!file_exists($_crm_config)) {
    error_log('[superadmin] crm-vanilla config not found at ' . $_crm_config);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}
require_once $_crm_config;
// getDB() is now available — returns PDO connected to webmed6_crm
