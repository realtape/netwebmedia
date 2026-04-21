<?php
/* Blog post comments — public, no auth required
   GET  /api/comments?slug=xxx  → list approved comments
   POST /api/comments           → submit a comment
*/

function comments_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS blog_comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(200) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(200) DEFAULT NULL,
    comment     TEXT NOT NULL,
    ip          VARCHAR(45)  DEFAULT NULL,
    status      VARCHAR(20)  DEFAULT 'approved',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY ix_slug_status (slug, status)
  )");
}

function route_comments($parts, $method) {
  comments_ensure_schema();

  if ($method === 'GET') {
    $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(qparam('slug', '')));
    if (!$slug) err('slug required');
    $rows = qAll(
      "SELECT id, name, comment, created_at
       FROM blog_comments
       WHERE slug = ? AND status = 'approved'
       ORDER BY created_at ASC",
      [$slug]
    );
    json_out(['comments' => $rows, 'count' => count($rows)]);
  }

  if ($method === 'POST') {
    $b = body();

    // Honeypot — silent discard
    if (!empty($b['website']) || !empty($b['hp_field'])) {
      json_out(['ok' => true]);
      return;
    }

    $slug    = preg_replace('/[^a-z0-9\-]/', '', strtolower(trim($b['slug']    ?? '')));
    $name    = trim($b['name']    ?? '');
    $email   = trim($b['email']   ?? '');
    $comment = trim($b['comment'] ?? '');

    if (!$slug)    err('slug required');
    if (!$name)    err('Name is required');
    if (!$comment) err('Comment is required');
    if (mb_strlen($name)    > 100)  err('Name too long');
    if (mb_strlen($comment) > 2000) err('Comment too long (max 2000 chars)');
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email address');

    // Rate-limit: same IP + slug within 60 seconds
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $recent = qOne(
      "SELECT id FROM blog_comments
       WHERE ip = ? AND slug = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
       LIMIT 1",
      [$ip, $slug]
    );
    if ($recent) err('Please wait a moment before posting again', 429);

    qExec(
      "INSERT INTO blog_comments (slug, name, email, comment, ip) VALUES (?, ?, ?, ?, ?)",
      [$slug, $name, $email ?: null, $comment, $ip]
    );

    json_out(['ok' => true, 'id' => lastId()]);
  }

  err('Method not allowed', 405);
}
