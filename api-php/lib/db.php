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
  if ($c === null) $c = require '/home/webmed6/.netwebmedia-config.php';
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
