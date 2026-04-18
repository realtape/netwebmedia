<?php
@set_time_limit(120);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,0,40))];
}
$r = [
  'cloudlinux_selector_help'   => run('cloudlinux-selector --help 2>&1 | head -30'),
  'cloudlinux_selector_list'   => run('cloudlinux-selector list --json --interpreter nodejs 2>&1 | head -40'),
  'cloudlinux_selector_set22'  => run('cloudlinux-selector set --json --interpreter nodejs --version 22 2>&1 | head -30'),
  'cloudlinux_selector_current'=> run('cloudlinux-selector get --json --interpreter nodejs --current 2>&1'),
  'cloudlinux_selector_create' => run('cloudlinux-selector create --json --interpreter nodejs --version 22 --app-root nwm-video-factory --app-uri video-factory --domain netwebmedia.com 2>&1 | head -30'),
];
echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
