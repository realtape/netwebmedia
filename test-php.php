<?php
// NWM minimal POST diagnostic — remove after debugging
// If this returns 500, problem is server-level (ModSecurity, .htaccess, PHP handler)
// If it returns 200, problem is specific to submit.php logic
http_response_code(200);
header('Content-Type: text/plain');
echo 'method=' . $_SERVER['REQUEST_METHOD'] . ' php=' . PHP_VERSION;
