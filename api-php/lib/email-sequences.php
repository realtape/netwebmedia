<?php
/**
 * Email Nurture Sequences — load config, enroll contacts, render & send.
 *
 * Schema (auto-created on first call):
 *   CREATE TABLE email_sequence_queue (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     contact_id BIGINT NOT NULL,
 *     sequence_id VARCHAR(64) NOT NULL,
 *     message_id VARCHAR(64) NOT NULL,
 *     email VARCHAR(255) NOT NULL,
 *     name VARCHAR(255),
 *     lang ENUM('en','es') DEFAULT 'en',
 *     context JSON,
 *     send_at DATETIME NOT NULL,
 *     status ENUM('queued','sent','failed','cancelled') DEFAULT 'queued',
 *     error TEXT NULL,
 *     enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 *     sent_at DATETIME NULL,
 *     INDEX idx_status_send (status, send_at),
 *     INDEX idx_contact (contact_id, sequence_id, message_id)
 *   )
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

function seq_ensure_schema() {
  static $checked = false;
  if ($checked) return;
  $checked = true;
  qExec("CREATE TABLE IF NOT EXISTS email_sequence_queue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contact_id BIGINT NOT NULL,
    sequence_id VARCHAR(64) NOT NULL,
    message_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    lang VARCHAR(8) DEFAULT 'en',
    context JSON,
    send_at DATETIME NOT NULL,
    status VARCHAR(16) DEFAULT 'queued',
    error TEXT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    INDEX idx_status_send (status, send_at),
    INDEX idx_contact (contact_id, sequence_id, message_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function seq_load_config() {
  static $cfg = null;
  if ($cfg !== null) return $cfg;
  $path = realpath(__DIR__ . '/../../email-templates/sequences.json');
  if (!$path || !is_readable($path)) {
    $cfg = false;
    return $cfg;
  }
  $raw = file_get_contents($path);
  $cfg = json_decode($raw, true);
  if (!is_array($cfg)) $cfg = false;
  return $cfg;
}

function seq_load_template($filename) {
  $path = realpath(__DIR__ . '/../../email-templates/' . $filename);
  if (!$path || !is_readable($path)) return false;
  return file_get_contents($path);
}

function seq_load_base() {
  static $base = null;
  if ($base !== null) return $base;
  $base = seq_load_template('_base.html');
  if ($base === false) $base = '<html><body>{{CONTENT}}</body></html>';
  return $base;
}

/**
 * Enroll a contact into a sequence.
 *
 * @param int $contact_id  Contact resource ID
 * @param string $sequence_id  Sequence key from sequences.json (e.g., 'welcome', 'audit_followup')
 * @param array $context  Per-contact data: ['email', 'name', 'lang', 'website', 'first_name', ...]
 * @return array  ['enrolled' => N, 'sequence' => 'welcome', 'messages' => [...]]
 */
function seq_enroll($contact_id, $sequence_id, $context = []) {
  seq_ensure_schema();
  $cfg = seq_load_config();
  if (!$cfg || !isset($cfg['sequences'][$sequence_id])) {
    return ['enrolled' => 0, 'error' => 'sequence_not_found'];
  }
  $seq = $cfg['sequences'][$sequence_id];
  if (empty($context['email'])) return ['enrolled' => 0, 'error' => 'no_email'];

  // Cancel any prior enrollment in same sequence (avoid duplicates)
  qExec(
    "UPDATE email_sequence_queue SET status='cancelled' WHERE contact_id=? AND sequence_id=? AND status='queued'",
    [$contact_id, $sequence_id]
  );

  $lang = (isset($context['lang']) && in_array(strtolower($context['lang']), ['es', 'en'])) ? strtolower($context['lang']) : 'en';
  $email = strtolower(trim($context['email']));
  $name = $context['name'] ?? '';
  $first = $context['first_name'] ?? (preg_split('/\s+/', $name, 2)[0] ?? '');
  $context['first_name'] = $first;
  $context['lang'] = $lang;

  $now = time();
  $messages = [];
  foreach ($seq['messages'] as $msg) {
    $delayMin = (int)($msg['delay_minutes'] ?? 0);
    $sendAt = date('Y-m-d H:i:s', $now + $delayMin * 60);
    qExec(
      "INSERT INTO email_sequence_queue
       (contact_id, sequence_id, message_id, email, name, lang, context, send_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')",
      [$contact_id, $sequence_id, $msg['id'], $email, $name, $lang, json_encode($context), $sendAt]
    );
    $messages[] = ['id' => $msg['id'], 'send_at' => $sendAt];
  }
  return ['enrolled' => count($messages), 'sequence' => $sequence_id, 'messages' => $messages];
}

/**
 * Replace {{token}} and {{token|fallback}} placeholders.
 */
function seq_replace_tokens($s, $ctx) {
  return preg_replace_callback('/\{\{([a-zA-Z0-9_]+)(?:\|([^}]*))?\}\}/', function($m) use ($ctx) {
    $key = $m[1];
    $fallback = $m[2] ?? '';
    if (isset($ctx[$key]) && $ctx[$key] !== '' && $ctx[$key] !== null) return $ctx[$key];
    return $fallback;
  }, $s);
}

/**
 * Extract the language-specific block from the dual-language template.
 */
function seq_extract_lang_block($template, $lang = 'en') {
  $marker = $lang === 'es' ? '<!-- LANG:ES -->' : '<!-- LANG:EN -->';
  $next   = $lang === 'es' ? null : '<!-- LANG:ES -->';
  $start = strpos($template, $marker);
  if ($start === false) return $template;
  $start += strlen($marker);
  if ($next !== null) {
    $end = strpos($template, $next, $start);
    if ($end !== false) return trim(substr($template, $start, $end - $start));
  }
  return trim(substr($template, $start));
}

/**
 * Render a queued message into final HTML + subject ready to send.
 */
function seq_render($queue_row) {
  $cfg = seq_load_config();
  $sid = $queue_row['sequence_id'];
  $mid = $queue_row['message_id'];
  if (!isset($cfg['sequences'][$sid])) return false;
  $seq = $cfg['sequences'][$sid];

  $msg = null;
  foreach ($seq['messages'] as $m) {
    if ($m['id'] === $mid) { $msg = $m; break; }
  }
  if (!$msg) return false;

  $lang = $queue_row['lang'] ?: 'en';
  $context = json_decode($queue_row['context'] ?? '{}', true) ?: [];
  $context['email'] = $queue_row['email'];
  $context['name'] = $queue_row['name'];
  $context['lang'] = $lang;

  $tplRaw = seq_load_template($msg['template']);
  if ($tplRaw === false) return false;
  $contentBlock = seq_extract_lang_block($tplRaw, $lang);

  // Build CTA + add token
  $primary_url = $msg['primary_url'] ?? 'https://netwebmedia.com/';
  $primary_label = $msg['primary_cta'][$lang] ?? ($msg['primary_cta']['en'] ?? 'Learn more');
  $context['primary_url'] = $primary_url;
  $context['primary_cta_label'] = $primary_label;

  // Tokens for compliance links
  $token = bin2hex(random_bytes(8)) . substr(md5($queue_row['email']), 0, 8);
  $context['token'] = $token;
  $context['preference_url'] = 'https://netwebmedia.com/api/public/email/preferences?token=' . $token . '&email=' . urlencode($queue_row['email']);
  $context['unsubscribe_url'] = 'https://netwebmedia.com/api/public/email/preferences?action=unsubscribe&token=' . $token . '&email=' . urlencode($queue_row['email']);

  // Render content + plug into base
  $contentRendered = seq_replace_tokens($contentBlock, $context);
  $base = seq_load_base();
  $html = str_replace('{{CONTENT}}', $contentRendered, $base);
  $html = seq_replace_tokens($html, $context);

  $subject = seq_replace_tokens($msg['subject'][$lang] ?? ($msg['subject']['en'] ?? 'NetWebMedia'), $context);

  return [
    'to' => $queue_row['email'],
    'subject' => $subject,
    'html' => $html,
    'from_name' => $cfg['from']['name'] ?? 'NetWebMedia',
    'from_email' => $cfg['from']['email'] ?? 'hello@netwebmedia.com',
    'reply_to' => $cfg['from']['reply_to'] ?? 'hello@netwebmedia.com'
  ];
}

/**
 * Process due queued emails (called by cron).
 *
 * @param int $batch  Max emails to process per run
 * @return array
 */
function seq_process_pending($batch = 25) {
  seq_ensure_schema();
  $rows = qAll(
    "SELECT * FROM email_sequence_queue
     WHERE status='queued' AND send_at <= NOW()
     ORDER BY send_at ASC LIMIT $batch"
  );
  $results = ['processed' => 0, 'sent' => 0, 'failed' => 0, 'details' => []];
  foreach ($rows as $r) {
    $rendered = seq_render($r);
    if (!$rendered) {
      qExec("UPDATE email_sequence_queue SET status='failed', error='render_failed' WHERE id=?", [$r['id']]);
      $results['failed']++;
      $results['details'][] = ['id' => $r['id'], 'status' => 'render_failed'];
      continue;
    }
    $ok = false;
    try {
      $ok = send_mail($rendered['to'], $rendered['subject'], $rendered['html'], [
        'from_name' => $rendered['from_name'],
        'from_email' => $rendered['from_email'],
        'reply_to' => $rendered['reply_to']
      ]);
    } catch (Throwable $e) {
      qExec("UPDATE email_sequence_queue SET status='failed', error=? WHERE id=?", [$e->getMessage(), $r['id']]);
      $results['failed']++;
      continue;
    }
    if ($ok) {
      qExec("UPDATE email_sequence_queue SET status='sent', sent_at=NOW() WHERE id=?", [$r['id']]);
      $results['sent']++;
    } else {
      qExec("UPDATE email_sequence_queue SET status='failed', error='send_returned_false' WHERE id=?", [$r['id']]);
      $results['failed']++;
    }
    $results['processed']++;
  }
  return $results;
}

/**
 * Cancel pending sequence messages for a contact (e.g., on unsubscribe).
 */
function seq_cancel_for_contact($contact_id, $sequence_id = null) {
  seq_ensure_schema();
  if ($sequence_id) {
    qExec("UPDATE email_sequence_queue SET status='cancelled' WHERE contact_id=? AND sequence_id=? AND status='queued'", [$contact_id, $sequence_id]);
  } else {
    qExec("UPDATE email_sequence_queue SET status='cancelled' WHERE contact_id=? AND status='queued'", [$contact_id]);
  }
}

/**
 * Cancel all pending messages for an email (used by unsubscribe link without contact_id).
 */
function seq_cancel_for_email($email) {
  seq_ensure_schema();
  qExec("UPDATE email_sequence_queue SET status='cancelled' WHERE email=? AND status='queued'", [strtolower(trim($email))]);
}

/**
 * Render a sequence message as HTML preview (no DB needed).
 * Used by /api/public/email/preview endpoint and the /emails.html gallery.
 *
 * @param string $message_id  e.g., "welcome-1"
 * @param string $lang        "en" or "es"
 * @param array  $sample      Optional sample data: ['first_name' => 'Sarah', 'website' => 'https://example.com', 'email' => 'sample@example.com']
 * @return array|false  ['subject', 'html', 'preview'] or false on error
 */
function seq_render_preview($message_id, $lang = 'en', $sample = []) {
  $cfg = seq_load_config();
  if (!$cfg) return false;

  // Find the message in any sequence
  $msg = null;
  $sequence_id = null;
  foreach ($cfg['sequences'] as $sid => $seq) {
    foreach ($seq['messages'] as $m) {
      if ($m['id'] === $message_id) {
        $msg = $m;
        $sequence_id = $sid;
        break 2;
      }
    }
  }
  if (!$msg) return false;

  $lang = ($lang === 'es') ? 'es' : 'en';

  $sample_email = $sample['email'] ?? 'sample@yourcompany.com';
  $context = array_merge([
    'first_name' => $sample['first_name'] ?? ($lang === 'es' ? 'María' : 'Sarah'),
    'name' => $sample['name'] ?? ($lang === 'es' ? 'María González' : 'Sarah Jones'),
    'website' => $sample['website'] ?? 'https://yourcompany.com',
    'email' => $sample_email,
    'lang' => $lang
  ], $sample);

  $tplRaw = seq_load_template($msg['template']);
  if ($tplRaw === false) return false;
  $contentBlock = seq_extract_lang_block($tplRaw, $lang);

  // CTA
  $primary_url = $msg['primary_url'] ?? 'https://netwebmedia.com/';
  $primary_label = $msg['primary_cta'][$lang] ?? ($msg['primary_cta']['en'] ?? 'Learn more');
  $context['primary_url'] = $primary_url;
  $context['primary_cta_label'] = $primary_label;

  // Compliance tokens (sample)
  $token = 'preview' . substr(md5($sample_email . $message_id), 0, 12);
  $context['token'] = $token;
  $context['preference_url'] = 'https://netwebmedia.com/api/public/email/preferences?token=' . $token . '&email=' . urlencode($sample_email);
  $context['unsubscribe_url'] = 'https://netwebmedia.com/api/public/email/preferences?action=unsubscribe&token=' . $token . '&email=' . urlencode($sample_email);

  // Render
  $contentRendered = seq_replace_tokens($contentBlock, $context);
  $base = seq_load_base();
  $html = str_replace('{{CONTENT}}', $contentRendered, $base);
  $html = seq_replace_tokens($html, $context);

  $subject = seq_replace_tokens($msg['subject'][$lang] ?? ($msg['subject']['en'] ?? 'NetWebMedia'), $context);
  $preview_text = seq_replace_tokens($msg['preview'][$lang] ?? ($msg['preview']['en'] ?? ''), $context);

  return [
    'message_id' => $message_id,
    'sequence_id' => $sequence_id,
    'lang' => $lang,
    'subject' => $subject,
    'preview' => $preview_text,
    'html' => $html,
    'primary_url' => $primary_url,
    'primary_label' => $primary_label
  ];
}

/**
 * List all available preview messages (for gallery).
 */
function seq_list_messages() {
  $cfg = seq_load_config();
  if (!$cfg) return [];
  $out = [];
  foreach ($cfg['sequences'] as $sid => $seq) {
    foreach ($seq['messages'] as $m) {
      $out[] = [
        'message_id' => $m['id'],
        'sequence_id' => $sid,
        'sequence_name' => $seq['name'] ?? $sid,
        'delay_minutes' => $m['delay_minutes'] ?? 0,
        'subject_en' => $m['subject']['en'] ?? '',
        'subject_es' => $m['subject']['es'] ?? '',
        'primary_url' => $m['primary_url'] ?? ''
      ];
    }
  }
  return $out;
}
