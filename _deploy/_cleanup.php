<?php
$root = '/home/webmed6/public_html/';
$gone = [];
foreach (['_probe.php','_opreset.php'] as $f) {
  if (file_exists($root.$f)) { unlink($root.$f); $gone[]=$f; }
}
header('Content-Type: application/json');
echo json_encode(['removed'=>$gone]);
@unlink(__FILE__);
