<?php
declare(strict_types=1);
// Does strict_types break POST? Remove after debugging.
http_response_code(200);
header('Content-Type: text/plain');
echo 'strict_types=ok method=' . $_SERVER['REQUEST_METHOD'] . ' php=' . PHP_VERSION;
