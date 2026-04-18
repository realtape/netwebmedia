<?php
@set_time_limit(30);
header('Content-Type: application/json');

function run($cmd, $timeout = 10) {
  $out = [];
  $code = -1;
  if (function_exists('exec')) {
    @exec($cmd . ' 2>&1', $out, $code);
  }
  return ['cmd'=>$cmd, 'code'=>$code, 'out'=>implode("\n", array_slice($out, 0, 20))];
}

$report = [
  'php_version'   => PHP_VERSION,
  'uname'         => @php_uname(),
  'cwd'           => getcwd(),
  'user'          => @get_current_user(),
  'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? '?',
  'disabled_functions' => ini_get('disable_functions'),
  'open_basedir'  => ini_get('open_basedir'),
  'exec_fn_exists' => function_exists('exec'),
  'shell_exec_fn_exists' => function_exists('shell_exec'),
  'proc_open_fn_exists' => function_exists('proc_open'),
  'passthru_fn_exists' => function_exists('passthru'),
  'popen_fn_exists' => function_exists('popen'),
  'which_node'    => run('which node'),
  'which_npm'     => run('which npm'),
  'node_v'        => run('node -v'),
  'npm_v'         => run('npm -v'),
  'nvm_dir'       => run('ls -la ~/.nvm 2>&1 | head -5'),
  'nodevenv_dir'  => run('ls -la ~/nodevenv 2>&1 | head -5'),
  'home'          => run('echo $HOME'),
  'path'          => run('echo $PATH'),
  'listening_ports' => run('ss -tln 2>&1 | head -10'),
  'ps_node'       => run('ps -ef | grep node | grep -v grep 2>&1 | head -5'),
  'disk_free'     => run('df -h ~ 2>&1 | head -5'),
  'writable_home' => is_writable(getenv('HOME') ?: '/home/webmed6'),
  'can_write_tmp' => is_writable('/tmp'),
  'cpanel_node_avail' => run('ls /opt/cpanel/ea-nodejs* 2>&1 | head -5'),
  'alt_node_paths' => run('ls /opt/alt/alt-nodejs* 2>&1 | head -5'),
  'passenger_version' => run('passenger -v 2>&1 | head -2'),
];

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
@unlink(__FILE__);
