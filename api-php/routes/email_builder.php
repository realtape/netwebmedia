<?php
/**
 * Email builder — block-based email templates with server-side HTML rendering.
 *
 * Stores a JSON tree of blocks per template; renders to email-safe HTML on demand
 * (table-based, inline styles, single 600px column). Compatible with Gmail,
 * Outlook, Apple Mail.
 *
 * Routes (all auth):
 *   GET    /api/email-builder/templates             — list saved templates
 *   POST   /api/email-builder/templates             — create
 *   GET    /api/email-builder/templates/{id}        — fetch (blocks + rendered html)
 *   PUT    /api/email-builder/templates/{id}        — update
 *   DELETE /api/email-builder/templates/{id}        — delete
 *   POST   /api/email-builder/render                — render arbitrary blocks → HTML (preview)
 *   POST   /api/email-builder/test-send             — render + send test to one address
 *
 * Block types:
 *   heading     {text, level (h1..h3), align}
 *   paragraph   {text, align}
 *   button      {text, url, align, color}
 *   image       {src, alt, link?, width?}
 *   divider     {}
 *   spacer      {height}
 *   columns     {left:[blocks], right:[blocks]}
 *
 * All text fields support {{merge_tags}} resolved at send time via mailer's
 * render_template. Image src + button url are validated.
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/mailer.php';

function eb_ensure_schema() {
  static $done = false; if ($done) return;
  db()->exec("CREATE TABLE IF NOT EXISTS email_builder_templates (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    org_id      INT NOT NULL DEFAULT 1,
    user_id     INT DEFAULT NULL,
    name        VARCHAR(150) NOT NULL,
    subject     VARCHAR(255) DEFAULT NULL,
    blocks      JSON NOT NULL,
    preheader   VARCHAR(255) DEFAULT NULL,
    settings    JSON DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_org (org_id, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $done = true;
}

function route_email_builder($parts, $method) {
  eb_ensure_schema();
  $user = requireAuth();
  $sub = $parts[0] ?? null;

  if ($sub === 'templates') {
    $id = isset($parts[1]) && ctype_digit((string)$parts[1]) ? (int)$parts[1] : null;
    if ($id) {
      if ($method === 'GET')    return eb_get($id, $user);
      if ($method === 'PUT')    return eb_update($id, $user);
      if ($method === 'DELETE') return eb_delete($id, $user);
      err('Method not allowed', 405);
    }
    if ($method === 'GET')  return eb_list($user);
    if ($method === 'POST') return eb_create($user);
  }
  if ($sub === 'render' && $method === 'POST')    return eb_render_endpoint($user);
  if ($sub === 'test-send' && $method === 'POST') return eb_test_send($user);

  err('Email builder route not found', 404);
}

function eb_list($user) {
  $rows = qAll(
    "SELECT id, name, subject, preheader, created_at, updated_at FROM email_builder_templates WHERE org_id = ? ORDER BY id DESC",
    [(int)($user['org_id'] ?? 1)]
  );
  json_out(['templates' => $rows]);
}

function eb_get($id, $user) {
  $row = qOne("SELECT * FROM email_builder_templates WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Template not found', 404);
  $row['blocks']   = json_decode($row['blocks'], true);
  $row['settings'] = $row['settings'] ? json_decode($row['settings'], true) : null;
  $row['html']     = eb_render_blocks($row['blocks'], $row['settings'] ?? [], ['preheader' => $row['preheader']]);
  json_out(['template' => $row]);
}

function eb_create($user) {
  $b = body();
  if (empty($b['name'])) err('name is required');
  $blocks = $b['blocks'] ?? [];
  if (!is_array($blocks)) err('blocks must be an array');
  qExec(
    "INSERT INTO email_builder_templates (org_id, user_id, name, subject, blocks, preheader, settings)
     VALUES (?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      trim($b['name']),
      $b['subject'] ?? null,
      json_encode($blocks),
      $b['preheader'] ?? null,
      isset($b['settings']) ? json_encode($b['settings']) : null,
    ]
  );
  json_out(['ok' => true, 'id' => lastId()], 201);
}

function eb_update($id, $user) {
  $row = qOne("SELECT id FROM email_builder_templates WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Template not found', 404);
  $b = body();
  $sets = []; $params = [];
  foreach (['name','subject','blocks','preheader','settings'] as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if ($k === 'blocks' || $k === 'settings') $v = $v === null ? null : json_encode($v);
    $sets[] = "$k = ?"; $params[] = $v;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE email_builder_templates SET " . implode(', ', $sets) . " WHERE id = ?", $params);
  json_out(['ok' => true]);
}

function eb_delete($id, $user) {
  $row = qOne("SELECT id FROM email_builder_templates WHERE id = ? AND org_id = ?", [$id, (int)($user['org_id'] ?? 1)]);
  if (!$row) err('Template not found', 404);
  qExec("DELETE FROM email_builder_templates WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function eb_render_endpoint($user) {
  $b = body();
  $blocks = $b['blocks'] ?? [];
  $settings = $b['settings'] ?? [];
  $vars = $b['vars'] ?? [];
  $html = eb_render_blocks($blocks, $settings, ['preheader' => $b['preheader'] ?? null], $vars);
  json_out(['ok' => true, 'html' => $html]);
}

function eb_test_send($user) {
  $b = body();
  $to = trim((string)($b['to'] ?? ''));
  if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) err('Valid `to` email is required');
  $subject = trim((string)($b['subject'] ?? '(no subject)'));
  $blocks = $b['blocks'] ?? [];
  $settings = $b['settings'] ?? [];
  $vars = $b['vars'] ?? [];
  $html = eb_render_blocks($blocks, $settings, ['preheader' => $b['preheader'] ?? null], $vars);

  if (function_exists('send_mail')) {
    $res = send_mail($to, $subject, $html);
    json_out(['ok' => true, 'sent' => true, 'detail' => $res]);
  }
  json_out(['ok' => true, 'sent' => false, 'reason' => 'send_mail() not available; HTML returned for review', 'html' => $html]);
}

/* ─────────────────────  RENDER  ───────────────────── */

function eb_render_blocks($blocks, $settings = [], $meta = [], $vars = []) {
  $bg       = $settings['bg_color']      ?? '#f4f4f7';
  $bodyBg   = $settings['body_bg']       ?? '#ffffff';
  $color    = $settings['text_color']    ?? '#1a1a2e';
  $linkColor= $settings['link_color']    ?? '#FF671F';
  $width    = (int)($settings['width']   ?? 600);
  $brand    = $settings['brand_name']    ?? 'NetWebMedia';
  $preheader= $meta['preheader']         ?? '';

  $inner = '';
  foreach ((array)$blocks as $blk) {
    $inner .= eb_render_block($blk, $linkColor, $color, $vars);
  }

  $hidden = $preheader ? '<div style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">' . eb_apply_vars($preheader, $vars) . '</div>' : '';

  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . htmlspecialchars((string)($settings['title'] ?? $brand), ENT_QUOTES) . '</title></head>' .
         '<body style="margin:0;padding:0;background:' . htmlspecialchars($bg, ENT_QUOTES) . ';font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:' . htmlspecialchars($color, ENT_QUOTES) . ';">' .
           $hidden .
           '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:' . htmlspecialchars($bg, ENT_QUOTES) . ';padding:24px 0;">' .
             '<tr><td align="center">' .
               '<table role="presentation" width="' . $width . '" cellspacing="0" cellpadding="0" border="0" style="max-width:' . $width . 'px;background:' . htmlspecialchars($bodyBg, ENT_QUOTES) . ';border-radius:12px;overflow:hidden;">' .
                 $inner .
               '</table>' .
             '</td></tr>' .
           '</table>' .
         '</body></html>';
}

function eb_render_block($blk, $linkColor, $color, $vars) {
  if (!is_array($blk) || empty($blk['type'])) return '';
  switch ($blk['type']) {
    case 'heading':   return eb_render_heading($blk, $color, $vars);
    case 'paragraph': return eb_render_paragraph($blk, $color, $linkColor, $vars);
    case 'button':    return eb_render_button($blk, $vars);
    case 'image':     return eb_render_image($blk, $vars);
    case 'divider':   return '<tr><td style="padding:8px 24px"><hr style="border:none;border-top:1px solid #e3e5ee;margin:0"></td></tr>';
    case 'spacer':    $h = max(0, (int)($blk['height'] ?? 16)); return '<tr><td style="height:' . $h . 'px;line-height:' . $h . 'px;font-size:0">&nbsp;</td></tr>';
    case 'columns':   return eb_render_columns($blk, $linkColor, $color, $vars);
  }
  return '';
}

function eb_render_heading($blk, $color, $vars) {
  $text = eb_apply_vars((string)($blk['text'] ?? ''), $vars);
  $align = in_array(($blk['align'] ?? 'left'), ['left','center','right'], true) ? $blk['align'] : 'left';
  $level = in_array(($blk['level'] ?? 'h1'), ['h1','h2','h3'], true) ? $blk['level'] : 'h1';
  $size  = ['h1' => '28px', 'h2' => '22px', 'h3' => '18px'][$level];
  return '<tr><td style="padding:18px 24px 6px;text-align:' . $align . '">' .
         '<' . $level . ' style="margin:0;font:700 ' . $size . " /1.2 Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:" . htmlspecialchars($color, ENT_QUOTES) . '">' .
         htmlspecialchars($text, ENT_QUOTES) .
         '</' . $level . '></td></tr>';
}

function eb_render_paragraph($blk, $color, $linkColor, $vars) {
  $text = eb_apply_vars((string)($blk['text'] ?? ''), $vars);
  $align = in_array(($blk['align'] ?? 'left'), ['left','center','right'], true) ? $blk['align'] : 'left';
  // Basic auto-link: convert URLs to anchors. Escape first.
  $safe = htmlspecialchars($text, ENT_QUOTES);
  $safe = preg_replace_callback('/(https?:\\/\\/\\S+)/', function ($m) use ($linkColor) {
    return '<a href="' . $m[1] . '" style="color:' . htmlspecialchars($linkColor, ENT_QUOTES) . ';text-decoration:underline">' . $m[1] . '</a>';
  }, $safe);
  // Preserve newlines
  $safe = nl2br($safe);
  return '<tr><td style="padding:6px 24px;text-align:' . $align . '">' .
         '<p style="margin:0;font:400 15px/1.55 Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:' . htmlspecialchars($color, ENT_QUOTES) . '">' .
         $safe . '</p></td></tr>';
}

function eb_render_button($blk, $vars) {
  $text = eb_apply_vars((string)($blk['text'] ?? 'Click here'), $vars);
  $url  = eb_apply_vars((string)($blk['url']  ?? '#'), $vars);
  if (!preg_match('#^(https?://|mailto:|tel:|#)#i', $url)) $url = 'https://' . ltrim($url, '/');
  $align = in_array(($blk['align'] ?? 'center'), ['left','center','right'], true) ? $blk['align'] : 'center';
  $bg = $blk['color']     ?? '#FF671F';
  $fg = $blk['fg']        ?? '#ffffff';
  return '<tr><td style="padding:14px 24px" align="' . $align . '">' .
         '<a href="' . htmlspecialchars($url, ENT_QUOTES) . '" target="_blank" style="display:inline-block;background:' . htmlspecialchars($bg, ENT_QUOTES) . ';color:' . htmlspecialchars($fg, ENT_QUOTES) . ';font:700 14px Inter,Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:8px">' .
         htmlspecialchars($text, ENT_QUOTES) . '</a></td></tr>';
}

function eb_render_image($blk, $vars) {
  $src = eb_apply_vars((string)($blk['src'] ?? ''), $vars);
  if (!filter_var($src, FILTER_VALIDATE_URL)) return '';
  $alt = htmlspecialchars((string)($blk['alt'] ?? ''), ENT_QUOTES);
  $w = isset($blk['width']) ? (int)$blk['width'] : 0;
  $widthAttr = $w > 0 ? (' width="' . $w . '"') : '';
  $img = '<img src="' . htmlspecialchars($src, ENT_QUOTES) . '" alt="' . $alt . '"' . $widthAttr . ' style="display:block;max-width:100%;height:auto;border:0">';
  if (!empty($blk['link'])) {
    $link = eb_apply_vars((string)$blk['link'], $vars);
    $img = '<a href="' . htmlspecialchars($link, ENT_QUOTES) . '" target="_blank" style="display:inline-block">' . $img . '</a>';
  }
  return '<tr><td style="padding:8px 24px" align="center">' . $img . '</td></tr>';
}

function eb_render_columns($blk, $linkColor, $color, $vars) {
  $left  = is_array($blk['left']  ?? null) ? $blk['left']  : [];
  $right = is_array($blk['right'] ?? null) ? $blk['right'] : [];
  $renderSide = function ($side) use ($linkColor, $color, $vars) {
    $h = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">';
    foreach ($side as $b) $h .= eb_render_block($b, $linkColor, $color, $vars);
    $h .= '</table>';
    return $h;
  };
  return '<tr><td style="padding:8px 24px">' .
           '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">' .
             '<tr>' .
               '<td valign="top" style="width:50%;padding-right:8px">' . $renderSide($left)  . '</td>' .
               '<td valign="top" style="width:50%;padding-left:8px">'  . $renderSide($right) . '</td>' .
             '</tr>' .
           '</table>' .
         '</td></tr>';
}

function eb_apply_vars($text, $vars) {
  if (!is_array($vars) || !$vars) return $text;
  $rendered = render_template($text, $vars);
  // render_template encodes for HTML; we want raw text-with-merge here, so decode entities back.
  return html_entity_decode($rendered, ENT_QUOTES, 'UTF-8');
}
