<?php
/**
 * One-time installer: imports schema.sql into the database.
 * DELETE THIS FILE after running once!
 *
 * Usage: visit https://netwebmedia.com/crm-vanilla/api/install.php?token=YOUR_SECRET
 */
require_once __DIR__ . '/config.php';

// Secret token gate — change before deploying
$INSTALL_TOKEN = 'nwm_setup_' . substr(md5(__FILE__), 0, 16);

if (($_GET['token'] ?? '') !== $INSTALL_TOKEN) {
    http_response_code(403);
    echo "Forbidden. Token required. Check install.php for the token.\n";
    echo "Token: $INSTALL_TOKEN\n";
    exit;
}

try {
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    $pdo = getDB();
    $pdo->exec($sql);
    echo "OK: schema imported.\n";
    echo "IMPORTANT: Delete api/install.php now!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
