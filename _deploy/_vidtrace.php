<?php
@set_time_limit(60);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,-15))];
}

$tmp = '/home/webmed6/video-tmp/trace' . uniqid();
@mkdir($tmp, 0755, true);
$FF = '/home/webmed6/bin/ffmpeg';
$CV = '/bin/convert';

$steps = [];
$frame = "$tmp/frame.png";

// 1. Build a simple PNG
$steps['build_png'] = run("$CV -size 1080x1920 gradient:'#FF671F'-'#1a1a2e' $frame");
$steps['ls_png'] = run("ls -la $frame");
$steps['identify'] = run("$CV identify $frame");

// 2. Simplest: static image to MP4 (no filters)
$out1 = "$tmp/simple.mp4";
$steps['simple_mp4'] = run("$FF -y -loop 1 -i $frame -t 3 -r 30 -c:v libx264 -preset ultrafast -pix_fmt yuv420p $out1");
$steps['simple_ls'] = run("ls -la $out1 2>&1");

// 3. With -vf scale
$out2 = "$tmp/scaled.mp4";
$steps['scale_mp4'] = run("$FF -y -loop 1 -i $frame -t 3 -r 30 -vf scale=1080:1920 -c:v libx264 -preset ultrafast -pix_fmt yuv420p $out2");
$steps['scale_ls'] = run("ls -la $out2 2>&1");

// 4. With -vf format (to yuv420p via filter instead)
$out3 = "$tmp/fmt.mp4";
$steps['fmt_mp4'] = run("$FF -y -loop 1 -i $frame -t 3 -r 30 -vf format=yuv420p -c:v libx264 -preset ultrafast $out3");
$steps['fmt_ls'] = run("ls -la $out3 2>&1");

// 5. ffmpeg version + codec list
$steps['ff_ver'] = run("$FF -version 2>&1 | head -2");
$steps['ff_codecs'] = run("$FF -codecs 2>&1 | grep -iE 'libx264|png' | head -5");

// cleanup
exec("rm -rf $tmp");

echo json_encode($steps, JSON_PRETTY_PRINT);
@unlink(__FILE__);
