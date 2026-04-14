<?php
/**
 * NetWebMedia CRM - Database Configuration
 *
 * IMPORTANT: Update these credentials after creating the database
 * in cPanel > MySQL Databases
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'webmed6_crm');
define('DB_USER', 'webmed6_crm');  // Create this user in cPanel
define('DB_PASS', 'Nwm@Crm2026!Sx');  // Set password in cPanel
define('DB_CHARSET', 'utf8mb4');

// CORS and security
define('ALLOWED_ORIGIN', 'https://netwebmedia.com');

// HubSpot API - Private App Token
// Create at: Settings > Integrations > Private Apps > Create
// Required scopes: crm.objects.contacts.write, crm.objects.contacts.read
define('HUBSPOT_TOKEN', '');  // Set your HubSpot private app token here

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
