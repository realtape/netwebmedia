<?php
/* Uptime health endpoint. Lightweight — does NOT touch DB.
 * Target of UptimeRobot + GitHub Actions smoke test.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex');
http_response_code(200);
echo json_encode([
  'ok'      => true,
  'time'    => time(),
  'service' => 'netwebmedia',
]);
