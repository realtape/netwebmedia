<?php
@set_time_limit(30);
header('Content-Type: application/json');
function run($cmd) {
  $out=[]; $c=-1; @exec($cmd.' 2>&1', $out, $c);
  return ['cmd'=>$cmd,'code'=>$c,'out'=>implode("\n",array_slice($out,0,30))];
}
$r = [
  'alt_nodejs_all' => run('ls /opt/alt/ | grep -i node'),
  'alt_nodejs_versions' => run('ls -la /opt/alt/alt-nodejs*/root/usr/bin/node 2>&1'),
  'nodejs_usr_local' => run('ls /usr/local/bin/ | grep -iE "node|npm" 2>&1 | head -20'),
  'cpanel_ea_nodejs_full' => run('ls /opt/cpanel/ 2>&1 | grep -i node'),
  'scl_list' => run('scl -l 2>&1 | head -20'),
  'cloudlinux_selector' => run('ls ~/.cl.selector/ 2>&1 | head -5'),
  'find_node' => run('find /opt /usr /bin /root -maxdepth 4 -name "node" -type f 2>/dev/null | head -20'),
  'enable_nodejs11' => run('source /opt/alt/alt-nodejs11/enable && node -v 2>&1'),
  'enable_nodejs11_v2' => run('/opt/alt/alt-nodejs11/root/usr/bin/node -v 2>&1'),
  'selector_info' => run('cat ~/.cl.selector/selector.cfg 2>&1 | head -10'),
  'selector_bin_dir' => run('ls ~/.cl.selector/bin/ 2>&1 | head -10'),
  'nvm_install_test' => run('command -v nvm 2>&1'),
  'bashrc_peek' => run('cat ~/.bashrc 2>&1 | head -20'),
];
echo json_encode($r, JSON_PRETTY_PRINT);
@unlink(__FILE__);
