<?php
function db() {
  static $pdo = null;
  if ($pdo === null) {
    $cfg = require '/home/webmed6/.netwebmedia-config.php';
    $dsn = 'mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4';
    try {
      $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
      ]);
    } catch (PDOException $e) {
      http_response_code(500);
      echo json_encode(['error' => 'DB connection failed', 'detail' => $e->getMessage()]);
      exit;
    }
  }
  return $pdo;
}

function config() {
  static $c = null;
  if ($c === null) {
    // Primary source: server-side secrets file (outside repo, managed on cPanel).
    // Contains DB creds and any long-lived production keys.
    $c = require '/home/webmed6/.netwebmedia-config.php';

    // Fallback source: api-php/config.local.php — generated at deploy time from
    // GitHub Actions secrets. Lets us inject keys (e.g. ANTHROPIC_API_KEY,
    // RESEND_API_KEY) without SSH'ing into cPanel.
    //
    // Merge rule: the home file wins for any key it already defines (and defines
    // truthy). Missing/empty keys are filled from config.local.php.
    $localFile = __DIR__ . '/../config.local.php';
    if (file_exists($localFile)) {
      $local = @include $localFile;
      if (is_array($local)) {
        foreach ($local as $k => $v) {
          if (empty($c[$k]) && !empty($v)) {
            $c[$k] = $v;
          }
        }
      }
    }
  }
  return $c;
}

function qOne($sql, $params = []) {
  $s = db()->prepare($sql);
  $s->execute($params);
  return $s->fetch();
}

function qAll($sql, $params = []) {
  $s = db()->prepare($sql);
  $s->execute($params);
  return $s->fetchAll();
}

function qExec($sql, $params = []) {
  $s = db()->prepare($sql);
  $s->execute($params);
  return $s;
}

function lastId() { return (int) db()->lastInsertId(); }
