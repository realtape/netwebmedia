<?php
@set_time_limit(60);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,-20))];
}
$FF = '/home/webmed6/bin/ffmpeg';
$CV = '/bin/convert';
$tmp = '/tmp/pngx_' . uniqid();
@mkdir($tmp);

// Make a minimal 320x240 PNG with PNG24
$small = "$tmp/small.png";
run("$CV -size 320x240 gradient:'#FF671F'-'#1a1a2e' -depth 8 -type TrueColor -define png:color-type=2 PNG24:$small");

$steps = [
  'small_file'   => run("file $small"),
  'small_size'   => run("ls -la $small"),
  'small_x264'   => run("$FF -y -loop 1 -i $small -t 2 -c:v libx264 $tmp/small.mp4 2>&1"),
  'small_x264_ls'=> run("ls -la $tmp/small.mp4"),
];

// Now big 1080x1920 with PNG24
$big = "$tmp/big.png";
run("$CV -size 1080x1920 gradient:'#FF671F'-'#1a1a2e' -depth 8 -type TrueColor -define png:color-type=2 PNG24:$big");
$steps['big_file']    = run("file $big");
$steps['big_size']    = run("ls -la $big");
$steps['big_x264']    = run("$FF -y -loop 1 -i $big -t 2 -c:v libx264 $tmp/big.mp4 2>&1");
$steps['big_x264_ls'] = run("ls -la $tmp/big.mp4");

// Big with framerate
$steps['big_fr']      = run("$FF -y -loop 1 -framerate 30 -i $big -t 2 -c:v libx264 $tmp/bigfr.mp4 2>&1");
$steps['big_fr_ls']   = run("ls -la $tmp/bigfr.mp4");

// Big explicitly converted via ffmpeg to yuv420p pipe first
$steps['big_two_step']= run("$FF -y -loop 1 -i $big -t 2 -pix_fmt yuv420p -c:v libx264 $tmp/bigy.mp4 2>&1");
$steps['big_two_ls']  = run("ls -la $tmp/bigy.mp4");

exec("rm -rf $tmp");
echo json_encode($steps, JSON_PRETTY_PRINT);
@unlink(__FILE__);
