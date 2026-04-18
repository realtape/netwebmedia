<?php
@set_time_limit(120);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,0,40))];
}

$NODE = '/opt/alt/alt-nodejs22/root/usr/bin/node';
$NPM  = '/opt/alt/alt-nodejs22/root/usr/bin/npm';
$LD   = 'LD_LIBRARY_PATH=/opt/alt/alt-nodejs22/root/usr/lib64';

$r = [
  'ffmpeg' => run('which ffmpeg && ffmpeg -version 2>&1 | head -2'),
  'ffmpeg_alt' => run('ls /usr/bin/ffmpeg /usr/local/bin/ffmpeg 2>&1'),
  'imagemagick' => run('which convert && convert --version 2>&1 | head -2'),
  'fontconfig_libs' => run('ls /usr/lib64/libfontconfig.so* 2>&1 | head -3'),
  'nss_libs' => run('ls /usr/lib64/libnss3.so* 2>&1'),
  'gtk_libs' => run('ls /usr/lib64/libgtk-3.so* /usr/lib64/libgbm.so* 2>&1 | head -5'),
  'x11_libs' => run('ls /usr/lib64/libX11.so* /usr/lib64/libXrandr.so* 2>&1 | head -5'),
  'atk_libs' => run('ls /usr/lib64/libatk* 2>&1 | head -3'),
  'mesa_libs' => run('ls /usr/lib64/libEGL.so* /usr/lib64/libGL.so* 2>&1 | head -5'),
  'sample_chromium' => run('find / -name "chrome*" -type f 2>/dev/null | head -10'),
  'node22_npm_version' => run("$LD $NPM -v"),
  'node22_which' => run("$LD $NODE -e \"console.log(process.versions)\""),
];
echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
