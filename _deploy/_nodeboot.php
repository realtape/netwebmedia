<?php
@set_time_limit(120);
header('Content-Type: application/json');
function run($cmd, $env = null) {
  $out = []; $c = -1;
  if ($env) {
    $cmd = $env . ' ' . $cmd;
  }
  @exec($cmd . ' 2>&1', $out, $c);
  return ['cmd'=>$cmd, 'code'=>$c, 'out'=>implode("\n", array_slice($out,0,60))];
}

$r = [
  'selectorctl_list' => run('selectorctl --list --interpreter=nodejs 2>&1'),
  'selectorctl_summary' => run('selectorctl --summary --interpreter=nodejs 2>&1'),
  'selectorctl_user' => run('selectorctl --user-current --interpreter=nodejs 2>&1'),
  'selectorctl_set_20' => run('selectorctl --set-user-current=20 --interpreter=nodejs 2>&1'),
  'selectorctl_after' => run('selectorctl --user-current --interpreter=nodejs 2>&1'),
  'nodevenv_ls' => run('ls -la ~/nodevenv 2>&1 | head -10'),
  'cagefs_node' => run('ls /usr/local/lib/ruby/ 2>/dev/null; ls -la /var/cagefs 2>&1 | head -5'),
  // Try wrapper script approach
  'alt22_wrapper_exists' => run('ls -la /opt/alt/alt-nodejs22/enable /opt/alt/alt-nodejs20/enable 2>&1'),
  'alt20_node_lib' => run('ls /opt/alt/alt-nodejs20/root/usr/lib64/ 2>&1 | head -20'),
  'alt22_node_direct_with_ld' => run('LD_LIBRARY_PATH=/opt/alt/alt-nodejs22/root/usr/lib64 /opt/alt/alt-nodejs22/root/usr/bin/node -v 2>&1'),
  'alt20_node_direct_with_ld' => run('LD_LIBRARY_PATH=/opt/alt/alt-nodejs20/root/usr/lib64 /opt/alt/alt-nodejs20/root/usr/bin/node -v 2>&1'),
  'alt18_node_direct_with_ld' => run('LD_LIBRARY_PATH=/opt/alt/alt-nodejs18/root/usr/lib64 /opt/alt/alt-nodejs18/root/usr/bin/node -v 2>&1'),
  'ea_nodejs_search' => run('rpm -qa | grep -iE "node|cagefs" 2>&1 | head -10'),
  'nvm_install_try' => run('which curl; curl --version 2>&1 | head -2'),
];
echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
