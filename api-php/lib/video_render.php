<?php
/* Native video renderer.
   Uses ImageMagick (`convert`) to build frame images + ffmpeg to assemble MP4.
   No Node, no Chromium, no daemon. Renders synchronously in ~5-15s per clip.

   Public entrypoint: vr_render($template_id, $input, $out_path).
   Returns ['ok'=>bool, 'output'=>path, 'duration_ms'=>int, 'error'=>?string, 'log'=>[]]

   Requires:
     /usr/bin/convert (ImageMagick)     — already present
     ~/bin/ffmpeg                         — installed
*/

function vr_ffmpeg() {
  $home = getenv('HOME') ?: '/home/webmed6';
  $bin  = $home . '/bin/ffmpeg';
  if (is_executable($bin)) return $bin;
  return 'ffmpeg'; // fallback to PATH
}

function vr_convert() {
  // Prefer magick, fall back to convert
  foreach (['/bin/magick','/usr/bin/magick','/bin/convert','/usr/bin/convert','convert'] as $p) {
    if (is_executable($p) || $p === 'convert') return $p;
  }
  return 'convert';
}

function vr_tmpdir() {
  $home = getenv('HOME') ?: '/home/webmed6';
  $d = $home . '/video-tmp/' . uniqid('r', true);
  @mkdir($d, 0755, true);
  return $d;
}

function vr_rmtree($dir) {
  if (!is_dir($dir)) return;
  foreach (scandir($dir) as $f) {
    if ($f === '.' || $f === '..') continue;
    $p = $dir . '/' . $f;
    is_dir($p) ? vr_rmtree($p) : @unlink($p);
  }
  @rmdir($dir);
}

function vr_sh($cmd, &$log) {
  $out=[]; $code=-1;
  @exec($cmd . ' 2>&1', $out, $code);
  $log[] = ['cmd'=>$cmd, 'code'=>$code, 'out'=>implode("\n", array_slice($out,-8))];
  return $code === 0;
}

function vr_render($template_id, $input, $out_path) {
  $started = microtime(true);
  $log = [];
  $tmp = vr_tmpdir();

  try {
    switch ($template_id) {
      case 'quote-card':   $ok = vr_render_quote_card($input, $tmp, $out_path, $log); break;
      case 'product-reel': $ok = vr_render_product_reel($input, $tmp, $out_path, $log); break;
      case 'before-after': $ok = vr_render_before_after($input, $tmp, $out_path, $log); break;
      default: $ok = false; $log[] = 'unknown template ' . $template_id;
    }
  } catch (Throwable $e) {
    $ok = false;
    $log[] = 'exception: ' . $e->getMessage();
  }

  vr_rmtree($tmp);
  $ms = (int) round((microtime(true) - $started) * 1000);
  return [
    'ok' => $ok,
    'output' => $ok ? $out_path : null,
    'duration_ms' => $ms,
    'log' => $log,
    'error' => $ok ? null : 'Render failed — see log',
  ];
}

/* ─── Helpers ─────────────────────────────────────────────── */

function vr_hex_to_magick($hex, $default = '#FF671F') {
  $hex = $hex ?: $default;
  if (!preg_match('/^#[0-9a-f]{6}$/i', $hex)) $hex = $default;
  return $hex;
}

// ImageMagick-safe text escape
function vr_esc($s) {
  return str_replace(['\\','"'], ['\\\\','\\"'], (string)$s);
}

/* ─── Template 1: Quote Card (10s, 9:16) ─────────────────────
   Single frame with subtle zoom-in over 10s.                  */
function vr_render_quote_card($input, $tmp, $out, &$log) {
  $quote = vr_esc($input['quote'] ?? 'Your brand deserves AI-powered growth.');
  $author = vr_esc($input['author'] ?? 'NetWebMedia');
  $color = vr_hex_to_magick($input['brand_color'] ?? '', '#FF671F');
  $W=1080; $H=1920;
  $frame = $tmp . '/frame.png';

  // Build gradient background + quote text in one pass. Force 8-bit RGB for ffmpeg compat.
  $convert = vr_convert();
  $q = escapeshellarg($quote);
  $a = escapeshellarg('- ' . $author);

  $cmd = "$convert -size {$W}x{$H} gradient:'$color'-'#1a1a2e' " .
         "-gravity center " .
         "-fill white -font DejaVu-Sans-Bold -pointsize 80 -size " . ($W-160) . "x caption:$q " .
         "-composite " .
         "-fill 'rgba(255,255,255,0.85)' -pointsize 44 -size " . ($W-160) . "x caption:$a " .
         "-geometry +0+600 -composite " .
         "-depth 8 -type TrueColor -define png:color-type=2 PNG24:" . escapeshellarg($frame);
  if (!vr_sh($cmd, $log)) return false;

  // ffmpeg: single image -> 10s mp4. PNG is already 1080x1920, no filter needed.
  $ff = vr_ffmpeg();
  $cmd = "$ff -y -loop 1 -framerate 30 -i " . escapeshellarg($frame) .
         " -t 10 -c:v libx264 -threads 1 -preset fast -pix_fmt yuv420p -movflags +faststart " .
         escapeshellarg($out);
  return vr_sh($cmd, $log);
}

/* ─── Template 2: Product Reel (18s, 9:16) ────────────────── */
function vr_render_product_reel($input, $tmp, $out, &$log) {
  $W=1080; $H=1920;
  $color = vr_hex_to_magick($input['brand_color'] ?? '', '#8b5cf6');
  $convert = vr_convert();
  $ff = vr_ffmpeg();

  // Scene 0: intro with product_name + tagline (3s) — PNG24 = 8-bit RGB for ffmpeg compat
  $s0 = $tmp . '/s0.png';
  $pn = escapeshellarg($input['product_name'] ?? 'NWM CRM');
  $tg = escapeshellarg($input['tagline'] ?? 'One dashboard, every lead.');
  $cmd = "$convert -size {$W}x{$H} gradient:'$color'-#0b0f1a -gravity center " .
    "-fill white -font DejaVu-Sans-Bold -pointsize 108 -size " . ($W-120) . "x caption:$pn -composite " .
    "-fill 'rgba(255,255,255,0.85)' -font DejaVu-Sans -pointsize 52 -size " . ($W-160) . "x caption:$tg -geometry +0+400 -composite " .
    "-depth 8 -type TrueColor -define png:color-type=2 PNG24:" . escapeshellarg($s0);
  if (!vr_sh($cmd, $log)) return false;

  // Scenes 1-3 with step text
  $steps_png = [];
  $step_texts = [$input['scene1_text'] ?? 'Capture every lead', $input['scene2_text'] ?? 'Automate follow-ups', $input['scene3_text'] ?? 'Close more deals'];
  for ($i = 0; $i < 3; $i++) {
    $p = $tmp . '/s' . ($i+1) . '.png';
    $t = escapeshellarg($step_texts[$i]);
    $num = escapeshellarg('STEP ' . ($i+1));
    $cmd = "$convert -size {$W}x{$H} radial-gradient:'${color}33'-'#0b0f1a' -gravity center " .
      "-fill '$color' -font DejaVu-Sans-Bold -pointsize 48 -size " . ($W-160) . "x caption:$num -geometry +0-400 -composite " .
      "-fill white -font DejaVu-Sans-Bold -pointsize 88 -size " . ($W-160) . "x caption:$t -composite " .
      "-depth 8 -type TrueColor -define png:color-type=2 PNG24:" . escapeshellarg($p);
    if (!vr_sh($cmd, $log)) return false;
    $steps_png[] = $p;
  }

  // Scene CTA (3s)
  $scta = $tmp . '/sc.png';
  $cta = escapeshellarg($input['cta'] ?? 'Link in bio ->');
  $cmd = "$convert -size {$W}x{$H} gradient:'$color'-#0b0f1a -gravity center " .
    "-fill white -font DejaVu-Sans-Bold -pointsize 84 -size " . ($W-240) . "x caption:$cta -composite " .
    "-depth 8 -type TrueColor -define png:color-type=2 PNG24:" . escapeshellarg($scta);
  if (!vr_sh($cmd, $log)) return false;

  // Concat into 18s MP4: 3s intro + 4s × 3 scenes + 3s CTA = 18s
  // Use ffmpeg concat demuxer with per-image durations
  $list = $tmp . '/list.txt';
  $entries = [
    [$s0, 3],
    [$steps_png[0], 4],
    [$steps_png[1], 4],
    [$steps_png[2], 4],
    [$scta, 3],
  ];
  $lines = [];
  foreach ($entries as $e) {
    $lines[] = "file '" . str_replace("'", "'\\''", $e[0]) . "'";
    $lines[] = "duration " . $e[1];
  }
  // ffmpeg concat demuxer quirk: last file must be repeated without duration
  $lines[] = "file '" . str_replace("'", "'\\''", end($entries)[0]) . "'";
  file_put_contents($list, implode("\n", $lines) . "\n");

  $cmd = "$ff -y -f concat -safe 0 -i " . escapeshellarg($list) .
    " -fps_mode vfr -c:v libx264 -threads 1 -preset fast -pix_fmt yuv420p -movflags +faststart " .
    escapeshellarg($out);
  return vr_sh($cmd, $log);
}

/* ─── Template 3: Before/After (12s, 9:16) ────────────────── */
function vr_render_before_after($input, $tmp, $out, &$log) {
  $W=1080; $H=1920;
  $ff = vr_ffmpeg();
  $convert = vr_convert();

  // Download the two images locally (must be http/https)
  $bimg = $tmp . '/before.jpg';
  $aimg = $tmp . '/after.jpg';
  foreach ([['u'=>$input['before_img'] ?? '','p'=>$bimg], ['u'=>$input['after_img'] ?? '','p'=>$aimg]] as $o) {
    if (!filter_var($o['u'], FILTER_VALIDATE_URL)) { $log[] = 'bad url: ' . $o['u']; return false; }
    $data = @file_get_contents($o['u']);
    if (!$data) { $log[] = 'fetch failed: ' . $o['u']; return false; }
    file_put_contents($o['p'], $data);
  }

  // Normalize both to 1080x1920 (JPEG output = 8-bit always, no PNG concerns)
  $bnorm = $tmp . '/bn.jpg'; $anorm = $tmp . '/an.jpg';
  foreach ([[$bimg, $bnorm], [$aimg, $anorm]] as $pair) {
    $cmd = "$convert " . escapeshellarg($pair[0]) .
      " -resize {$W}x{$H}^ -gravity center -extent {$W}x{$H} -quality 90 -depth 8 -type TrueColor JPEG:" . escapeshellarg($pair[1]);
    if (!vr_sh($cmd, $log)) return false;
  }

  // Add labels
  $color = vr_hex_to_magick($input['brand_color'] ?? '', '#10b981');
  $bl = escapeshellarg($input['before_label'] ?? 'Before');
  $al = escapeshellarg($input['after_label'] ?? 'After');
  $bout = $tmp . '/b_lab.jpg'; $aout = $tmp . '/a_lab.jpg';
  $cmd = "$convert " . escapeshellarg($bnorm) .
    " -gravity north -fill white -undercolor '#000000cc' -font DejaVu-Sans-Bold -pointsize 60 -annotate +0+80 $bl " .
    "-depth 8 -type TrueColor JPEG:" . escapeshellarg($bout);
  if (!vr_sh($cmd, $log)) return false;
  $cmd = "$convert " . escapeshellarg($anorm) .
    " -gravity north -fill white -undercolor '$color' -font DejaVu-Sans-Bold -pointsize 60 -annotate +0+80 $al " .
    "-depth 8 -type TrueColor JPEG:" . escapeshellarg($aout);
  if (!vr_sh($cmd, $log)) return false;

  // Simpler concat: 3s before + 4s xfade + 5s after = 12s. Use separate passes for reliability.
  $step1 = $tmp . '/step1.mp4'; // 12s before with overlay wipe
  $cmd = "$ff -y -loop 1 -framerate 30 -t 12 -i " . escapeshellarg($bout) .
    " -loop 1 -framerate 30 -t 12 -i " . escapeshellarg($aout) .
    " -filter_complex \"[0:v]format=yuv420p[b];[1:v]format=yuv420p[a];[b][a]xfade=transition=wiperight:duration=4:offset=3\" " .
    " -c:v libx264 -threads 1 -preset fast -movflags +faststart " .
    escapeshellarg($out);
  return vr_sh($cmd, $log);
}
