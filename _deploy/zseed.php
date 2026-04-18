<?php
/* Seed 5 automation recipes as workflow resources + seed 2 starter knowledge articles + seed 2 A/B tests.
   Idempotent — only inserts if slug not already present. */
require_once '/home/webmed6/public_html/api/lib/db.php';

$admin = qOne("SELECT id, org_id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1");
if (!$admin) { echo json_encode(['err'=>'no admin']); exit; }
$org = (int)$admin['org_id']; $owner = (int)$admin['id'];

$recipes = [
  [
    'slug' => 'audit-nurture',
    'title' => 'Audit → Nurture Sequence',
    'data' => [
      'trigger' => ['type'=>'form_submission','form_id'=>'audit-request'],
      'steps' => [
        ['action'=>'log','message'=>'Audit requested by {{email}}'],
        ['action'=>'wait','minutes'=>10],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Tu auditoría de {{website}} está lista','body'=>'<p>Hola {{name}}, revisamos {{website}}. Abre tu reporte completo aquí.</p>'],
        ['action'=>'wait','minutes'=>2880],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Caso de estudio · 3x leads en 60 días','body'=>'<p>Hola {{name}}, te paso un caso de cómo lo hicimos para otro cliente.</p>'],
        ['action'=>'wait','minutes'=>7200],
        ['action'=>'send_email','to'=>'submitter','subject'=>'¿Agendamos 20 min?','body'=>'<p>Hola {{name}}, ¿hablamos esta semana? Mira mi agenda: https://netwebmedia.com/contact.html</p>'],
      ],
    ],
  ],
  [
    'slug' => 'win-back',
    'title' => 'Subscription Canceled → Win-back',
    'data' => [
      'trigger' => ['type'=>'deal_stage','stage'=>'Churned'],
      'steps' => [
        ['action'=>'wait','minutes'=>1440],
        ['action'=>'send_email','to'=>'submitter','subject'=>'¿Qué podríamos mejorar?','body'=>'<p>Hola {{name}}, nos cuentas qué faltó? 20% de descuento al volver: CÓDIGO NWM20.</p>'],
        ['action'=>'wait','minutes'=>10080],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Última oferta: 30% off por 3 meses','body'=>'<p>Hola {{name}}, última oportunidad. CÓDIGO COMEBACK30.</p>'],
      ],
    ],
  ],
  [
    'slug' => 'abandoned-checkout',
    'title' => 'Abandoned Checkout → Recovery',
    'data' => [
      'trigger' => ['type'=>'form_submission','form_id'=>'checkout-abandoned'],
      'steps' => [
        ['action'=>'wait','minutes'=>60],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Tu plan te espera','body'=>'<p>Hola {{name}}, dejaste tu checkout a medias. Vuelve: https://netwebmedia.com/pricing.html</p>'],
        ['action'=>'wait','minutes'=>1440],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Por esto vale la pena','body'=>'<p>Resumen de lo que incluye {{plan}}: AI 24/7, CRM, automations…</p>'],
      ],
    ],
  ],
  [
    'slug' => 'new-customer-onboarding',
    'title' => 'New Customer → Onboarding',
    'data' => [
      'trigger' => ['type'=>'deal_stage','stage'=>'Won'],
      'steps' => [
        ['action'=>'send_email','to'=>'submitter','subject'=>'¡Bienvenido a NetWebMedia!','body'=>'<p>Hola {{name}}, comenzamos mañana. Aquí tu checklist…</p>'],
        ['action'=>'create_deal','title_tpl'=>'Onboarding: {{name}}','value'=>0],
        ['action'=>'wait','minutes'=>1440],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Día 1: Credenciales y acceso','body'=>'<p>Entra al CRM en https://netwebmedia.com/demo/crm/</p>'],
        ['action'=>'wait','minutes'=>4320],
        ['action'=>'send_email','to'=>'submitter','subject'=>'Día 3: Primera campaña lista','body'=>'<p>Tu primera campaña de marketing está agendada.</p>'],
      ],
    ],
  ],
  [
    'slug' => 'review-request',
    'title' => 'Happy Customer → Review Request',
    'data' => [
      'trigger' => ['type'=>'manual'],
      'steps' => [
        ['action'=>'wait','minutes'=>30],
        ['action'=>'send_email','to'=>'submitter','subject'=>'¿2 minutos para una reseña?','body'=>'<p>Hola {{name}}, si te gustó, déjanos una reseña en Google: https://g.page/netwebmedia/review</p>'],
      ],
    ],
  ],
];

$inserted_wf = 0; $skipped_wf = 0;
foreach ($recipes as $r) {
  $existing = qOne("SELECT id FROM resources WHERE type='workflow' AND slug = ? AND org_id = ?", [$r['slug'], $org]);
  if ($existing) { $skipped_wf++; continue; }
  qExec("INSERT INTO resources (org_id, type, slug, title, status, data, owner_id) VALUES (?, 'workflow', ?, ?, 'active', ?, ?)",
    [$org, $r['slug'], $r['title'], json_encode($r['data'], JSON_UNESCAPED_UNICODE), $owner]);
  $inserted_wf++;
}

// Seed knowledge base starters
db()->exec("CREATE TABLE IF NOT EXISTS knowledge_articles (id INT AUTO_INCREMENT PRIMARY KEY, org_id INT NOT NULL, title VARCHAR(300) NOT NULL, slug VARCHAR(200), body MEDIUMTEXT, tags VARCHAR(400), source VARCHAR(60) DEFAULT 'manual', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY ix_org (org_id), FULLTEXT ix_fts (title, body)) ENGINE=InnoDB");
$kbs = [
  ['title'=>'Servicios de NetWebMedia','body'=>'NetWebMedia ofrece: AI Automations, AI Agents 24/7, CRM completo, CMS AI Websites, Paid Ads managed, AI SEO & Content, Social Media management, CRO, Email Marketing, AEO, AI SDR, Voice Receptionist, Creative Studio, RAG Knowledge, Fractional CMO advisory. Planes desde $47.000 CLP/mes (Starter) a $949.000 CLP/mes (Agency). Pagos por Mercado Pago.','tags'=>'servicios,precios,planes'],
  ['title'=>'Cómo funciona el onboarding','body'=>'Día 0: Firma contrato y setup Mercado Pago. Día 1: acceso a /demo/crm/ y /demo/cms/. Día 3: primera campaña agendada. Día 7: primera reunión de revisión. Todo automatizado por workflows.','tags'=>'onboarding,clientes'],
];
$inserted_kb = 0;
foreach ($kbs as $k) {
  $ex = qOne("SELECT id FROM knowledge_articles WHERE title = ? AND org_id = ?", [$k['title'], $org]);
  if ($ex) continue;
  qExec("INSERT INTO knowledge_articles (org_id, title, body, tags) VALUES (?, ?, ?, ?)", [$org, $k['title'], $k['body'], $k['tags']]);
  $inserted_kb++;
}

// Seed 2 A/B tests
db()->exec("CREATE TABLE IF NOT EXISTS ab_tests (id INT AUTO_INCREMENT PRIMARY KEY, org_id INT NOT NULL, slug VARCHAR(60) NOT NULL UNIQUE, name VARCHAR(200) NOT NULL, hypothesis TEXT, variants JSON NOT NULL, traffic_split JSON, status VARCHAR(20) DEFAULT 'draft', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY ix_org (org_id))");
db()->exec("CREATE TABLE IF NOT EXISTS ab_events (id INT AUTO_INCREMENT PRIMARY KEY, test_id INT NOT NULL, visitor VARCHAR(64) NOT NULL, variant VARCHAR(20) NOT NULL, event VARCHAR(20) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, KEY ix_test (test_id, visitor), KEY ix_event (test_id, event, variant))");
$abs = [
  ['slug'=>'hero-cta','name'=>'Hero CTA copy test','hypothesis'=>'"Ver planes" converts better than "Comienza gratis"','variants'=>[['name'=>'A','cta_text'=>'Ver planes'],['name'=>'B','cta_text'=>'Comienza gratis — 14 días']],'status'=>'running'],
  ['slug'=>'audit-cta','name'=>'Audit CTA color','hypothesis'=>'Orange beats purple on audit page','variants'=>[['name'=>'A','cta_text'=>'Run Deep Audit (Free)'],['name'=>'B','cta_text'=>'Scan My Site Now']],'status'=>'running'],
];
$inserted_ab = 0;
foreach ($abs as $a) {
  $ex = qOne("SELECT id FROM ab_tests WHERE slug = ?", [$a['slug']]);
  if ($ex) continue;
  qExec("INSERT INTO ab_tests (org_id, slug, name, hypothesis, variants, status) VALUES (?, ?, ?, ?, ?, ?)", [$org, $a['slug'], $a['name'], $a['hypothesis'], json_encode($a['variants']), $a['status']]);
  $inserted_ab++;
}

header('Content-Type: application/json');
echo json_encode(['ok'=>true, 'workflows_inserted'=>$inserted_wf, 'workflows_skipped'=>$skipped_wf, 'knowledge_inserted'=>$inserted_kb, 'ab_tests_inserted'=>$inserted_ab], JSON_PRETTY_PRINT);
@unlink(__FILE__);
