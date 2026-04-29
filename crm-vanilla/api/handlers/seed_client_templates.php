<?php
/**
 * Seed client-facing email templates — 2 per niche (28 total).
 * These are templates a PAYING CUSTOMER uses to communicate with THEIR OWN clients.
 * Gated: requires_plan = 'starter' (any paid plan unlocks them).
 *
 * POST /api/?r=seed_client_templates&token=NWM_SEED_2026
 */
require_once __DIR__ . '/../lib/tenancy.php';
if ($method !== 'POST') jsonError('Use POST', 405);
if (!hash_equals(SEED_TOKEN, (string)($_GET['token'] ?? ''))) jsonError('Invalid token', 403);
// SECURITY (C2): pin to master — token-gated, never per-org.
pin_org_to_master();

$db = getDB();
$seedOrgId = is_org_schema_applied() ? (current_org_id() ?? ORG_MASTER_ID) : null;

// Shared wrapper — white-label, no NWM branding
function client_wrap(string $content): string {
    return '
<div style="background:#f4f5f7;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <div style="padding:32px 36px;color:#1a1a2e;line-height:1.65">
      ' . $content . '
    </div>
    <div style="background:#f9fafb;padding:20px 36px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px">
      <p style="margin:0">{{company}} · <a href="{{unsubscribe_url}}" style="color:#aaa;text-decoration:underline">Cancelar suscripción</a></p>
    </div>
  </div>
</div>';
}

function client_btn(string $url, string $label): string {
    return '<div style="text-align:center;margin:28px 0">
      <a href="' . $url . '" style="background:#1a1a2e;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;font-size:15px">' . $label . '</a>
    </div>';
}

$templates = [

  /* ── TOURISM ─────────────────────────────────────────────────────── */
  ['name' => '[Tourism] Booking Confirmation', 'niche' => 'tourism',
   'type' => 'client_transactional',
   'subject' => 'Tu reserva está confirmada — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>¡Tu reserva en <strong>{{company}}</strong> está confirmada! Estamos emocionados de recibirte.</p>
     <p>Si necesitas modificar fechas o tienes alguna consulta especial, responde este correo y te ayudamos de inmediato.</p>
     <p>¡Hasta pronto!</p>
     <p><strong>El equipo de {{company}}</strong></p>
   ')],

  ['name' => '[Tourism] Post-Stay Follow-Up', 'niche' => 'tourism',
   'type' => 'client_marketing',
   'subject' => '¿Cómo fue tu estadía, {{first_name}}? — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Esperamos que tu estadía en <strong>{{company}}</strong> haya superado tus expectativas.</p>
     <p>Tu opinión nos ayuda a mejorar y orienta a otros viajeros. ¿Nos dejas una reseña rápida?</p>' .
     client_btn('#', 'Dejar reseña en Google →') . '
     <p>Además, como cliente especial, tienes un <strong>10% de descuento</strong> en tu próxima reserva directa. Úsalo cuando quieras.</p>
     <p>¡Hasta la próxima visita!<br><strong>{{company}}</strong></p>
   ')],

  /* ── RESTAURANTS ─────────────────────────────────────────────────── */
  ['name' => '[Restaurants] Reservation Confirmation', 'niche' => 'restaurants',
   'type' => 'client_transactional',
   'subject' => 'Tu reserva en {{company}} está confirmada',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Tu mesa en <strong>{{company}}</strong> está reservada. ¡Te esperamos!</p>
     <p>Si necesitas cambiar el horario o el número de personas, contáctanos con anticipación y lo ajustamos sin problema.</p>
     <p>¡Buen provecho de antemano!<br><strong>El equipo de {{company}}</strong></p>
   ')],

  ['name' => '[Restaurants] Loyalty Offer', 'niche' => 'restaurants',
   'type' => 'client_marketing',
   'subject' => 'Un regalo para ti, {{first_name}} 🍽',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Como uno de nuestros clientes más fieles, queremos invitarte con un beneficio exclusivo de <strong>{{company}}</strong>.</p>
     <p>Esta semana, presenta este correo y obtienes <strong>un postre de cortesía</strong> en tu próxima visita.</p>' .
     client_btn('#', 'Reservar mesa ahora →') . '
     <p>¡Nos vemos pronto!<br><strong>{{company}}</strong></p>
   ')],

  /* ── HEALTH ──────────────────────────────────────────────────────── */
  ['name' => '[Health] Appointment Reminder', 'niche' => 'health',
   'type' => 'client_transactional',
   'subject' => 'Recordatorio de tu cita — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Te recordamos que tienes una cita programada en <strong>{{company}}</strong>.</p>
     <p>Si necesitas reprogramar o cancelar, por favor avísanos con al menos 24 horas de anticipación para que podamos ofrecer el horario a otro paciente.</p>
     <p>¡Te esperamos!<br><strong>El equipo de {{company}}</strong></p>
   ')],

  ['name' => '[Health] Preventive Care Reminder', 'niche' => 'health',
   'type' => 'client_marketing',
   'subject' => '{{first_name}}, es hora de tu control preventivo',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>En <strong>{{company}}</strong> nos preocupamos por tu salud más allá de las consultas de urgencia.</p>
     <p>Han pasado varios meses desde tu última visita — te recomendamos agendar tu control preventivo para estar al día.</p>' .
     client_btn('#', 'Agendar mi control →') . '
     <p>¡Tu salud es nuestra prioridad!<br><strong>{{company}}</strong></p>
   ')],

  /* ── BEAUTY ──────────────────────────────────────────────────────── */
  ['name' => '[Beauty] Appointment Reminder', 'niche' => 'beauty',
   'type' => 'client_transactional',
   'subject' => 'Tu cita en {{company}} es pronto, {{first_name}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Te recordamos tu próxima cita en <strong>{{company}}</strong>. ¡Ya casi es tu momento!</p>
     <p>Si necesitas cambiar o cancelar, avísanos con anticipación para que podamos reservar tu hora para otra clienta.</p>
     <p>¡Hasta pronto!<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Beauty] Rebooking Nudge', 'niche' => 'beauty',
   'type' => 'client_marketing',
   'subject' => '{{first_name}}, ¿ya tienes tu próxima cita?',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Han pasado unas semanas desde tu última visita a <strong>{{company}}</strong> y queremos verte de nuevo. 💅</p>
     <p>Agenda ahora y elige el horario que más te acomode — los cupos vuelan.</p>' .
     client_btn('#', 'Reservar mi hora →') . '
     <p>¡Te esperamos!<br><strong>El equipo de {{company}}</strong></p>
   ')],

  /* ── SMB ─────────────────────────────────────────────────────────── */
  ['name' => '[SMB] Quote Follow-Up', 'niche' => 'smb',
   'type' => 'client_transactional',
   'subject' => 'Tu cotización de {{company}} — ¿alguna duda?',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Hace unos días te enviamos una cotización desde <strong>{{company}}</strong> y quería asegurarme de que la recibiste.</p>
     <p>Si tienes alguna pregunta sobre los servicios, los plazos o el presupuesto, responde este correo y lo conversamos sin compromiso.</p>
     <p>Saludos,<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[SMB] Client Check-In', 'niche' => 'smb',
   'type' => 'client_marketing',
   'subject' => '¿Cómo van las cosas, {{first_name}}?',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>En <strong>{{company}}</strong> nos gusta mantenernos en contacto con nuestros clientes más allá de las facturas.</p>
     <p>¿Hay algo nuevo en tu negocio en lo que podamos ayudarte? Nuevos proyectos, expansión, o simplemente una consulta — estamos aquí.</p>
     <p>¡Un saludo y mucho éxito!<br><strong>{{company}}</strong></p>
   ')],

  /* ── LAW FIRMS ───────────────────────────────────────────────────── */
  ['name' => '[Law] Consultation Confirmation', 'niche' => 'law_firms',
   'type' => 'client_transactional',
   'subject' => 'Tu consulta en {{company}} está confirmada',
   'html' => client_wrap('
     <p>Estimado/a <strong>{{first_name}}</strong>,</p>
     <p>Confirmamos su consulta con <strong>{{company}}</strong>. Por favor llegue 5 minutos antes con su documento de identidad.</p>
     <p>Si necesita reprogramar, contáctenos lo antes posible para asignar a otro cliente el horario.</p>
     <p>Atentamente,<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Law] Case Status Update', 'niche' => 'law_firms',
   'type' => 'client_transactional',
   'subject' => 'Actualización de su caso — {{company}}',
   'html' => client_wrap('
     <p>Estimado/a <strong>{{first_name}}</strong>,</p>
     <p>Queremos informarle sobre el avance de su caso en <strong>{{company}}</strong>.</p>
     <p>Nuestro equipo está trabajando en su expediente. Si tiene documentos adicionales o preguntas, responda este correo y nos ponemos en contacto a la brevedad.</p>
     <p>Gracias por su confianza.<br><strong>{{company}}</strong></p>
   ')],

  /* ── REAL ESTATE ─────────────────────────────────────────────────── */
  ['name' => '[Real Estate] New Listing Alert', 'niche' => 'real_estate',
   'type' => 'client_marketing',
   'subject' => 'Nueva propiedad que te podría interesar, {{first_name}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>En <strong>{{company}}</strong> acabamos de publicar una propiedad que encaja con tu búsqueda.</p>
     <p>Las mejores oportunidades del mercado se van rápido — te invitamos a revisarla antes de que sea tarde.</p>' .
     client_btn('#', 'Ver propiedad →') . '
     <p>¿Tienes preguntas? Responde este correo y te contactamos hoy.<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Real Estate] Market Update', 'niche' => 'real_estate',
   'type' => 'client_marketing',
   'subject' => 'Reporte de mercado inmobiliario — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Desde <strong>{{company}}</strong> te enviamos nuestro resumen mensual del mercado inmobiliario local.</p>
     <p>El precio promedio por m² y los tiempos de venta han variado este mes. Si estás pensando en vender o comprar, este es un buen momento para conversar.</p>' .
     client_btn('#', 'Ver reporte completo →') . '
     <p>¡Que tengas una excelente semana!<br><strong>{{company}}</strong></p>
   ')],

  /* ── LOCAL SPECIALIST ────────────────────────────────────────────── */
  ['name' => '[Local] Job Completion Confirmation', 'niche' => 'local_specialist',
   'type' => 'client_transactional',
   'subject' => 'Trabajo completado — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>El trabajo solicitado ha sido completado por el equipo de <strong>{{company}}</strong>.</p>
     <p>Si tienes alguna consulta sobre el trabajo realizado o necesitas un servicio adicional, responde este correo o llámanos.</p>
     <p>¡Gracias por elegirnos!<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Local] Service Due Reminder', 'niche' => 'local_specialist',
   'type' => 'client_marketing',
   'subject' => '{{first_name}}, es hora de tu mantención anual',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Desde <strong>{{company}}</strong> te recordamos que es época de realizar la mantención de rutina.</p>
     <p>Agenda ahora y evita problemas inesperados — nuestros técnicos tienen disponibilidad esta semana.</p>' .
     client_btn('#', 'Agendar mantención →') . '
     <p>¡Gracias por confiar en nosotros!<br><strong>{{company}}</strong></p>
   ')],

  /* ── AUTOMOTIVE ──────────────────────────────────────────────────── */
  ['name' => '[Automotive] Service Appointment Reminder', 'niche' => 'automotive',
   'type' => 'client_transactional',
   'subject' => 'Recordatorio: tu turno en {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Te recordamos tu turno en <strong>{{company}}</strong>. Por favor llega puntual para que podamos atenderte sin demoras.</p>
     <p>Si necesitas reprogramar, avísanos con al menos 2 horas de anticipación.</p>
     <p>¡Te esperamos!<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Automotive] Vehicle Ready for Pickup', 'niche' => 'automotive',
   'type' => 'client_transactional',
   'subject' => 'Tu vehículo está listo, {{first_name}} 🚗',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>¡Tu vehículo está listo para ser retirado en <strong>{{company}}</strong>!</p>
     <p>Puedes pasar a buscarlo en nuestro horario de atención. Si tienes alguna duda sobre el trabajo realizado, nuestro equipo estará encantado de explicarte.</p>
     <p>¡Hasta pronto!<br><strong>{{company}}</strong></p>
   ')],

  /* ── EDUCATION ───────────────────────────────────────────────────── */
  ['name' => '[Education] Enrollment Confirmation', 'niche' => 'education',
   'type' => 'client_transactional',
   'subject' => '¡Bienvenido/a a {{company}}, {{first_name}}!',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>¡Tu matrícula en <strong>{{company}}</strong> ha sido confirmada! Estamos muy contentos de tenerte con nosotros.</p>
     <p>En los próximos días recibirás información sobre horarios, materiales y acceso a nuestra plataforma. ¿Tienes alguna pregunta? Responde este correo.</p>
     <p>¡Bienvenido/a al equipo!<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Education] Course Progress Nudge', 'niche' => 'education',
   'type' => 'client_marketing',
   'subject' => '{{first_name}}, ¿cómo va tu aprendizaje?',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Desde <strong>{{company}}</strong> queremos saber cómo va tu avance. Los estudiantes que revisan su material regularmente tienen 3× más probabilidades de completar el programa.</p>
     <p>Si tienes dudas o necesitas apoyo adicional, nuestros tutores están disponibles. ¡No te rindas!</p>' .
     client_btn('#', 'Continuar mi aprendizaje →') . '
     <p>¡Mucho ánimo!<br><strong>{{company}}</strong></p>
   ')],

  /* ── EVENTS & WEDDINGS ───────────────────────────────────────────── */
  ['name' => '[Events] Booking Confirmation', 'niche' => 'events_weddings',
   'type' => 'client_transactional',
   'subject' => '¡Tu evento está confirmado! — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>¡Estamos emocionados! Tu evento con <strong>{{company}}</strong> está oficialmente confirmado.</p>
     <p>Nuestro equipo de planificación se pondrá en contacto contigo pronto para coordinar los detalles. ¡Va a ser un evento increíble!</p>
     <p>Con entusiasmo,<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Events] Planning Milestone Update', 'niche' => 'events_weddings',
   'type' => 'client_transactional',
   'subject' => 'Actualización de planificación — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Queremos mantenerte informado/a sobre el avance de la planificación de tu evento en <strong>{{company}}</strong>.</p>
     <p>Hemos completado varios hitos importantes. Si tienes nuevas ideas o cambios que considerar, este es el momento ideal para conversarlos.</p>' .
     client_btn('#', 'Revisar mi planificación →') . '
     <p>¡Estamos contando los días!<br><strong>{{company}}</strong></p>
   ')],

  /* ── FINANCIAL SERVICES ──────────────────────────────────────────── */
  ['name' => '[Finance] Quarterly Review Invite', 'niche' => 'financial_services',
   'type' => 'client_marketing',
   'subject' => 'Tu revisión trimestral — {{company}}',
   'html' => client_wrap('
     <p>Estimado/a <strong>{{first_name}}</strong>,</p>
     <p>Desde <strong>{{company}}</strong> le invitamos a su revisión trimestral de cartera.</p>
     <p>Este encuentro nos permite ajustar su estrategia a las condiciones actuales del mercado y asegurarnos de que sigue avanzando hacia sus objetivos financieros.</p>' .
     client_btn('#', 'Agendar mi revisión →') . '
     <p>Atentamente,<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Finance] Tax Season Reminder', 'niche' => 'financial_services',
   'type' => 'client_marketing',
   'subject' => 'Temporada tributaria — {{company}} le ayuda',
   'html' => client_wrap('
     <p>Estimado/a <strong>{{first_name}}</strong>,</p>
     <p>Se acerca la temporada de declaración de impuestos y en <strong>{{company}}</strong> queremos asegurarnos de que esté preparado/a.</p>
     <p>Contáctenos ahora para coordinar la recopilación de documentos y evitar apuros de último momento.</p>' .
     client_btn('#', 'Coordinar mi declaración →') . '
     <p>Atentamente,<br><strong>{{company}}</strong></p>
   ')],

  /* ── HOME SERVICES ───────────────────────────────────────────────── */
  ['name' => '[Home] Quote Follow-Up', 'niche' => 'home_services',
   'type' => 'client_transactional',
   'subject' => 'Tu cotización de {{company}} — ¿tienes dudas?',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Te enviamos una cotización hace unos días desde <strong>{{company}}</strong> y quería asegurarme de que la recibiste correctamente.</p>
     <p>Si tienes preguntas sobre el alcance del trabajo, los materiales o el plazo, responde este correo y te aclaro todo.</p>
     <p>Saludos,<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Home] Seasonal Maintenance Reminder', 'niche' => 'home_services',
   'type' => 'client_marketing',
   'subject' => 'Prepara tu hogar para la temporada — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>El cambio de temporada es el mejor momento para revisar tu hogar. Desde <strong>{{company}}</strong> te recomendamos una mantención preventiva antes de que lleguen las lluvias / el calor.</p>
     <p>¡Los cupos se llenan rápido! Agenda ahora y garantiza tu horario.</p>' .
     client_btn('#', 'Agendar mantención →') . '
     <p>¡Hasta pronto!<br><strong>{{company}}</strong></p>
   ')],

  /* ── WINE & AGRICULTURE ──────────────────────────────────────────── */
  ['name' => '[Wine] New Vintage Release', 'niche' => 'wine_agriculture',
   'type' => 'client_marketing',
   'subject' => 'Nueva cosecha disponible — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>¡El momento que esperabas! La nueva cosecha de <strong>{{company}}</strong> ya está disponible.</p>
     <p>Como cliente especial, tienes acceso anticipado antes de que lo anunciemos al público general. Las cajas tienen cupo limitado.</p>' .
     client_btn('#', 'Reservar mi cosecha →') . '
     <p>¡Salud!<br><strong>{{company}}</strong></p>
   ')],

  ['name' => '[Wine] Harvest Event Invitation', 'niche' => 'wine_agriculture',
   'type' => 'client_marketing',
   'subject' => 'Te invitamos a la vendimia — {{company}}',
   'html' => client_wrap('
     <p>Hola <strong>{{first_name}}</strong>,</p>
     <p>Es temporada de vendimia en <strong>{{company}}</strong> y queremos que seas parte de esta experiencia única.</p>
     <p>Te invitamos a vivir la cosecha de primera mano: recorrido por el viñedo, cata y maridaje en plena naturaleza.</p>' .
     client_btn('#', 'Reservar mi lugar →') . '
     <p>¡Te esperamos entre los viñedos!<br><strong>{{company}}</strong></p>
   ')],

];

// Ensure columns exist (idempotent)
try {
    $db->exec("ALTER TABLE email_templates
        ADD COLUMN IF NOT EXISTS requires_plan ENUM('starter','professional','enterprise') NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) NOT NULL DEFAULT 'nwm_outbound'");
} catch (Throwable $e) { /* columns may already exist */ }

$inserted = 0; $skipped = 0; $errs = [];
if ($seedOrgId !== null) {
    $stmt = $db->prepare(
        "INSERT INTO email_templates (organization_id, name, subject, body_html, from_name, from_email, niche, template_type, requires_plan)
         VALUES (?, ?, ?, ?, 'Su Empresa', 'info@suempresa.com', ?, ?, 'starter')"
    );
} else {
    $stmt = $db->prepare(
        "INSERT INTO email_templates (name, subject, body_html, from_name, from_email, niche, template_type, requires_plan)
         VALUES (?, ?, ?, 'Su Empresa', 'info@suempresa.com', ?, ?, 'starter')"
    );
}

foreach ($templates as $t) {
    if ($seedOrgId !== null) {
        $exists = $db->prepare("SELECT id FROM email_templates WHERE name = ? AND organization_id = ? LIMIT 1");
        $exists->execute([$t['name'], $seedOrgId]);
    } else {
        $exists = $db->prepare("SELECT id FROM email_templates WHERE name = ? LIMIT 1");
        $exists->execute([$t['name']]);
    }
    if ($exists->fetchColumn()) { $skipped++; continue; }
    try {
        if ($seedOrgId !== null) {
            $stmt->execute([$seedOrgId, $t['name'], $t['subject'], $t['html'], $t['niche'], $t['type']]);
        } else {
            $stmt->execute([$t['name'], $t['subject'], $t['html'], $t['niche'], $t['type']]);
        }
        $inserted++;
    } catch (Throwable $e) {
        $errs[] = $t['name'] . ': ' . $e->getMessage();
    }
}

$total = (int)$db->query("SELECT COUNT(*) FROM email_templates")->fetchColumn();
$paid  = (int)$db->query("SELECT COUNT(*) FROM email_templates WHERE requires_plan IS NOT NULL")->fetchColumn();

jsonResponse([
    'inserted'          => $inserted,
    'skipped'           => $skipped,
    'errors'            => $errs,
    'total_templates'   => $total,
    'paid_only_count'   => $paid,
]);
