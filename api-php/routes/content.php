<?php
/* AI Content routes — Claude-powered blog writer + AEO generator + knowledge-base search.
   All admin-auth-required.
     POST /api/ai/content/write   {topic, keywords[], length?, tone?, intent?}
     POST /api/ai/content/aeo     {topic, questions[]}
     POST /api/ai/content/publish {title, slug, html, meta_description, category?} → creates blog_post
     GET  /api/knowledge/search   ?q=... → SQL-FTS search over knowledge_articles
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/ai.php';  // reuses ai_call_claude

function content_ensure_schema() {
  db()->exec("CREATE TABLE IF NOT EXISTS knowledge_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(200),
    body MEDIUMTEXT,
    tags VARCHAR(400),
    source VARCHAR(60) DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org (org_id),
    FULLTEXT ix_fts (title, body)
  ) ENGINE=InnoDB");
}

function route_ai_content($parts, $method) {
  content_ensure_schema();
  $sub = $parts[0] ?? '';

  if ($sub === 'write' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['topic']);
    $kw = is_array($b['keywords'] ?? null) ? $b['keywords'] : [];
    $length = $b['length'] ?? 'medium'; // short/medium/long
    $tone = $b['tone'] ?? 'professional';
    $intent = $b['intent'] ?? 'commercial';
    $wordTarget = ['short' => 500, 'medium' => 900, 'long' => 1500][$length] ?? 900;

    $sys = "You are a senior SEO content writer for NetWebMedia, an AI marketing agency. Produce a complete, publish-ready blog post in clean HTML (no markdown, no <html>/<body> wrappers — just section HTML).\n"
         . "Requirements:\n"
         . "- ONE <h1> at the top with the article title\n"
         . "- 4-7 <h2> sections with 2-4 paragraphs each\n"
         . "- Include a FAQ block at the end: <h2>Frequently Asked Questions</h2> with 4-6 <h3>Question</h3><p>Answer</p> pairs\n"
         . "- Target ~{$wordTarget} words\n"
         . "- Tone: {$tone}. Intent: {$intent}.\n"
         . "- Integrate keywords naturally; don't stuff.\n"
         . "- At the end, include an internal-link suggestion note inside an HTML comment: <!-- INTERNAL_LINKS: [...] -->\n"
         . "- No inline styles, no scripts.\n"
         . "- Return ONLY the HTML, no preamble.";
    $prompt = "Topic: {$b['topic']}\nTarget keywords: " . implode(', ', $kw);
    $r = ai_call_claude($sys, $prompt, [], 'claude-3-5-sonnet-20241022');
    json_out(['html' => $r['text'] ?? null, 'mock' => !empty($r['mock']), 'error' => $r['error'] ?? null]);
  }

  if ($sub === 'aeo' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['topic']);
    $questions = is_array($b['questions'] ?? null) ? $b['questions'] : [];
    $sys = "You are an AEO (Answer Engine Optimization) specialist. Produce a JSON object with two keys: 'faq_html' (HTML with <h3>Question</h3><p>Answer</p> pairs, each answer 2-3 sentences) and 'json_ld' (valid schema.org FAQPage JSON-LD as a string). Return ONLY JSON, no preamble.";
    $prompt = "Topic: {$b['topic']}\nSeed questions (expand to 6-8): " . implode(' | ', $questions);
    $r = ai_call_claude($sys, $prompt, [], 'claude-3-5-sonnet-20241022');
    json_out(['result' => $r['text'] ?? null, 'mock' => !empty($r['mock']), 'error' => $r['error'] ?? null]);
  }

  if ($sub === 'publish' && $method === 'POST') {
    $u = requirePaidAccess();
    $b = required(['title', 'html']);
    $slug = $b['slug'] ?? preg_replace('/[^a-z0-9]+/i', '-', strtolower($b['title']));
    $meta = $b['meta_description'] ?? null;
    $category = $b['category'] ?? null;
    $data = [
      'body_html' => $b['html'],
      'meta_description' => $meta,
      'category' => $category,
      'author' => $u['name'] ?? 'NetWebMedia',
      'source' => 'ai-content-writer',
    ];
    qExec("INSERT INTO resources (org_id, type, slug, title, status, data, owner_id) VALUES (?, 'blog_post', ?, ?, 'published', ?, ?)",
      [$u['org_id'], $slug, $b['title'], json_encode($data, JSON_UNESCAPED_UNICODE), $u['id']]);
    json_out(['ok' => true, 'id' => lastId(), 'slug' => $slug]);
  }

  err('Not found', 404);
}

function route_knowledge($parts, $method) {
  content_ensure_schema();
  $u = requirePaidAccess();

  if (empty($parts) && $method === 'GET') {
    $q = trim($_GET['q'] ?? '');
    $rows = $q
      ? qAll("SELECT id, title, slug, tags, LEFT(body, 240) AS snippet, MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE) AS score FROM knowledge_articles WHERE org_id = ? AND MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 20", [$q, $u['org_id'], $q])
      : qAll("SELECT id, title, slug, tags, LEFT(body, 240) AS snippet FROM knowledge_articles WHERE org_id = ? ORDER BY updated_at DESC LIMIT 50", [$u['org_id']]);
    json_out(['items' => $rows]);
  }
  if (empty($parts) && $method === 'POST') {
    $b = required(['title', 'body']);
    qExec("INSERT INTO knowledge_articles (org_id, title, slug, body, tags) VALUES (?, ?, ?, ?, ?)",
      [$u['org_id'], $b['title'], $b['slug'] ?? null, $b['body'], $b['tags'] ?? null]);
    json_out(['ok' => true, 'id' => lastId()], 201);
  }
  $id = (int)($parts[0] ?? 0);
  $row = qOne("SELECT * FROM knowledge_articles WHERE id = ? AND org_id = ?", [$id, $u['org_id']]);
  if (!$row) err('Not found', 404);
  if ($method === 'GET') json_out($row);
  if ($method === 'PUT') {
    $b = body();
    $fields = [];
    $params = [];
    foreach (['title','slug','body','tags'] as $f) if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    if (!$fields) err('Nothing to update', 400);
    $params[] = $id;
    qExec("UPDATE knowledge_articles SET " . implode(',', $fields) . " WHERE id = ?", $params);
    json_out(['ok' => true]);
  }
  if ($method === 'DELETE') { qExec("DELETE FROM knowledge_articles WHERE id = ?", [$id]); json_out(['ok' => true]); }
  err('Method not allowed', 405);
}
