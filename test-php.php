<?php
// NWM diagnostic — remove after debugging submit.php 500
// https://netwebmedia.com/test-php.php
header('Content-Type: application/json');
$log_path = __DIR__ . '/submit-leads.log';
$can_write = is_writable(__DIR__) || is_writable($log_path) || @file_put_contents($log_path, '', FILE_APPEND) !== false;
echo json_encode([
    'ok'         => true,
    'php'        => PHP_VERSION,
    'dir'        => __DIR__,
    'log_path'   => $log_path,
    'log_exists' => file_exists($log_path),
    'dir_write'  => is_writable(__DIR__),
    'open_basedir' => ini_get('open_basedir'),
    'method'     => $_SERVER['REQUEST_METHOD'],
    'time'       => gmdate('Y-m-d H:i:s') . ' UTC',
]);
