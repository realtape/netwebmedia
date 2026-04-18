<?php
@set_time_limit(300);
header('Content-Type: application/json');
function run($cmd, $timeout = 180) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,-20))];
}

$steps = [];
$home = getenv('HOME') ?: '/home/webmed6';
$bin  = $home . '/bin';
@mkdir($bin, 0755, true);

// Download static ffmpeg (~80MB) from John Van Sickle's trusted build
$url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
$tar = $home . '/ffmpeg.tar.xz';

$steps['check_existing'] = run("ls -la $bin/ffmpeg 2>&1 | head -3");

if (!file_exists($bin . '/ffmpeg')) {
  $steps['download'] = run("cd $home && curl -sSL -o ffmpeg.tar.xz '$url' && ls -la ffmpeg.tar.xz");
  $steps['extract']  = run("cd $home && tar xf ffmpeg.tar.xz && ls -d ffmpeg-*-static 2>&1");
  $steps['move']     = run("cd $home && mv ffmpeg-*-static/ffmpeg $bin/ffmpeg && mv ffmpeg-*-static/ffprobe $bin/ffprobe && rm -rf ffmpeg-*-static ffmpeg.tar.xz && chmod +x $bin/ffmpeg $bin/ffprobe 2>&1");
}
$steps['final_check'] = run("$bin/ffmpeg -version 2>&1 | head -2");
$steps['ffprobe_check'] = run("$bin/ffprobe -version 2>&1 | head -1");
$steps['home_bin_contents'] = run("ls -la $bin 2>&1");

echo json_encode($steps, JSON_PRETTY_PRINT);
@unlink(__FILE__);
