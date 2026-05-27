<?php
// Fetch v14 zip and extract
@set_time_limit(0);
@ini_set('memory_limit', '512M');
$url = 'https://temp.sh/tDojh/nwm-v14.zip';
$root = __DIR__;
$tmp = $root . '/_v14.zip';

$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>1, CURLOPT_FOLLOWLOCATION=>1, CURLOPT_TIMEOUT=>120, CURLOPT_SSL_VERIFYPEER=>0]);
$data = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$data) { echo json_encode(['err'=>'download failed', 'code'=>$httpCode]); @unlink(__FILE__); exit; }
file_put_contents($tmp, $data);

$zip = new ZipArchive();
if ($zip->open($tmp) !== true) { echo json_encode(['err'=>'bad zip', 'size'=>strlen($data)]); @unlink($tmp); @unlink(__FILE__); exit; }
$n = $zip->numFiles;
$zip->extractTo($root);
$zip->close();
@unlink($tmp);

header('Content-Type: application/json');
echo json_encode(['ok'=>true, 'extracted'=>$n, 'size'=>strlen($data)]);
@unlink(__FILE__);
