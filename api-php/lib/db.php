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

    // Secondary source: api-php/config.local.php — generated at deploy time from
    // GitHub Actions secrets. Lets us inject/rotate keys (ANTHROPIC_API_KEY,
    // RESEND_API_KEY, etc.) without SSH'ing into cPanel.
    //
    // Merge rules:
    //   - For rotatable API keys/tokens (whitelist below), config.local.php
    //     WINS when it defines a non-empty value. This is the ONLY way key
    //     rotations via GitHub secrets reach production; otherwise a stale
    //     value in the home file silently shadows the new deploy.
    //   - For everything else (DB credentials, infrastructure constants),
    //     the home file wins and config.local.php only fills empty/missing
    //     keys. Never overwrite DB creds from a deploy artifact.
    $deployRotatableKeys = [
      'anthropic_api_key',
      'resend_api_key',
      'hubspot_token',
      'mp_access_token',
      'mp_public_key',
      'mp_webhook_secret',
      'jwt_secret',
    ];
    $localFile = __DIR__ . '/../config.local.php';
    if (file_exists($localFile)) {
      $local = @include $localFile;
      if (is_array($local)) {
        foreach ($local as $k => $v) {
          if (empty($v)) continue;
          if (in_array($k, $deployRotatableKeys, true)) {
            $c[$k] = $v; // deploy wins for rotatable keys
          } elseif (empty($c[$k])) {
            $c[$k] = $v; // fill-only for anything else
          }
        }
      }
    }

    // Public/default fallbacks. Safe to commit because they are non-secret
    // identifiers (e.g. browser-side Sentry DSNs are designed to be public).
    // config.local.php or the home file may override these.
    if (empty($c['sentry_dsn'])) {
      // Same project as the JS-side capture in /js/nwm-sentry.js.
      $c['sentry_dsn'] = 'https://69fce09a20f1958bd2f1b9e601ba9a46@o4511302572441600.ingest.us.sentry.io/4511302588235776';
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
