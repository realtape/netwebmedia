<?php
/* Bulk-import from CSV — full Chilean dataset (all regions). */
require_once '/home/webmed6/public_html/api/lib/db.php';
@set_time_limit(0);
@ini_set('memory_limit', '512M');

$admin = qOne("SELECT id, email, org_id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1");
if (!$admin) { echo json_encode(['err'=>'no admin']); exit; }
$orgId   = (int)$admin['org_id'];
$ownerId = (int)$admin['id'];

$csv = '/home/webmed6/public_html/_data/all_leads.csv';
if (!file_exists($csv)) { echo json_encode(['err'=>'upload /_data/all_leads.csv first']); exit; }

$regionMap = [
  'arica'=>'Arica y Parinacota','iquique'=>'Tarapacá','alto hospicio'=>'Tarapacá',
  'antofagasta'=>'Antofagasta','calama'=>'Antofagasta',
  'copiapo'=>'Atacama','vallenar'=>'Atacama',
  'la serena'=>'Coquimbo','coquimbo'=>'Coquimbo','ovalle'=>'Coquimbo',
  'valparaiso'=>'Valparaíso','vina del mar'=>'Valparaíso','quilpue'=>'Valparaíso','san antonio'=>'Valparaíso',
  'santiago'=>'Metropolitana','maipu'=>'Metropolitana','puente alto'=>'Metropolitana','la florida'=>'Metropolitana',
  'rancagua'=>"O'Higgins",'san fernando'=>"O'Higgins",
  'talca'=>'Maule','curico'=>'Maule','linares'=>'Maule',
  'chillan'=>'Ñuble',
  'concepcion'=>'Biobío','talcahuano'=>'Biobío','los angeles'=>'Biobío',
  'temuco'=>'La Araucanía','villarrica'=>'La Araucanía','pucon'=>'La Araucanía',
  'valdivia'=>'Los Ríos',
  'osorno'=>'Los Lagos','puerto montt'=>'Los Lagos','castro'=>'Los Lagos',
  'coyhaique'=>'Aysén',
  'punta arenas'=>'Magallanes','puerto natales'=>'Magallanes',
];

function nc($s){ $s=strtolower((string)$s); $s=strtr($s,['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n']); return trim($s); }

$existing = qAll("SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) AS email FROM resources WHERE type='contact' AND org_id = ?", [$orgId]);
$have = [];
foreach ($existing as $e) if (!empty($e['email'])) $have[strtolower($e['email'])] = true;

$fh = fopen($csv, 'r');
if (!$fh) { echo json_encode(['err'=>'cannot open csv']); exit; }
$header = fgetcsv($fh);
// Strip BOM from first column if present
if ($header && isset($header[0])) $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);

$rows = [];
while (($row = fgetcsv($fh)) !== false) {
  if (count($row) !== count($header)) continue;
  $rows[] = array_combine($header, $row);
}
fclose($fh);

$valid = [];
foreach ($rows as $c) {
  $email = strtolower(trim($c['email'] ?? ''));
  if (!$email || $email === 'not found' || strpos($email, '@') === false) continue;
  if (isset($have[$email])) continue;
  $have[$email] = true;   // also dedupe within the source
  $city = nc($c['city'] ?? '');
  $region = $regionMap[$city] ?? 'Otra';
  $notesArr = null;
  if (!empty($c['notes'])) {
    $decoded = json_decode($c['notes'], true);
    if (is_array($decoded)) $notesArr = $decoded;
  }
  if (!$notesArr) {
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i','-', (string)($c['name'] ?? '')));
    $notesArr = ['page' => 'companies/'.$city.'/'.$slug.'.html', 'city' => $city, 'niche' => $c['niche_key'] ?? null];
  }
  $data = [
    'name'    => $c['name'] ?? null,
    'email'   => $c['email'],
    'phone'   => $c['phone'] ?? null,
    'company' => $c['company'] ?? $c['name'] ?? null,
    'website' => $c['website'] ?? null,
    'city'    => $c['city'] ?? null,
    'region'  => $region,
    'niche'   => $c['niche'] ?? null,
    'role'    => $c['role'] ?? null,
    'source'  => 'chile_scrape_2026_all',
    'notes'   => json_encode($notesArr, JSON_UNESCAPED_UNICODE),
  ];
  $valid[] = [
    'title' => $c['name'] ?? $email,
    'slug'  => substr($email, 0, 200),
    'data'  => $data,
    'region'=> $region,
  ];
}

$dry = !isset($_GET['go']) || $_GET['go'] !== '1';
if ($dry) {
  header('Content-Type: application/json');
  echo json_encode([
    'dry_run'=>true,
    'source_rows'=>count($rows),
    'existing_emails_in_org'=>count($existing),
    'will_insert'=>count($valid),
    'by_region'=>array_count_values(array_column($valid, 'region')),
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  exit;
}

$inserted = $failed = 0;
db()->beginTransaction();
try {
  $stmt = db()->prepare("INSERT INTO resources (org_id, type, slug, title, status, data, owner_id) VALUES (?, 'contact', ?, ?, 'lead', ?, ?)");
  foreach ($valid as $v) {
    try {
      $stmt->execute([$orgId, $v['slug'], $v['title'], json_encode($v['data'], JSON_UNESCAPED_UNICODE), $ownerId]);
      $inserted++;
    } catch (Throwable $e) { $failed++; }
  }
  db()->commit();
} catch (Throwable $e) {
  db()->rollBack();
  echo json_encode(['err'=>$e->getMessage()]);
  exit;
}
header('Content-Type: application/json');
echo json_encode(['ok'=>true,'inserted'=>$inserted,'failed'=>$failed,'by_region'=>array_count_values(array_column($valid,'region'))], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
@unlink(__FILE__);
