<?php
/* One-shot migration + seed. Protected by a token.
   Usage: GET /api/migrate.php?token=... */
require __DIR__ . '/lib/db.php';
header('Content-Type: text/plain');

$cfg = config();
if (($_GET['token'] ?? '') !== substr($cfg['jwt_secret'], 0, 16)) {
  http_response_code(403);
  echo "Forbidden. Provide ?token=<first-16-chars-of-jwt_secret>\n";
  exit;
}

$pdo = db();

function step($name, $sql) {
  global $pdo;
  echo "-- $name\n";
  try {
    $pdo->exec($sql);
    echo "   OK\n";
  } catch (PDOException $e) {
    echo "   ERR: " . $e->getMessage() . "\n";
  }
}

echo "── Creating schema ──\n";

step('users', "
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'pending_payment',
  org_id INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  UNIQUE KEY uniq_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Idempotent column add for existing installs (ignore "Duplicate column" error)
try {
  $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending_payment' AFTER role");
  echo "   users.status column added\n";
} catch (PDOException $e) {
  if (strpos($e->getMessage(), 'Duplicate column') !== false) {
    echo "   users.status already present\n";
  } else {
    echo "   users.status ALTER skipped: " . $e->getMessage() . "\n";
  }
}
try {
  $pdo->exec("ALTER TABLE users ADD INDEX idx_status (status)");
} catch (PDOException $e) { /* index may already exist */ }

// Back-fill any legacy rows without status to 'active' (grandfather existing users in).
// New signups get 'pending_payment' from auth.php INSERT.
try {
  $pdo->exec("UPDATE users SET status='active' WHERE status IS NULL OR status=''");
} catch (PDOException $e) { /* no-op */ }

step('sessions', "
CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

step('resources', "
CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL DEFAULT 1,
  type VARCHAR(50) NOT NULL,
  slug VARCHAR(255) DEFAULT NULL,
  title VARCHAR(500) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'active',
  data MEDIUMTEXT NOT NULL,
  owner_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_org_type (org_id, type),
  INDEX idx_status (type, status),
  INDEX idx_slug (type, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

step('form_submissions', "
CREATE TABLE IF NOT EXISTS form_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL DEFAULT 1,
  form_id INT NOT NULL,
  data TEXT NOT NULL,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form (form_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

step('activity_log', "
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL DEFAULT 1,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  meta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_org_time (org_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

step('email_log', "
CREATE TABLE IF NOT EXISTS email_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  to_addr VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

step('workflow_runs', "
CREATE TABLE IF NOT EXISTS workflow_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  org_id INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  step_index INT NOT NULL DEFAULT 0,
  context_json MEDIUMTEXT,
  error TEXT,
  next_run_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_next (status, next_run_at),
  INDEX idx_workflow (workflow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

step('workflow_step_log', "
CREATE TABLE IF NOT EXISTS workflow_step_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  run_id INT NOT NULL,
  step_index INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  result_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_run (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

echo "\n── Seeding users ──\n";
$existing = qOne("SELECT COUNT(*) AS c FROM users")['c'];
if ($existing == 0) {
  $defaults = [
    ['admin@netwebmedia.com', 'NetWeb Admin', 'admin', 'NetWebAdmin2026!'],
    ['demo@netwebmedia.com',  'Demo User',    'demo',  'demo1234'],
  ];
  foreach ($defaults as $d) {
    $hash = password_hash($d[3], PASSWORD_BCRYPT);
    qExec(
      "INSERT INTO users (email, password_hash, name, role, org_id) VALUES (?, ?, ?, ?, 1)",
      [$d[0], $hash, $d[1], $d[2]]
    );
    echo "   + user: {$d[0]} ({$d[2]})\n";
  }
} else {
  echo "   users already exist ($existing) — skipping\n";
}

echo "\n── Seeding CMS resources ──\n";
$seedFile = __DIR__ . '/seed-data.json';
if (!file_exists($seedFile)) {
  echo "   seed-data.json not found — skipping resource seed\n";
} else {
  $existingResources = qOne("SELECT COUNT(*) AS c FROM resources")['c'];
  if ($existingResources > 0) {
    echo "   resources already exist ($existingResources) — skipping\n";
  } else {
    $seed = json_decode(file_get_contents($seedFile), true);
    $adminId = qOne("SELECT id FROM users WHERE email = 'admin@netwebmedia.com'")['id'];
    $total = 0;
    foreach ($seed as $row) {
      qExec(
        "INSERT INTO resources (org_id, type, slug, title, status, data, owner_id) VALUES (1, ?, ?, ?, ?, ?, ?)",
        [$row['type'], $row['slug'] ?? null, $row['title'] ?? null, $row['status'] ?? 'active', json_encode($row['data'] ?? []), $adminId]
      );
      $total++;
    }
    echo "   + seeded $total resources\n";
  }
}

echo "\nDONE.\n";
echo "Default credentials:\n";
echo "  admin@netwebmedia.com / NetWebAdmin2026!\n";
echo "  demo@netwebmedia.com  / demo1234\n";
