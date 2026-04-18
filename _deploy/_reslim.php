<?php
@set_time_limit(60);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'tail'=>implode("\n",array_slice($out,-8))];
}
$FF = '/home/webmed6/bin/ffmpeg';

$steps = [
  'ulimits'  => run('ulimit -a 2>&1'),
  'memcheck' => run('cat /proc/self/status | grep -iE "vm|rss" 2>&1 | head -10'),
  // testsrc at 1080x1920 — isolates PNG vs resolution
  'testsrc_1080x1920' => run("$FF -y -f lavfi -i testsrc=duration=2:size=1080x1920:rate=30 -c:v libx264 -preset ultrafast -t 2 /tmp/big_ts.mp4 2>&1"),
  'testsrc_720x1280'  => run("$FF -y -f lavfi -i testsrc=duration=2:size=720x1280:rate=30 -c:v libx264 -preset ultrafast -t 2 /tmp/m_ts.mp4 2>&1"),
  'testsrc_540x960'   => run("$FF -y -f lavfi -i testsrc=duration=2:size=540x960:rate=30 -c:v libx264 -preset ultrafast -t 2 /tmp/s_ts.mp4 2>&1"),
  'testsrc_1080x1920_lowthread' => run("$FF -y -f lavfi -i testsrc=duration=2:size=1080x1920:rate=30 -c:v libx264 -preset ultrafast -threads 1 -tune fastdecode -t 2 /tmp/big_lt.mp4 2>&1"),
  // With explicit profile + level to keep memory low
  'testsrc_1080x1920_baseline' => run("$FF -y -f lavfi -i testsrc=duration=2:size=1080x1920:rate=30 -c:v libx264 -preset ultrafast -profile:v baseline -level 3.1 -threads 1 -x264opts \"no-scenecut:rc-lookahead=1:bframes=0:ref=1\" -t 2 /tmp/big_bl.mp4 2>&1"),
];
echo json_encode($steps, JSON_PRETTY_PRINT);
@unlink(__FILE__);
