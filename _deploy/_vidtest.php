<?php
@set_time_limit(240);
header('Content-Type: application/json');

require_once '/home/webmed6/public_html/api/lib/video_render.php';

$public_root = '/home/webmed6/public_html/video-out';
@mkdir($public_root, 0755, true);
@chmod($public_root, 0755);

$tests = [
  ['quote-card', [
    'quote'=>'Your brand deserves AI-powered growth.',
    'author'=>'NetWebMedia',
    'brand_color'=>'#FF671F',
  ]],
  ['product-reel', [
    'product_name'=>'NWM CRM',
    'tagline'=>'One dashboard, every lead, zero chaos.',
    'scene1_text'=>'Capture every lead instantly',
    'scene2_text'=>'Automate follow-ups',
    'scene3_text'=>'Close 3x more deals',
    'cta'=>'Link in bio →',
    'brand_color'=>'#8b5cf6',
  ]],
];
$beforeAfter = getenv('SKIP_BA') ? null : ['before-after', [
  'before_label'=>'Before',
  'before_img'=>'https://picsum.photos/id/1015/1080/1920',
  'after_label'=>'After',
  'after_img'=>'https://picsum.photos/id/1025/1080/1920',
  'caption'=>'What a difference one sprint makes.',
  'brand_color'=>'#10b981',
]];
if ($beforeAfter) $tests[] = $beforeAfter;

$results = [];
foreach ($tests as $t) {
  list($tpl, $input) = $t;
  $slug = 'test-' . $tpl . '-' . substr(bin2hex(random_bytes(3)),0,6);
  $out = $public_root . '/' . $slug . '.mp4';
  $r = vr_render($tpl, $input, $out);
  $results[$tpl] = [
    'ok' => $r['ok'],
    'duration_ms' => $r['duration_ms'],
    'output_url' => $r['ok'] ? '/video-out/' . $slug . '.mp4' : null,
    'output_size_bytes' => $r['ok'] && file_exists($out) ? filesize($out) : 0,
    'error' => $r['error'] ?? null,
    'log_tail' => array_slice($r['log'], -3),
  ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
@unlink(__FILE__);
