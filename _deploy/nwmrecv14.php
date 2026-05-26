<?php
// Accept raw zip via POST body, extract it, self-delete.
@set_time_limit(0);
@ini_set('memory_limit', '512M');

$data = file_get_contents('php://input');
if (!$data) { http_response_code(400); echo 'no body'; exit; }

$root = __DIR__;
$tmp = $root . '/_r14.zip';
file_put_contents($tmp, $data);

$zip = new ZipArchive();
if ($zip->open($tmp) !== true) { echo json_encode(['err'=>'bad zip','size'=>strlen($data)]); @unlink($tmp); exit; }
$n = $zip->numFiles;
$zip->extractTo($root);
$zip->close();
@unlink($tmp);

header('Content-Type: application/json');
echo json_encode(['ok'=>true,'extracted'=>$n,'size'=>strlen($data)]);
@unlink(__FILE__);
