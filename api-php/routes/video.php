<?php
/* Remotion video factory endpoints.
   GET  /api/video/templates     list available templates
   POST /api/video/render        enqueue a render job
   GET  /api/video/jobs          list jobs for current org
   GET  /api/video/jobs/{id}     get a single job
*/
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function vid_templates() {
  return [
    [
      'id' => 'quote-card',
      'name' => 'Quote Card Reel',
      'aspect' => '9:16',
      'duration_s' => 10,
      'fields' => [
        ['key'=>'quote',     'label'=>'Quote text (under 140 chars)', 'type'=>'text',   'required'=>true],
        ['key'=>'author',    'label'=>'Author name',                   'type'=>'text',   'required'=>true],
        ['key'=>'brand_color','label'=>'Brand hex (e.g. #FF671F)',     'type'=>'color',  'required'=>false, 'default'=>'#FF671F'],
        ['key'=>'logo_url',  'label'=>'Logo URL (optional)',           'type'=>'url',    'required'=>false],
      ],
    ],
    [
      'id' => 'product-reel',
      'name' => 'Product Reel (3 scenes)',
      'aspect' => '9:16',
      'duration_s' => 18,
      'fields' => [
        ['key'=>'product_name', 'label'=>'Product name',    'type'=>'text',   'required'=>true],
        ['key'=>'tagline',      'label'=>'One-line hook',   'type'=>'text',   'required'=>true],
        ['key'=>'scene1_text',  'label'=>'Scene 1 bullet',  'type'=>'text',   'required'=>true],
        ['key'=>'scene2_text',  'label'=>'Scene 2 bullet',  'type'=>'text',   'required'=>true],
        ['key'=>'scene3_text',  'label'=>'Scene 3 bullet',  'type'=>'text',   'required'=>true],
        ['key'=>'cta',          'label'=>'Call-to-action',  'type'=>'text',   'required'=>true, 'default'=>'Link in bio'],
        ['key'=>'brand_color',  'label'=>'Brand hex',       'type'=>'color',  'required'=>false, 'default'=>'#8b5cf6'],
      ],
    ],
    [
      'id' => 'before-after',
      'name' => 'Before / After',
      'aspect' => '9:16',
      'duration_s' => 12,
      'fields' => [
        ['key'=>'before_label', 'label'=>'Before label',   'type'=>'text',  'required'=>true, 'default'=>'Before'],
        ['key'=>'before_img',   'label'=>'Before image URL','type'=>'url',   'required'=>true],
        ['key'=>'after_label',  'label'=>'After label',    'type'=>'text',  'required'=>true, 'default'=>'After'],
        ['key'=>'after_img',    'label'=>'After image URL', 'type'=>'url',   'required'=>true],
        ['key'=>'caption',      'label'=>'Caption',        'type'=>'text',  'required'=>false],
        ['key'=>'brand_color',  'label'=>'Brand hex',      'type'=>'color', 'required'=>false, 'default'=>'#10b981'],
      ],
    ],
  ];
}

function vid_ensure_schema() {
  qExec("CREATE TABLE IF NOT EXISTS video_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT,
    template_id VARCHAR(64) NOT NULL,
    status ENUM('queued','rendering','complete','failed') NOT NULL DEFAULT 'queued',
    input_json JSON,
    output_url VARCHAR(500),
    error TEXT,
    duration_ms INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX (org_id), INDEX (status)
  )");
}

function route_video($parts, $method) {
  vid_ensure_schema();

  // GET /api/video/templates  (public, lightweight)
  if (($parts[0] ?? '') === 'templates' && $method === 'GET') {
    json_out(['items' => vid_templates()]);
  }

  // POST /api/video/render  (authed)
  if (($parts[0] ?? '') === 'render' && $method === 'POST') {
    $user = requirePaidAccess();
    $b = required(['template_id','input']);
    $tpl = null;
    foreach (vid_templates() as $t) if ($t['id'] === $b['template_id']) { $tpl = $t; break; }
    if (!$tpl) err('Unknown template', 400);

    // Validate required fields
    foreach ($tpl['fields'] as $f) {
      if (!empty($f['required']) && empty($b['input'][$f['key']])) {
        err('Missing required field: ' . $f['key'], 400);
      }
    }

    qExec(
      "INSERT INTO video_jobs (org_id, user_id, template_id, status, input_json, created_at, updated_at)
       VALUES (?, ?, ?, 'queued', ?, NOW(), NOW())",
      [$user['org_id'], $user['id'], $b['template_id'], json_encode($b['input'])]
    );
    $id = lastId();

    // Kick off render asynchronously (fire-and-forget HTTP call to renderer).
    // In production, this would be an AWS Lambda invoke or a Node worker queue.
    // For now we mark as queued and leave a cron/worker to pick it up.
    vid_try_sync_render($id, $tpl, $b['input']);

    $job = qOne('SELECT * FROM video_jobs WHERE id = ?', [$id]);
    json_out(['ok'=>true, 'job'=>$job], 201);
  }

  // GET /api/video/jobs  (authed)
  if (($parts[0] ?? '') === 'jobs' && empty($parts[1]) && $method === 'GET') {
    $user = requirePaidAccess();
    $rows = qAll('SELECT * FROM video_jobs WHERE org_id = ? ORDER BY id DESC LIMIT 100', [$user['org_id']]);
    json_out(['items' => $rows]);
  }

  // GET /api/video/jobs/{id}
  if (($parts[0] ?? '') === 'jobs' && !empty($parts[1]) && $method === 'GET') {
    $user = requirePaidAccess();
    $row = qOne('SELECT * FROM video_jobs WHERE id = ? AND org_id = ?', [(int)$parts[1], $user['org_id']]);
    if (!$row) err('Job not found', 404);
    json_out($row);
  }

  err('Video route not found', 404);
}

/* Native synchronous renderer via PHP + ImageMagick + ffmpeg.
   No Node/Chromium needed. Renders in ~5-15s per clip on this host.
   Output lands in /home/webmed6/public_html/video-out/{slug}.mp4
   and is served publicly as /video-out/{slug}.mp4. */
function vid_try_sync_render($job_id, $tpl, $input) {
  require_once __DIR__ . '/../lib/video_render.php';

  qExec("UPDATE video_jobs SET status='rendering', updated_at=NOW() WHERE id=?", [$job_id]);

  $public_root = '/home/webmed6/public_html/video-out';
  @mkdir($public_root, 0755, true);
  $slug = $tpl['id'] . '-' . $job_id . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
  $out_path = $public_root . '/' . $slug . '.mp4';
  $public_url = '/video-out/' . $slug . '.mp4';

  $res = vr_render($tpl['id'], $input, $out_path);

  if (!empty($res['ok']) && file_exists($out_path) && filesize($out_path) > 0) {
    qExec("UPDATE video_jobs SET status='complete', output_url=?, duration_ms=?, updated_at=NOW() WHERE id=?",
          [$public_url, (int)$res['duration_ms'], $job_id]);
  } else {
    $err = ($res['error'] ?? 'render_failed') . ' | log: ' . substr(json_encode($res['log'] ?? []), 0, 900);
    qExec("UPDATE video_jobs SET status='failed', error=?, duration_ms=?, updated_at=NOW() WHERE id=?",
          [$err, (int)($res['duration_ms'] ?? 0), $job_id]);
  }
}
