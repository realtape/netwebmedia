<?php
declare(strict_types=1);
// NWM diagnostic — check for function redeclaration conflicts
http_response_code(200);
header('Content-Type: application/json');

$info = [
  'php'              => PHP_VERSION,
  'method'           => $_SERVER['REQUEST_METHOD'],
  'prepend_file'     => ini_get('auto_prepend_file') ?: 'none',
  'append_file'      => ini_get('auto_append_file') ?: 'none',
  'clean_exists'     => function_exists('clean'),
  'fail_exists'      => function_exists('fail'),
  'defined_funcs'    => count(get_defined_functions()['user']),
  'user_funcs'       => get_defined_functions()['user'],
];

echo json_encode($info, JSON_PRETTY_PRINT);
