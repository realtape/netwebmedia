<?php
/* AEO Citation Index — public lead-magnet endpoint.
 * Route: POST /api/public/aeo-score
 * Body : { url, email, brand_name? }
 * Mounted from routes/public.php sub-dispatcher.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/ratelimit.php';
require_once __DIR__ . '/../lib/aeo_score.php';
require_once __DIR__ . '/../lib/email-sequences.php';

function aeo_ensure_schema(): void {
  static $checked = false;
  if ($checked) return;
  $checked = true;
  // Lazy-create. Idempotent: CREATE TABLE IF NOT EXISTS.
  qExec("CREATE TABLE IF NOT EXISTS aeo_audits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL DEFAULT 1,
    email VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    brand_name VARCHAR(120) DEFAULT NULL,
    score INT DEFAULT NULL,
    breakdown_json LONGTEXT DEFAULT NULL,
    ip VARCHAR(64) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'pending',
    error TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function route_public_aeo_score($parts, $method): void {
  if ($method !== 'POST') err('Method not allowed', 405);

  // Rate limit: 5 / hour / IP. Heavier than other public endpoints because
  // each call fetches an external URL and parses ~3MB of HTML.
  rate_limit_check('aeo_score', 5, 3600);

  $b = body();
  $url   = trim((string)($b['url'] ?? ''));
  $email = strtolower(trim((string)($b['email'] ?? '')));
  $brand = trim((string)($b['brand_name'] ?? ''));
  $lang  = strtolower(trim((string)($b['lang'] ?? 'en')));
  if (!in_array($lang, ['en', 'es'], true)) $lang = 'en';

  // Honeypot — silent 200 with a fake score, like the forms endpoint
  foreach (['nwm_website', 'hp_website', 'honeypot', 'website_url'] as $hp) {
    if (!empty($b[$hp])) {
      json_out([
        'ok'     => true,
        'score'  => 72,
        'sub_scores' => ['entity'=>70,'schema'=>74,'topical'=>72,'citations'=>70,'methodology'=>74],
        'actions' => [],
        'submission_id' => 0,
      ]);
    }
  }

  if ($url === '') err('url required', 400);
  if ($email === '') err('email required', 400);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email', 400);
  if ($brand !== '' && mb_strlen($brand) > 80) err('brand_name too long (max 80 chars)', 400);

  // Light URL sanity check before handing to the scorer (which does deep SSRF guard)
  $probe = $url;
  if (!preg_match('#^https?://#i', $probe)) $probe = 'https://' . $probe;
  if (!filter_var($probe, FILTER_VALIDATE_URL)) err('Invalid URL', 400);

  aeo_ensure_schema();

  $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
  $ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250);

  // Insert pending row first so we have a record even if scoring blows up.
  $orgId = 1;
  qExec(
    "INSERT INTO aeo_audits (organization_id, email, url, brand_name, ip, user_agent, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')",
    [$orgId, $email, $url, $brand !== '' ? $brand : null, $ip, $ua]
  );
  $auditId = lastId();

  // Run the scorer
  $result = aeo_compute_score($url, $brand);

  if (empty($result['ok'])) {
    qExec(
      "UPDATE aeo_audits SET status='failed', error=? WHERE id=?",
      [substr((string)($result['error'] ?? 'unknown'), 0, 1000), $auditId]
    );
    err('Could not score that URL: ' . ($result['error'] ?? 'unknown'), 400, ['audit_id' => $auditId]);
  }

  // Persist score + breakdown
  qExec(
    "UPDATE aeo_audits SET score=?, breakdown_json=?, status='complete' WHERE id=?",
    [$result['score'], json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $auditId]
  );

  // Auto-create / update a CRM contact (best-effort, never block on failure)
  $contactId = null;
  try {
    $existing = qOne(
      "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ? LIMIT 1",
      [$email]
    );
    if ($existing) {
      $cd = json_decode($existing['data'], true) ?: [];
      $tags = $cd['tags'] ?? [];
      if (!in_array('aeo-index', $tags, true)) $tags[] = 'aeo-index';
      $cd['tags'] = $tags;
      $cd['last_aeo_score'] = $result['score'];
      $cd['last_aeo_url']   = $result['url'];
      qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($cd), $existing['id']]);
      $contactId = (int)$existing['id'];
    } else {
      $cd = [
        'name'    => $brand ?: $email,
        'email'   => $email,
        'website' => $result['url'],
        'company' => $brand ?: null,
        'source'  => 'aeo-index',
        'tags'    => ['aeo-index', 'lead-new'],
        'last_aeo_score' => $result['score'],
        'last_aeo_url'   => $result['url'],
      ];
      qExec(
        "INSERT INTO resources (org_id, type, slug, title, status, data) VALUES (?, 'contact', ?, ?, 'lead', ?)",
        [$orgId, 'aeo-' . substr(bin2hex(random_bytes(4)), 0, 8), $cd['name'], json_encode($cd)]
      );
      $contactId = lastId();
    }
  } catch (Throwable $_) { /* tolerate */ }

  // Enroll in the AEO follow-up sequence (best-effort).
  if ($contactId) {
    try {
      seq_enroll($contactId, 'aeo-audit-followup', [
        'email'      => $email,
        'name'       => $brand ?: $email,
        'first_name' => $brand !== '' ? preg_split('/\s+/', $brand, 2)[0] : '',
        'lang'       => $lang,
        'website'    => $result['url'],
        'aeo_score'  => $result['score'],
        'source'     => 'aeo-index',
        'enrolled_via' => 'aeo_score_form',
      ]);
    } catch (Throwable $_) {}
  }

  json_out([
    'ok'         => true,
    'audit_id'   => $auditId,
    'url'        => $result['url'],
    'final_url'  => $result['final_url'],
    'score'      => $result['score'],
    'sub_scores' => $result['sub_scores'],
    'actions'    => $result['actions'],
    'signals'    => $result['signals'],
    'computed_at'=> $result['computed_at'],
  ]);
}
