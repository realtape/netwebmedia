const fs = require('fs');
const b64 = fs.readFileSync('_deploy/netwebmedia-update-v10.zip').toString('base64');
const php = `<?php
header('Content-Type: text/plain');
$b64 = '${b64}';
$zip_path = __DIR__ . '/v10.zip';
file_put_contents($zip_path, base64_decode($b64));
echo 'wrote zip: ' . filesize($zip_path) . " bytes\\n";
$z = new ZipArchive();
if ($z->open($zip_path) !== true) { echo "open fail\\n"; exit; }
echo 'entries: ' . $z->numFiles . "\\n";
for ($i = 0; $i < $z->numFiles; $i++) echo '  + ' . $z->getNameIndex($i) . "\\n";
$z->extractTo(__DIR__);
$z->close();
echo "EXTRACTED OK\\n";
@unlink($zip_path);
foreach ([__DIR__.'/api/index.php', __DIR__.'/api/migrate.php', __DIR__.'/login.html'] as $f) {
  echo (file_exists($f) ? '  OK   ' : '  MISS ') . $f . "\\n";
}
@unlink(__FILE__);
echo "DONE (self-deleted)\\n";
`;
fs.writeFileSync('_deploy/v10-inline.php', php);
console.log('wrote', php.length, 'bytes');
