<?php
/**
 * Seed 8 niche-specific email drip templates (idempotent — INSERT IGNORE by name).
 * Token-protected. Safe to re-run.
 *
 * POST /api/?r=seed_templates&token=NWM_SEED_2026
 */
if ($method !== 'POST') jsonError('Use POST', 405);
if (!hash_equals(SEED_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);

$db = getDB();

// Common header/footer styling for branded feel
$HDR = '<div style="background:linear-gradient(135deg,#FF6B00,#ff4e00);padding:24px;border-radius:12px 12px 0 0;color:#fff;text-align:center"><div style="font-size:22px;font-weight:800;letter-spacing:.5px">NetWebMedia</div><div style="font-size:13px;opacity:.9;margin-top:4px">Chile · Digital Growth Partners</div></div>';
$FTR = '<div style="background:#f6f7fb;padding:20px;border-radius:0 0 12px 12px;text-align:center;color:#666;font-size:12px;border-top:1px solid #eee"><p>NetWebMedia · Santiago, Chile · <a href="https://netwebmedia.com" style="color:#FF6B00">netwebmedia.com</a></p><p style="margin-top:6px"><a href="{{unsubscribe_url}}" style="color:#999;text-decoration:underline">Unsubscribe</a></p></div>';

function body_block(string $content): string {
    return '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a2e;line-height:1.6"><div style="background:#fff;padding:32px;border-left:1px solid #eee;border-right:1px solid #eee">' . $content . '</div></div>';
}

// Master template factory — gives each niche a consistent 1st-touch email
function niche_email(string $niche, string $hook, string $pain, string $cta): array {
    global $HDR, $FTR;
    $body =
      "<p>Hola <strong>{{first_name}}</strong>,</p>" .
      "<p>{$hook}</p>" .
      "<p>Revisando <strong>{{company}}</strong> en <strong>{{city}}</strong> nos detuvimos en algo que vemos una y otra vez en {$niche}: <em>{$pain}</em></p>" .
      "<p>Preparamos una auditoría digital gratuita de {{company}} — incluye puntaje 0-100, comparación con el promedio del rubro, y proyección de ingresos a 90 días.</p>" .
      "<div style='text-align:center;margin:28px 0'>" .
      "<a href='{{page_url}}' style='background:#FF6B00;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block'>Ver auditoría de {{company}} →</a>" .
      "</div>" .
      "<p>{$cta}</p>" .
      "<p>Un abrazo,<br><strong>Equipo NetWebMedia</strong><br><a href='mailto:hola@netwebmedia.com' style='color:#FF6B00'>hola@netwebmedia.com</a> · <a href='https://netwebmedia.com' style='color:#FF6B00'>netwebmedia.com</a></p>";
    return [
      'subject' => "{{company}} — auditoría digital gratuita ({{city}})",
      'html'    => '<div style="background:#f6f7fb;padding:24px">' . '<div style="max-width:600px;margin:0 auto">' . $HDR . body_block($body) . $FTR . '</div></div>',
    ];
}

$templates = [
  ['name' => 'Tourism — Intro (Day 0)', 'niche' => 'tourism',
   'email' => niche_email('turismo y hotelería',
     'Estamos auditando los 50 prospectos de turismo más interesantes en su región.',
     'hoteles que pierden 15-18% de cada reserva en comisiones de OTAs porque no tienen booking propio',
     'Si tiene 20 minutos esta semana, le muestro exactamente cómo recuperar esas comisiones con un AI Booking Agent propio.')],

  ['name' => 'Restaurants — Intro (Day 0)', 'niche' => 'restaurants',
   'email' => niche_email('gastronomía',
     'Estoy revisando 50 restaurantes y cafés en su región — su ficha saltó a la vista.',
     'locales con ficha de Google Business vacía o sin fotos: reciben 42% menos llamadas que los competidores',
     'Armemos un call de 20 minutos y le muestro la diferencia exacta que haría una optimización GBP + Reels semanales.')],

  ['name' => 'Health — Intro (Day 0)', 'niche' => 'health',
   'email' => niche_email('salud',
     'Vi su ficha mientras auditaba 50 clínicas y profesionales de salud en su región.',
     'el 58% de los pacientes abandona la reserva si no puede auto-agendar online',
     'En 20 minutos le muestro cómo un widget de agendamiento + CRM de pacientes eleva la tasa de conversión 30-40%.')],

  ['name' => 'Beauty — Intro (Day 0)', 'niche' => 'beauty',
   'email' => niche_email('belleza y bienestar',
     'Estoy revisando 50 salones y centros de estética de su región.',
     'locales sin TikTok pierden entero el público menor de 30 — y los que tienen booking online retienen 3× más clientes',
     'Si le interesa, en 20 minutos armamos el plan: Reels + booking + CRM, listos en 14 días.')],

  ['name' => 'SMB — Intro (Day 0)', 'niche' => 'smb',
   'email' => niche_email('pymes',
     'Acabamos de auditar 50 pymes en su región y nos gustaría compartir lo que encontramos en {{company}}.',
     'el 71% de las pymes chilenas todavía no tiene un sitio web moderno: ventaja enorme para quien llegue primero',
     'Con 20 minutos le muestro el sitio + Google Business + CRM que entregamos típicamente en 14 días por $997/mes.')],

  ['name' => 'Law Firms — Intro (Day 0)', 'niche' => 'law_firms',
   'email' => niche_email('servicios legales',
     'Estamos auditando los 50 estudios jurídicos más relevantes de su región.',
     'despachos con email @gmail en el letterhead pierden autoridad y cobran honorarios 25-40% menores',
     'Si desea, armamos un call de 20 minutos — le muestro cómo LinkedIn + CRM + casos de estudio cierran 2.3× más retainers corporativos.')],

  ['name' => 'Real Estate — Intro (Day 0)', 'niche' => 'real_estate',
   'email' => niche_email('inmobiliario',
     'Estamos auditando 50 corredoras e inmobiliarias en su región.',
     'listings con tour 3D venden 31% más rápido y cierran 9% sobre precio de lista',
     'En 20 minutos le muestro el sitio con buscador + CRM + tours 3D que entregamos en 21 días.')],

  ['name' => 'Local Specialist — Intro (Day 0)', 'niche' => 'local_specialist',
   'email' => niche_email('servicios locales',
     'Estamos auditando 50 especialistas locales (electricistas, gasfíteres, climatización) en su región.',
     'el 67% de las búsquedas "cerca de mí" convierte en 24h — sin Google Maps optimizado, esos clientes se van a la competencia',
     'Con 20 minutos armamos la optimización de Maps + booking + automación SMS que típicamente duplica las citas en 30 días.')],

  ['name' => 'Automotive — Intro (Day 0)', 'niche' => 'automotive',
   'email' => niche_email('automotriz',
     'Estamos auditando las 50 empresas automotrices más relevantes de su región.',
     'talleres sin sistema de turnos online pierden el 25% de los clientes que llaman fuera de horario — y sin recordatorio SMS, la tasa de no-shows supera el 30%',
     'En 20 minutos le muestro cómo un sitio con agendamiento de turnos + recordatorio automático + CRM de clientes reduce los no-shows y aumenta la recurrencia.')],

  ['name' => 'Education — Intro (Day 0)', 'niche' => 'education',
   'email' => niche_email('educación',
     'Estamos auditando los 50 centros educativos y academias más relevantes de su región.',
     'instituciones sin proceso de matrícula digital pierden el 40% de los interesados en el primer contacto — la mayoría elige al competidor que responde en menos de 5 minutos',
     'En 20 minutos le muestro cómo digitalizar la captación de alumnos con un funnel automatizado que responde al instante y convierte interesados en matrículas.')],

  ['name' => 'Events & Weddings — Intro (Day 0)', 'niche' => 'events_weddings',
   'email' => niche_email('eventos y bodas',
     'Estamos auditando los 50 organizadores de eventos y venues más destacados de su región.',
     'organizadores sin portafolio online ni formulario de cotización pierden el 60% de las consultas antes de responder — los clientes contratan al primero que impresiona',
     'En 20 minutos le muestro el sitio con portafolio visual + cotizador automático + CRM de seguimiento que convierte consultas en contratos firmados.')],

  ['name' => 'Financial Services — Intro (Day 0)', 'niche' => 'financial_services',
   'email' => niche_email('servicios financieros',
     'Estamos auditando los 50 asesores financieros y contadores más activos de su región.',
     'el 78% de las búsquedas de servicios financieros termina en una llamada — sin presencia digital profesional, la mayoría de esos prospectos calificados nunca lo encuentran',
     'En 20 minutos le muestro cómo un sitio profesional + Google Business optimizado + CRM de clientes convierte búsquedas en consultas calificadas y retainers.')],

  ['name' => 'Home Services — Intro (Day 0)', 'niche' => 'home_services',
   'email' => niche_email('servicios para el hogar',
     'Estamos auditando las 50 empresas de servicios para el hogar más activas de su región.',
     'contratistas sin presencia en Google Maps pierden el 70% de las búsquedas de emergencia — y sin cotizador online, el 45% de los presupuestos solicitados nunca se cierra',
     'En 20 minutos le muestro cómo Maps + cotizador digital + CRM de seguimiento llena la agenda de trabajos sin necesidad de publicidad costosa.')],

  ['name' => 'Wine & Agriculture — Intro (Day 0)', 'niche' => 'wine_agriculture',
   'email' => niche_email('vitivinicultura y agricultura',
     'Estamos auditando las 50 viñas y productores agrícolas más destacados de su región.',
     'productores que venden solo a distribuidores pierden el 40-60% del margen — la venta directa online es el canal que más crece en el sector vitivinícola regional',
     'En 20 minutos le muestro cómo un sitio con e-commerce + reservas de visita a la viña + email marketing convierte visitantes en compradores recurrentes y fidelizados.')],
];

$inserted = 0; $skipped = 0; $errs = [];
$stmt = $db->prepare("INSERT INTO email_templates (name, subject, body_html, from_name, from_email, niche) VALUES (?, ?, ?, 'NetWebMedia', 'newsletter@netwebmedia.com', ?)");

foreach ($templates as $t) {
    try {
        // Skip if already present by name
        $exists = $db->prepare("SELECT id FROM email_templates WHERE name = ? LIMIT 1");
        $exists->execute([$t['name']]);
        if ($exists->fetchColumn()) { $skipped++; continue; }
        $stmt->execute([$t['name'], $t['email']['subject'], $t['email']['html'], $t['niche']]);
        $inserted++;
    } catch (Throwable $e) {
        $errs[] = $t['name'] . ': ' . $e->getMessage();
    }
}

$total = (int)$db->query("SELECT COUNT(*) FROM email_templates")->fetchColumn();
jsonResponse(['inserted' => $inserted, 'skipped' => $skipped, 'errors' => $errs, 'total_templates' => $total]);
