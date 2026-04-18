<?php
@set_time_limit(60);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,-25))];
}
$FF = '/home/webmed6/bin/ffmpeg';
$tmp = '/tmp/ffx_' . uniqid();
@mkdir($tmp);

$steps = [
  'testsrc_libx264' => run("$FF -y -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -c:v libx264 $tmp/x264.mp4 2>&1"),
  'testsrc_libx264_ls' => run("ls -la $tmp/x264.mp4 2>&1"),

  'testsrc_mpeg4' => run("$FF -y -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -c:v mpeg4 $tmp/mpeg4.mp4 2>&1"),
  'testsrc_mpeg4_ls' => run("ls -la $tmp/mpeg4.mp4 2>&1"),

  'testsrc_openh264' => run("$FF -y -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -c:v libopenh264 $tmp/openh264.mp4 2>&1"),

  'testsrc_h264_v4l2m2m' => run("$FF -y -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -c:v h264_v4l2m2m $tmp/v4l2.mp4 2>&1"),

  'ldd_ffmpeg' => run("ldd $FF 2>&1 | head -15"),
  'ffmpeg_encoders' => run("$FF -encoders 2>&1 | grep -iE 'h264|h265|mpeg4|webm|vp9' | head -10"),
];
exec("rm -rf $tmp");
echo json_encode($steps, JSON_PRETTY_PRINT);
@unlink(__FILE__);
