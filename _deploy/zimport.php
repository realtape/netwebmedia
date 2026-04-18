<?php
/* Bulk-import Chilean contacts into admin org directly via SQL.
   Source: /home/webmed6/public_html/_data/top_fit_prospects.json
   Dry run unless ?go=1
*/
require_once '/home/webmed6/public_html/api/lib/db.php';
@set_time_limit(0);

// Find admin org (the first admin user's org_id)
$admin = qOne("SELECT id, email, org_id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1");
if (!$admin) { echo json_encode(['err' => 'no admin user found']); exit; }
$orgId = (int)$admin['org_id'];
$ownerId = (int)$admin['id'];

// Load JSON (uploaded separately)
$jsonPath = '/home/webmed6/public_html/_data/top_fit_prospects.json';
if (!file_exists($jsonPath)) {
  echo json_encode(['err' => 'data file missing, upload /_data/top_fit_prospects.json first']);
  exit;
}
$raw = file_get_contents($jsonPath);
$items = json_decode($raw, true);
if (!is_array($items)) { echo json_encode(['err' => 'bad json']); exit; }

// Chilean city → region map
$regionMap = [
  'arica' => 'Arica y Parinacota',
  'iquique' => 'Tarapacá', 'alto hospicio' => 'Tarapacá',
  'antofagasta' => 'Antofagasta', 'calama' => 'Antofagasta',
  'copiapo' => 'Atacama', 'vallenar' => 'Atacama',
  'la serena' => 'Coquimbo', 'coquimbo' => 'Coquimbo', 'ovalle' => 'Coquimbo',
  'valparaiso' => 'Valparaíso', 'vina del mar' => 'Valparaíso', 'quilpue' => 'Valparaíso', 'san antonio' => 'Valparaíso',
  'santiago' => 'Metropolitana', 'maipu' => 'Metropolitana', 'puente alto' => 'Metropolitana', 'la florida' => 'Metropolitana',
  'rancagua' => 'O\'Higgins', 'san fernando' => 'O\'Higgins',
  'talca' => 'Maule', 'curico' => 'Maule', 'linares' => 'Maule',
  'chillan' => 'Ñuble',
  'concepcion' => 'Biobío', 'talcahuano' => 'Biobío', 'los angeles' => 'Biobío',
  'temuco' => 'La Araucanía', 'villarrica' => 'La Araucanía', 'pucon' => 'La Araucanía',
  'valdivia' => 'Los Ríos',
  'osorno' => 'Los Lagos', 'puerto montt' => 'Los Lagos', 'castro' => 'Los Lagos',
  'coyhaique' => 'Aysén',
  'punta arenas' => 'Magallanes', 'puerto natales' => 'Magallanes',
];

function normCity($s) {
  $s = strtolower((string)$s);
  $s = strtr($s, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n']);
  return trim($s);
}

// Existing emails in admin org
$existing = qAll("SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) AS email FROM resources WHERE type='contact' AND org_id = ?", [$orgId]);
$have = [];
foreach ($existing as $e) if (!empty($e['email'])) $have[strtolower($e['email'])] = true;

$valid = [];
foreach ($items as $c) {
  if (empty($c['email']) || strtolower($c['email']) === 'not found' || strpos($c['email'], '@') === false) continue;
  $email = strtolower($c['email']);
  if (isset($have[$email])) continue;
  $city = normCity($c['city'] ?? '');
  $region = $regionMap[$city] ?? 'Otra';
  $data = [
    'name'         => $c['name'] ?? null,
    'email'        => $c['email'],
    'phone'        => $c['phone'] ?? null,
    'company'      => $c['company'] ?? $c['name'] ?? null,
    'website'      => $c['website'] ?? null,
    'city'         => $c['city'] ?? null,
    'region'       => $region,
    'niche'        => $c['niche'] ?? null,
    'role'         => $c['role'] ?? null,
    'fit_services' => ($c['nwm_details']['fit_services'] ?? []),
    'pain_points'  => ($c['nwm_details']['pain_points'] ?? []),
    'nwm_score'    => $c['nwm_score'] ?? null,
    'source'       => 'chile_scrape_2026',
    // Preserve the notes.page hint the parallel session expected
    'notes'        => json_encode(['page' => ($c['notes'] ? (json_decode($c['notes'], true)['page'] ?? null) : null) ?? ('companies/'.$city.'/'.strtolower(str_replace(' ','-', (string)($c['name']??''))).'.html')], JSON_UNESCAPED_UNICODE),
  ];
  $valid[] = [
    'title' => $c['name'] ?? $email,
    'slug'  => substr($email, 0, 200),
    'data'  => $data,
    'email' => $email,
    'region'=> $region,
  ];
}

$dry = !isset($_GET['go']) || $_GET['go'] !== '1';
if ($dry) {
  header('Content-Type: application/json');
  echo json_encode([
    'dry_run' => true,
    'admin_user'   => $admin['email'],
    'admin_org_id' => $orgId,
    'existing_in_admin_org' => count($have),
    'source_total' => count($items),
    'will_insert'  => count($valid),
    'first_3'      => array_slice($valid, 0, 3),
    'by_region'    => array_count_values(array_column($valid, 'region')),
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  exit;
}

$inserted = 0; $failed = 0;
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
  echo json_encode(['err' => 'transaction failed: ' . $e->getMessage()]);
  exit;
}

header('Content-Type: application/json');
echo json_encode([
  'ok'            => true,
  'admin_user'    => $admin['email'],
  'admin_org_id'  => $orgId,
  'inserted'      => $inserted,
  'failed'        => $failed,
  'by_region'     => array_count_values(array_column($valid, 'region')),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
@unlink(__FILE__);
