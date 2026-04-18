<?php
require_once '/home/webmed6/public_html/api/lib/db.php';

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

function nc($s){
  $s = strtolower(trim((string)$s));
  $s = strtr($s, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n']);
  $s = str_replace(['-','_'], ' ', $s);
  $s = preg_replace('/\s+/', ' ', $s);
  return trim($s);
}

$rows = qAll("SELECT id, data FROM resources WHERE type='contact'");
$fixed = 0; $unresolved = [];
foreach ($rows as $r) {
  $d = json_decode($r['data'], true);
  if (!is_array($d)) continue;
  $city = nc($d['city'] ?? '');
  $currentRegion = $d['region'] ?? null;
  $newRegion = $regionMap[$city] ?? null;
  if (!$newRegion) {
    // Keep existing if we don't know, but track
    if ($city) $unresolved[$city] = ($unresolved[$city] ?? 0) + 1;
    continue;
  }
  if ($currentRegion === $newRegion) continue;
  $d['region'] = $newRegion;
  qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($d, JSON_UNESCAPED_UNICODE), $r['id']]);
  $fixed++;
}

$after = qAll("SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.region')) AS region, COUNT(*) AS n FROM resources WHERE type='contact' GROUP BY region ORDER BY n DESC");

header('Content-Type: application/json');
echo json_encode([
  'fixed'      => $fixed,
  'unresolved_cities' => $unresolved,
  'by_region_now'     => $after,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
@unlink(__FILE__);
