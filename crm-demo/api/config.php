<?php
/**
 * NetWebMedia CRM DEMO — Database Configuration
 *
 * DEMO environment, isolated from production (webmed6_crmdemo).
 * Seeded with sample data; reset nightly via cron. Do NOT store real customer data.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'webmed6_crmdemo');
define('DB_USER', 'webmed6_crmdemo');
define('DB_CHARSET', 'utf8mb4');

// Demo flag — handlers can render banners / rate-limit / disable destructive ops
define('IS_DEMO', true);

// Load server-only overrides from untracked local file
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
}
if (!defined('DB_PASS')) define('DB_PASS', '');

// CORS — demo is served from same origin
define('ALLOWED_ORIGIN', 'https://netwebmedia.com');

// HubSpot sync disabled in demo
define('HUBSPOT_TOKEN', '');

// Anthropic API — optional, set in config.local.php if AI intake agent is enabled
if (!defined('ANTHROPIC_API_KEY')) define('ANTHROPIC_API_KEY', '');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $msg, int $code = 400): void {
    jsonResponse(['error' => $msg], $code);
}

function getInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
