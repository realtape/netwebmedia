<?php
function json_out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function err($message, $code = 400, $extra = []) {
  json_out(array_merge(['error' => $message], $extra), $code);
}

function body() {
  static $b = null;
  if ($b === null) {
    $raw = file_get_contents('php://input');
    $b = $raw ? (json_decode($raw, true) ?: []) : [];
    if (!is_array($b)) $b = [];
  }
  return $b;
}

function required($keys) {
  $b = body();
  foreach ((array)$keys as $k) {
    if (!isset($b[$k]) || $b[$k] === '') err("Missing field: $k", 400);
  }
  return $b;
}

function qparam($name, $default = null) {
  return isset($_GET[$name]) ? $_GET[$name] : $default;
}

function now() { return date('Y-m-d H:i:s'); }

function cors() {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $allowed = ['https://netwebmedia.com', 'https://www.netwebmedia.com'];
  if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
  }
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function log_activity($action, $resourceType = null, $resourceId = null, $meta = null) {
  global $AUTH_USER;
  try {
    qExec(
      "INSERT INTO activity_log (org_id, user_id, action, resource_type, resource_id, meta) VALUES (?, ?, ?, ?, ?, ?)",
      [
        $AUTH_USER['org_id'] ?? 1,
        $AUTH_USER['id'] ?? null,
        $action,
        $resourceType,
        $resourceId,
        $meta ? json_encode($meta) : null,
      ]
    );
  } catch (Exception $e) { /* silent */ }
}
