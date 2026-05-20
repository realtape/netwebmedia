<?php
/* Public routes — no auth required */
/* Rev: 2026-04-21 public-chat (unified KB) dispatch at line ~306. */

require_once __DIR__ . '/../lib/mailer.php';
require_once __DIR__ . '/../lib/workflows.php';
require_once __DIR__ . '/../lib/ratelimit.php';

function route_public($parts, $method) {
  $sub = $parts[0] ?? null;

  // /api/public/forms/submit — body: {form_id, data}
  if ($sub === 'forms' && ($parts[1] ?? null) === 'submit' && $method === 'POST') {
    $b = required(['form_id', 'data']);
    if (!is_array($b['data'])) err('data must be an object');

    // Rate limit: 10 submissions per IP per hour, file-backed sliding window.
    // Cheap, no Redis dependency, survives PHP-FPM worker restarts.
    // Real attacker traffic gets throttled; legit users almost never trip it.
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $rlDir = __DIR__ . '/../data/ratelimit';
    if (!is_dir($rlDir)) { @mkdir($rlDir, 0700, true); }
    $rlFile = $rlDir . '/' . hash('sha256', $ip) . '.json';
    $now = time();
    $window = 3600; // 1 hour
    $maxReqs = 10;
    $hits = [];
    if (file_exists($rlFile)) {
      $raw = @file_get_contents($rlFile);
      $decoded = $raw ? json_decode($raw, true) : null;
      if (is_array($decoded)) $hits = $decoded;
    }
    // Drop entries outside the window
    $hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t >= $now - $window));
    if (count($hits) >= $maxReqs) {
      // 429 with Retry-After hint based on the oldest hit in the window
      $oldest = min($hits);
      $retryAfter = max(1, $window - ($now - $oldest));
      header('Retry-After: ' . $retryAfter);
      err('Too many submissions from this IP. Try again in ' . ceil($retryAfter / 60) . ' minutes.', 429);
    }
    $hits[] = $now;
    @file_put_contents($rlFile, json_encode($hits), LOCK_EX);

    // Honeypot: any non-empty value in these hidden fields = bot. Respond 200 so
    // the bot doesn't adapt, but skip all downstream work (DB, contact, automations).
    foreach (['nwm_website', 'hp_website', 'honeypot'] as $hp) {
      if (!empty($b['data'][$hp])) {
        echo json_encode(['ok' => true, 'submission_id' => 0]);
        return;
      }
    }

    // form_id may be numeric id or slug
    if (is_numeric($b['form_id'])) {
      $form = qOne("SELECT * FROM resources WHERE type='form' AND id = ?", [(int)$b['form_id']]);
      if (!$form) err('Form not found', 404);
    } else {
      $form = qOne("SELECT * FROM resources WHERE type='form' AND slug = ?", [$b['form_id']]);
      // Self-heal: if a slug-based submission arrives for a form that hasn't been seeded yet
      // (e.g. contact-main on a fresh DB), auto-create the resource so the lead is captured
      // instead of silently 404-ing. This makes the public form endpoint robust against
      // seed/migration drift between the static site and the CRM DB.
      if (!$form) {
        $autoTitle = ucwords(str_replace(['-', '_'], ' ', preg_replace('/[^a-z0-9_\-]/i', '', $b['form_id'])));
        if ($autoTitle === '') $autoTitle = 'Auto-created form';
        try {
          qExec(
            "INSERT INTO resources (org_id, type, slug, title, status, data) VALUES (1, 'form', ?, ?, 'active', ?)",
            [$b['form_id'], $autoTitle, json_encode(['auto_created' => true, 'created_via' => 'public_submit', 'first_seen' => date('c')])]
          );
          $form = qOne("SELECT * FROM resources WHERE type='form' AND slug = ?", [$b['form_id']]);
        } catch (Throwable $e) {
          // If the insert races or fails, fall through to the 404 — log and move on.
          error_log('Auto-create form resource failed for slug ' . $b['form_id'] . ': ' . $e->getMessage());
        }
      }
      if (!$form) err('Form not found', 404);
    }
    $formId = (int) $form['id'];
    $orgId  = (int) $form['org_id'];

    qExec(
      "INSERT INTO form_submissions (org_id, form_id, data, ip) VALUES (?, ?, ?, ?)",
      [$orgId, $formId, json_encode($b['data']), $_SERVER['REMOTE_ADDR'] ?? '']
    );
    $submissionId = lastId();

    // Build context for automations
    $formTitle = $form['title'] ?? ('Form #' . $formId);
    $ctx = array_merge($b['data'], [
      'form_id'       => $formId,
      'form_title'    => $formTitle,
      'submission_id' => $submissionId,
      'submitted_at'  => date('Y-m-d H:i:s'),
      'ip'            => $_SERVER['REMOTE_ADDR'] ?? '',
      'email'         => $b['data']['email'] ?? null,
      'name'          => $b['data']['name']  ?? null,
    ]);

    // Auto-create a contact resource if email is present & not duplicate
    if (!empty($ctx['email']) && filter_var($ctx['email'], FILTER_VALIDATE_EMAIL)) {
      // Build a UTM/attribution block once — preserved on create AND merged on existing-contact updates
      $utm = [];
      foreach (['utm_source','utm_campaign','utm_medium','utm_content','utm_term','landing_page','referrer'] as $uk) {
        if (!empty($b['data'][$uk])) $utm[$uk] = (string)$b['data'][$uk];
      }
      $niche = !empty($b['data']['niche']) ? (string)$b['data']['niche'] : null;

      $existing = qOne(
        "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ? LIMIT 1",
        [$ctx['email']]
      );
      if (!$existing) {
        $contactData = [
          'name'    => $ctx['name'] ?? $ctx['email'],
          'email'   => $ctx['email'],
          'phone'   => $b['data']['phone'] ?? null,
          'company' => $b['data']['company'] ?? null,
          'source'  => 'form:' . $formTitle,
          'niche'   => $niche,
          'tags'    => ['lead-new'],
          'first_touch'    => $utm,
          'last_touch'     => $utm,
          'first_seen_at'  => date('c'),
          'last_seen_at'   => date('c'),
        ];
        qExec(
          "INSERT INTO resources (org_id, type, slug, title, status, data) VALUES (?, 'contact', ?, ?, 'active', ?)",
          [$orgId, 'c-' . substr(bin2hex(random_bytes(4)), 0, 8), $contactData['name'], json_encode($contactData)]
        );
        $ctx['contact_id'] = lastId();
      } else {
        // Update existing: refresh last_touch, preserve first_touch, append niche if missing
        $ctx['contact_id'] = (int)$existing['id'];
        $cd = json_decode($existing['data'] ?? '{}', true) ?: [];
        if (empty($cd['first_touch']) && !empty($utm))   $cd['first_touch']   = $utm;
        if (empty($cd['first_seen_at']))                  $cd['first_seen_at'] = date('c');
        if (!empty($utm))                                  $cd['last_touch']   = $utm;
        $cd['last_seen_at'] = date('c');
        if ($niche && empty($cd['niche']))                $cd['niche']        = $niche;
        // Tag: every form submission adds to a touchpoints list (capped at last 10)
        $tps = $cd['touchpoints'] ?? [];
        $tps[] = ['form' => $formTitle, 'at' => date('c'), 'utm' => $utm];
        if (count($tps) > 10) $tps = array_slice($tps, -10);
        $cd['touchpoints'] = $tps;
        qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($cd), $existing['id']]);
      }
    }

    // 0) Enroll the lead into the right nurture sequence. Niche landing-page leads
    //    (data.niche set to one of the 14 CRM niches) get the industry-specific
    //    drip (niche_<niche>); everyone else gets welcome, with audit/analyzer and
    //    partner sources routed to their follow-ups. Gated on a real email + an
    //    existing contact; enrollment failures never block the submission.
    if (!empty($ctx['contact_id']) && !empty($ctx['email']) && filter_var($ctx['email'], FILTER_VALIDATE_EMAIL)) {
      try {
        require_once __DIR__ . '/../lib/email-sequences.php';
        $src  = strtolower((string)($b['data']['source'] ?? $formTitle));
        $lang = $b['data']['lang'] ?? (str_starts_with($src, 'es-') ? 'es' : 'en');
        $seqId = seq_niche_sequence_id($niche ?? null);
        if (!$seqId) {
          $seqId = 'welcome';
          if (strpos($src, 'audit') !== false || strpos($src, 'analyzer') !== false) $seqId = 'audit_followup';
          elseif (strpos($src, 'partner') !== false) $seqId = 'partner_application';
        }
        seq_enroll((int)$ctx['contact_id'], $seqId, [
          'email'        => $ctx['email'],
          'name'         => $ctx['name'] ?? $ctx['email'],
          'first_name'   => preg_split('/\s+/', (string)($ctx['name'] ?? ''), 2)[0] ?? '',
          'lang'         => $lang,
          'website'      => $b['data']['website'] ?? '',
          'niche'        => $niche ?? '',
          'source'       => 'form:' . $formTitle,
          'enrolled_via' => 'form_submit',
        ]);
      } catch (Throwable $e) { /* never block submission on enroll errors */ }
    }

    // 1) Admin notification email
    try {
      $cfg = config();
      $adminEmail = 'admin@' . parse_url($cfg['base_url'], PHP_URL_HOST);
      $rows = '';
      foreach ($b['data'] as $k => $v) {
        $rows .= '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">' .
                 htmlspecialchars((string)$k, ENT_QUOTES, 'UTF-8') .
                 '</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;">' .
                 htmlspecialchars(is_scalar($v) ? (string)$v : json_encode($v), ENT_QUOTES, 'UTF-8') .
                 '</td></tr>';
      }
      $inner = '<p>A new submission arrived from <strong>' .
               htmlspecialchars($formTitle, ENT_QUOTES, 'UTF-8') . '</strong>.</p>' .
               '<table style="width:100%;border-collapse:collapse;margin-top:12px;">' . $rows . '</table>' .
               '<p style="margin-top:20px;font-size:13px;color:#888;">Submission #' . $submissionId . '</p>';
      send_mail($adminEmail, 'New lead: ' . $formTitle, email_shell('New form submission', $inner));
    } catch (Throwable $e) { /* don't block submission on mail errors */ }

    // 2) Fire any matching workflows
    $wfFired = [];
    try {
      // Match workflows whose trigger form_id is either the numeric id or the slug
      $wfFired = wf_trigger('form_submission', ['form_id' => $form['slug'] ?: (string)$formId], $ctx, $orgId);
      if (empty($wfFired) && $form['slug']) {
        $wfFired = wf_trigger('form_submission', ['form_id' => (string)$formId], $ctx, $orgId);
      }
    } catch (Throwable $e) { /* ignore */ }

    // 3) Log activity
    try {
      qExec(
        "INSERT INTO activity_log (org_id, action, resource_type, resource_id, meta) VALUES (?, 'form_submitted', 'form', ?, ?)",
        [$orgId, $formId, json_encode(['submission_id' => $submissionId, 'workflows' => $wfFired])]
      );
    } catch (Throwable $e) { /* ignore */ }

    json_out(['ok' => true, 'id' => $submissionId, 'workflows_fired' => count($wfFired)], 201);
  }

  // /api/public/track/lead — server-side Meta CAPI Lead event (deduped with Pixel via event_id)
  //
  // Body: {event_id, form_id?, email?, phone?, first_name?, last_name?,
  //        fbp?, fbc?, ga_client_id?, source_url?}
  //
  // Fires a `Lead` event to Meta CAPI. The Pixel fires the same event_id client-side
  // — Meta dedupes them when fbp+event_id match. No-op when META_CAPI_PIXEL_ID /
  // META_CAPI_TOKEN are unset (silent skip + audit row in billing_events).
  if ($sub === 'track' && ($parts[1] ?? null) === 'lead' && $method === 'POST') {
    // Rate limit — abuse-cap server-side CAPI relays. 60 / hr / IP is plenty
    // for legitimate users (1 lead submission with ~3 retries on flaky nets).
    rate_limit_check('track_lead', 60, 3600);

    $b = json_decode(file_get_contents('php://input'), true) ?: [];
    $eventId = (string)($b['event_id'] ?? '');
    if (!$eventId || !preg_match('/^[a-z0-9_\-]{6,64}$/i', $eventId)) {
      err('Invalid event_id');
    }

    $cfg     = config();
    $pixelId = $cfg['meta_capi_pixel_id'] ?? '';
    $token   = $cfg['meta_capi_token']    ?? '';

    // Normalize + hash PII per Meta CAPI spec (SHA-256, lowercased, trimmed)
    $hash = function ($v) { $v = trim(strtolower((string)$v)); return $v === '' ? null : hash('sha256', $v); };
    $email = $hash($b['email'] ?? '');
    $phone = $b['phone'] ?? '';
    if ($phone !== '') {
      // E.164-ish: digits only for hashing (Meta strips +)
      $phone = preg_replace('/[^\d]/', '', (string)$phone);
      $phone = $phone ? hash('sha256', $phone) : null;
    } else {
      $phone = null;
    }
    $fn = $hash($b['first_name'] ?? '');
    $ln = $hash($b['last_name']  ?? '');

    $userData = array_filter([
      'em'                => $email ? [$email] : null,
      'ph'                => $phone ? [$phone] : null,
      'fn'                => $fn    ? [$fn]    : null,
      'ln'                => $ln    ? [$ln]    : null,
      'fbp'               => $b['fbp'] ?? null,
      'fbc'               => $b['fbc'] ?? null,
      'client_ip_address' => $_SERVER['REMOTE_ADDR']     ?? null,
      'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    ]);

    // Audit-log every relay attempt so we can confirm CAPI dedup is working
    // from the BillEvents UI. status='skipped' when secrets are unset.
    $auditStatus = 'sent';
    $auditRaw    = '';

    if (!$pixelId || !$token) {
      $auditStatus = 'skipped_no_config';
    } else {
      $payload = [
        'data' => [[
          'event_name'       => 'Lead',
          'event_time'       => time(),
          'event_id'         => $eventId,
          'action_source'    => 'website',
          'event_source_url' => (string)($b['source_url'] ?? 'https://netwebmedia.com/contact.html'),
          'user_data'        => $userData,
          'custom_data'      => [
            'content_name' => (string)($b['form_id'] ?? 'form-submit'),
            'currency'     => 'USD',
            'value'        => 1,
            'lead_event_source' => 'nwm-forms.js',
          ],
        ]],
      ];
      if (!empty($cfg['meta_capi_test_code'])) {
        $payload['test_event_code'] = $cfg['meta_capi_test_code'];
      }

      $ch = curl_init('https://graph.facebook.com/v18.0/' . urlencode($pixelId) . '/events?access_token=' . urlencode($token));
      curl_setopt_array($ch, [
        CURLOPT_POST           => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 6,
      ]);
      $res  = curl_exec($ch);
      $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
      curl_close($ch);
      $auditRaw    = substr((string)$res, 0, 2000);
      $auditStatus = ($code >= 200 && $code < 300) ? 'sent' : ('error_' . $code);
    }

    try {
      qExec(
        "INSERT INTO billing_events (mp_resource, mp_id, topic, raw, status) VALUES (?, ?, ?, ?, ?)",
        ['capi', $eventId, 'capi_lead', $auditRaw, $auditStatus]
      );
    } catch (Throwable $e) { /* ignore audit log failures */ }

    // GA4 server-side relay — fire a `generate_lead` Measurement Protocol event
    // when GA4_MP_API_SECRET is configured. Same event_id propagates as ga_event_id.
    $ga4MeasurementId  = $cfg['ga4_measurement_id'] ?? 'G-V71R6PD7C0';
    $ga4ApiSecret      = $cfg['ga4_mp_api_secret']  ?? '';
    $ga4ClientId       = (string)($b['ga_client_id'] ?? '');
    if ($ga4ApiSecret && $ga4ClientId && $ga4MeasurementId) {
      $gaPayload = [
        'client_id' => $ga4ClientId,
        'events'    => [[
          'name'   => 'generate_lead',
          'params' => [
            'event_id' => $eventId,
            'form_id'  => (string)($b['form_id'] ?? ''),
            'value'    => 1,
            'currency' => 'USD',
          ],
        ]],
      ];
      $ga4Url = 'https://www.google-analytics.com/mp/collect?measurement_id=' . urlencode($ga4MeasurementId) .
                '&api_secret=' . urlencode($ga4ApiSecret);
      $ch2 = curl_init($ga4Url);
      curl_setopt_array($ch2, [
        CURLOPT_POST           => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($gaPayload),
        CURLOPT_TIMEOUT        => 4,
      ]);
      @curl_exec($ch2);
      @curl_close($ch2);
    }

    json_out(['ok' => true, 'event_id' => $eventId, 'capi_status' => $auditStatus]);
  }

  // /api/public/newsletter/subscribe — body: {email, name?, source?}
  if ($sub === 'newsletter' && ($parts[1] ?? null) === 'subscribe' && $method === 'POST') {
    // Spam-relay defense: 30 / hr / IP. Newsletter signups don't burn Claude
    // tokens directly but they trigger an automated welcome email, which is
    // its own spam-vector if uncapped.
    rate_limit_check('newsletter_subscribe', 30, 3600);
    $b = required(['email']);
    $email = trim(strtolower($b['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email');
    $orgId = 1;
    $existing = qOne(
      "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ? LIMIT 1",
      [$email]
    );
    if ($existing) {
      // Append newsletter tag idempotently
      $cd = json_decode($existing['data'], true) ?: [];
      $tags = $cd['tags'] ?? [];
      if (!in_array('newsletter', $tags, true)) {
        $tags[] = 'newsletter';
        $cd['tags'] = $tags;
        qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($cd), $existing['id']]);
      }
      json_out(['ok' => true, 'id' => (int)$existing['id'], 'already' => true]);
    }
    $data = [
      'name'   => $b['name'] ?? $email,
      'email'  => $email,
      'source' => $b['source'] ?? 'newsletter',
      'tags'   => ['newsletter', 'lead-new'],
    ];
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data) VALUES (?, 'contact', ?, ?, 'active', ?)",
      [$orgId, 'nl-' . substr(bin2hex(random_bytes(4)), 0, 8), $data['name'], json_encode($data)]
    );
    $contactId = lastId();

    // Enroll in welcome sequence (replaces single welcome email — sequence's own welcome-1.html sends in 5 min)
    try {
      require_once __DIR__ . '/../lib/email-sequences.php';
      $lang = $b['lang'] ?? (str_starts_with(strtolower($b['source'] ?? ''), 'es-') ? 'es' : 'en');
      // Determine which sequence: niche-specific drip if a niche is supplied and a
      // matching sequence exists, otherwise welcome (audit/partner sources routed).
      $seqId = seq_niche_sequence_id($b['niche'] ?? null);
      if (!$seqId) {
        $seqId = 'welcome';
        if (!empty($b['source'])) {
          $src = strtolower($b['source']);
          if (strpos($src, 'audit') !== false || strpos($src, 'analyzer') !== false) $seqId = 'audit_followup';
          elseif (strpos($src, 'partner') !== false) $seqId = 'partner_application';
        }
      }
      seq_enroll($contactId, $seqId, [
        'email' => $email,
        'name' => $data['name'],
        'first_name' => preg_split('/\s+/', $data['name'], 2)[0] ?? '',
        'lang' => $lang,
        'website' => $b['website'] ?? '',
        'niche' => $b['niche'] ?? '',
        'source' => $b['source'] ?? 'newsletter',
        'enrolled_via' => 'newsletter_signup'
      ]);
    } catch (Throwable $e) {}

    // Fire any newsletter_subscribe workflows (legacy)
    try {
      wf_trigger('newsletter_subscribe', [], ['email' => $email, 'name' => $data['name'], 'contact_id' => $contactId], $orgId);
    } catch (Throwable $e) {}

    // Fire generic contact_created trigger — catches visual-builder workflows that
    // listen for any new contact (newsletter, WhatsApp, form, etc.). Errors are
    // swallowed because the opt-in already succeeded; workflow firing is bonus.
    try {
      wf_trigger('contact_created', [], [
        'email'      => $email,
        'name'       => $data['name'],
        'lang'       => $b['lang'] ?? null,
        'source'     => $b['source'] ?? 'newsletter',
        'contact_id' => $contactId,
      ], $orgId);
    } catch (Throwable $e) {}

    json_out(['ok' => true, 'id' => $contactId, 'sequence_enrolled' => $seqId ?? 'welcome'], 201);
  }

  // /api/public/whatsapp/subscribe — body: {phone, name?, niche?, consent_text, source?, lang?}
  //
  // Captures opted-in WhatsApp subscribers BEFORE Meta WABA verification completes.
  // Once verification clears, a separate flush job (cron) sends the double-opt-in
  // confirmation message to every subscriber whose `wa_optin_status` is still
  // 'pending_double_opt_in', flipping them to 'confirmed' on reply.
  //
  // Storage: extends the existing `contact` resource type. Tags include
  // 'whatsapp_subscriber' + 'lead-new'. Per-record metadata in data.whatsapp:
  //   { phone (E.164), consent_at (ISO8601), consent_text, source, niche?,
  //     wa_optin_status: 'pending_double_opt_in' | 'confirmed' | 'opted_out' }
  if ($sub === 'whatsapp' && ($parts[1] ?? null) === 'subscribe' && $method === 'POST') {
    // Honeypot — silent 200 with fake id so bots don't adapt
    foreach (['nwm_website', 'hp_website', 'honeypot'] as $hp) {
      if (!empty($_POST[$hp]) || !empty($_GET[$hp])) {
        json_out(['ok' => true, 'id' => 0, 'status' => 'pending_double_opt_in']);
        return;
      }
    }
    // Rate limit — stricter than newsletter (SMS abuse is more expensive than email)
    rate_limit_check('whatsapp_subscribe', 20, 3600);

    $b = required(['phone', 'consent_text']);

    // Normalize phone to E.164 — strip everything except digits + leading +
    $phoneRaw = (string)$b['phone'];
    $phone = preg_replace('/[^\d+]/', '', $phoneRaw);
    if (strpos(substr($phone, 1), '+') !== false) $phone = '+' . preg_replace('/\+/', '', $phone);
    if (substr_count($phone, '+') > 1) err('Invalid phone format');
    $digits = preg_replace('/\D/', '', $phone);
    if (strlen($digits) < 10 || strlen($digits) > 15) err('Phone must be 10–15 digits in E.164 format');
    if ($phone[0] !== '+') $phone = '+' . $digits;

    $consentText = trim((string)$b['consent_text']);
    if (mb_strlen($consentText) < 20) err('consent_text must record the exact opt-in text the user accepted');
    if (mb_strlen($consentText) > 2000) $consentText = mb_substr($consentText, 0, 2000);

    $name = trim((string)($b['name'] ?? ''));
    if ($name === '') $name = 'WhatsApp subscriber ' . substr($phone, -4);
    if (mb_strlen($name) > 200) $name = mb_substr($name, 0, 200);

    // Optional email — if provided, dual-channel them (WhatsApp pending +
    // immediate welcome email). Enables value delivery while WABA is in review.
    $email = trim(strtolower((string)($b['email'] ?? '')));
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $email = ''; // silently drop invalid

    $niche = strtolower(trim((string)($b['niche'] ?? '')));
    $allowedNiches = ['tourism','restaurants','health','beauty','smb','law_firms','real_estate','local_specialist','automotive','education','events_weddings','financial_services','home_services','wine_agriculture'];
    if ($niche !== '' && !in_array($niche, $allowedNiches, true)) $niche = '';

    $source = mb_substr(trim((string)($b['source'] ?? 'whatsapp_optin')), 0, 100);
    $lang = in_array(($b['lang'] ?? 'en'), ['en','es'], true) ? $b['lang'] : 'en';

    $orgId = 1;
    $now = date('c');

    $waMeta = [
      'phone'           => $phone,
      'consent_at'      => $now,
      'consent_text'    => $consentText,
      'consent_ip'      => $_SERVER['REMOTE_ADDR'] ?? null,
      'consent_ua'      => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
      'source'          => $source,
      'niche'           => $niche ?: null,
      'lang'            => $lang,
      'wa_optin_status' => 'pending_double_opt_in',
    ];

    // Idempotency: phone is the key. If already present, append tag + refresh consent_at.
    $existing = qOne(
      "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.whatsapp.phone') = ? LIMIT 1",
      [$phone]
    );
    if ($existing) {
      $cd = json_decode($existing['data'], true) ?: [];
      $tags = $cd['tags'] ?? [];
      if (!in_array('whatsapp_subscriber', $tags, true)) $tags[] = 'whatsapp_subscriber';
      $cd['tags'] = $tags;
      // Preserve any existing 'confirmed' or 'opted_out' state — only refresh metadata if still pending.
      $existingStatus = $cd['whatsapp']['wa_optin_status'] ?? 'pending_double_opt_in';
      if ($existingStatus !== 'opted_out') {
        $cd['whatsapp'] = array_merge($cd['whatsapp'] ?? [], $waMeta, ['wa_optin_status' => $existingStatus]);
      }
      qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($cd), $existing['id']]);
      json_out(['ok' => true, 'id' => (int)$existing['id'], 'already' => true, 'status' => $cd['whatsapp']['wa_optin_status']]);
    }

    $data = [
      'name'      => $name,
      'phone'     => $phone,
      'tags'      => ['whatsapp_subscriber', 'lead-new'],
      'source'    => $source,
      'niche'     => $niche ?: null,
      'whatsapp'  => $waMeta,
    ];
    if ($email !== '') $data['email'] = $email;
    qExec(
      "INSERT INTO resources (org_id, type, slug, title, status, data) VALUES (?, 'contact', ?, ?, 'active', ?)",
      [$orgId, 'wa-' . substr(bin2hex(random_bytes(4)), 0, 8), $name, json_encode($data)]
    );
    $contactId = lastId();

    // Email enrollment — only if user provided an email. Same welcome sequence
    // as the newsletter signup; the contact gets immediate value while WABA
    // verification is pending.
    $sequenceEnrolled = null;
    if ($email !== '') {
      try {
        require_once __DIR__ . '/../lib/email-sequences.php';
        seq_enroll($contactId, 'welcome', [
          'email'        => $email,
          'name'         => $name,
          'first_name'   => preg_split('/\s+/', $name, 2)[0] ?? '',
          'lang'         => $lang,
          'source'       => $source,
          'niche'        => $niche ?: null,
          'enrolled_via' => 'whatsapp_subscribe',
        ]);
        $sequenceEnrolled = 'welcome';
      } catch (Throwable $e) { /* swallow — opt-in succeeded, email is bonus */ }
    }

    // Fire generic contact_created FIRST so visual-builder workflows can act on
    // every new contact regardless of source. Then the legacy whatsapp_subscribe
    // trigger for anything wired specifically to that event.
    try {
      wf_trigger('contact_created', [], [
        'phone'      => $phone,
        'name'       => $name,
        'niche'      => $niche,
        'email'      => $email ?: null,
        'lang'       => $lang,
        'source'     => $source,
        'contact_id' => $contactId,
      ], $orgId);
    } catch (Throwable $e) {}

    try {
      wf_trigger('whatsapp_subscribe', [], [
        'phone' => $phone, 'name' => $name, 'niche' => $niche,
        'email' => $email ?: null, 'contact_id' => $contactId
      ], $orgId);
    } catch (Throwable $e) {}

    json_out([
      'ok' => true,
      'id' => $contactId,
      'status' => 'pending_double_opt_in',
      'email_sequence_enrolled' => $sequenceEnrolled,
    ], 201);
  }

  // /api/public/email/preview?id=welcome-1&lang=en — render a sequence email as HTML
  if ($sub === 'email' && ($parts[1] ?? null) === 'preview') {
    require_once __DIR__ . '/../lib/email-sequences.php';
    $id = $_GET['id'] ?? '';
    $lang = $_GET['lang'] ?? 'en';
    if (!$id) err('id required', 400);
    $sample = [];
    if (!empty($_GET['name'])) $sample['name'] = $_GET['name'];
    if (!empty($_GET['first_name'])) $sample['first_name'] = $_GET['first_name'];
    if (!empty($_GET['website'])) $sample['website'] = $_GET['website'];
    if (!empty($_GET['email'])) $sample['email'] = $_GET['email'];
    $rendered = seq_render_preview($id, $lang, $sample);
    if (!$rendered) err('Message not found: ' . $id, 404);
    // Allow JSON output for API consumers
    if (($_GET['format'] ?? 'html') === 'json') {
      json_out($rendered);
      return;
    }
    // Default: render HTML directly
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Frame-Options: SAMEORIGIN');
    echo $rendered['html'];
    exit;
  }

  // /api/public/email/list — list all available preview messages
  if ($sub === 'email' && ($parts[1] ?? null) === 'list') {
    require_once __DIR__ . '/../lib/email-sequences.php';
    json_out(['messages' => seq_list_messages()]);
    return;
  }

  // /api/public/email/preferences — manage preferences / unsubscribe
  if ($sub === 'email' && ($parts[1] ?? null) === 'preferences') {
    require_once __DIR__ . '/../lib/email-sequences.php';
    $email = $_GET['email'] ?? null;
    $action = $_GET['action'] ?? 'view';
    if (!$email) err('Email required', 400);
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email', 400);

    if ($action === 'unsubscribe') {
      seq_cancel_for_email($email);
      try {
        $contact = qOne("SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ? LIMIT 1", [$email]);
        if ($contact) {
          $cd = json_decode($contact['data'], true) ?: [];
          $cd['unsubscribed_at'] = date('c');
          $cd['email_opt_in'] = false;
          qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($cd), $contact['id']]);
        }
      } catch (Throwable $e) {}
      // Render simple confirmation HTML
      header('Content-Type: text/html; charset=UTF-8');
      echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Unsubscribed</title>' .
           '<style>body{font-family:-apple-system,sans-serif;background:#0a0e27;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:20px;text-align:center}div{max-width:420px}h1{color:#FF671F}</style></head>' .
           '<body><div><h1>You\'re unsubscribed</h1><p>We\'ve removed <strong>' . htmlspecialchars($email) . '</strong> from all email sequences. The door stays open if you change your mind.</p><p><a href="https://netwebmedia.com" style="color:#FF671F">Back to NetWebMedia</a></p></div></body></html>';
      exit;
    }
    if ($action === 'keep') {
      // Re-engage: clear the inactive flag
      try {
        $contact = qOne("SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ? LIMIT 1", [$email]);
        if ($contact) {
          $cd = json_decode($contact['data'], true) ?: [];
          $cd['re_engaged_at'] = date('c');
          $cd['email_opt_in'] = true;
          qExec("UPDATE resources SET data = ? WHERE id = ?", [json_encode($cd), $contact['id']]);
        }
      } catch (Throwable $e) {}
      header('Content-Type: text/html; charset=UTF-8');
      echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Welcome back</title>' .
           '<style>body{font-family:-apple-system,sans-serif;background:#0a0e27;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:20px;text-align:center}div{max-width:420px}h1{color:#7fe3a3}</style></head>' .
           '<body><div><h1>Welcome back! 🎉</h1><p>We\'ve confirmed <strong>' . htmlspecialchars($email) . '</strong> stays subscribed. Quality content coming your way.</p><p><a href="https://netwebmedia.com" style="color:#FF671F">Back to NetWebMedia</a></p></div></body></html>';
      exit;
    }
    err('Unknown action', 400);
  }

  // /api/public/blog — list published posts (paginated)
  if ($sub === 'blog' && !isset($parts[1]) && $method === 'GET') {
    $limit = max(1, min(50, (int) qparam('limit', 12)));
    $offset = max(0, (int) qparam('offset', 0));
    $rows = qAll(
      "SELECT id, slug, title, data, created_at FROM resources
       WHERE type = 'blog_post' AND status = 'published'
       ORDER BY created_at DESC LIMIT $limit OFFSET $offset"
    );
    $total = (int) qOne("SELECT COUNT(*) AS c FROM resources WHERE type='blog_post' AND status='published'")['c'];
    foreach ($rows as &$r) $r['data'] = json_decode($r['data'], true);
    json_out(['total' => $total, 'items' => $rows]);
  }

  // /api/public/blog/{slug}
  if ($sub === 'blog' && isset($parts[1]) && $method === 'GET') {
    $slug = $parts[1];
    $r = qOne(
      "SELECT * FROM resources WHERE type='blog_post' AND slug = ? AND status='published'",
      [$slug]
    );
    if (!$r) err('Not found', 404);
    $r['data'] = json_decode($r['data'], true);
    json_out($r);
  }

  // /api/public/stats — aggregate counters for the dashboard
  if ($sub === 'stats' && $method === 'GET') {
    $counts = [];
    foreach (['page', 'blog_post', 'landing_page', 'form', 'template', 'contact', 'deal'] as $t) {
      $counts[$t] = (int) (qOne("SELECT COUNT(*) AS c FROM resources WHERE type = ?", [$t])['c'] ?? 0);
    }
    $submissions30d = (int) qOne(
      "SELECT COUNT(*) AS c FROM form_submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    )['c'];
    json_out(['counts' => $counts, 'form_submissions_30d' => $submissions30d]);
  }

  // /api/public/agents/chat — {public_token, message, session_id?}
  if ($sub === 'agents' && ($parts[1] ?? null) === 'chat' && $method === 'POST') {
    require_once __DIR__ . '/ai.php';
    route_public_agent_chat($parts, $method);
    return;
  }

  // /api/public/chat — handled by index.php short-circuit before this file
  // loads (see routes/public-chat.php). The branch below is a safety net in
  // case someone loads routes/public.php directly from another dispatcher.
  if ($sub === 'chat' && !isset($parts[1]) && $method === 'POST') {
    require_once __DIR__ . '/public-chat.php';
    route_public_chat();
    return;
  }

  // /api/public/aeo-score — AEO Citation Index lead-magnet scorer
  if ($sub === 'aeo-score' && $method === 'POST') {
    require_once __DIR__ . '/aeo_score.php';
    route_public_aeo_score($parts, $method);
    return;
  }

  // /api/public/audit — deep website + social audit
  if ($sub === 'audit' && $method === 'POST') {
    // Direct Claude exposure: every audit POST runs an LLM call. 10 / hr / IP
    // is plenty for legit use (a human is filling out a form) and aggressively
    // caps a script that's been told to hammer this endpoint.
    rate_limit_check('public_audit', 10, 3600);
    require_once __DIR__ . '/audit.php';
    route_public_audit($parts, $method);
    return;
  }

  // /api/public/campaigns/track/open/{hash}  or click/{hash}
  if ($sub === 'campaigns' && ($parts[1] ?? null) === 'track') {
    require_once __DIR__ . '/campaigns.php';
    $sub_parts = array_slice($parts, 2);
    route_public_campaign_track($sub_parts, $method);
    return;
  }

  // /api/public/track-visit — page-visit pixel
  if ($sub === 'track-visit' && $method === 'POST') {
    require_once __DIR__ . '/webhooks.php';
    wh_route_track_visit();
    return;
  }

  // /api/public/appointments/webhook — Calendly + generic
  if ($sub === 'appointments' && ($parts[1] ?? null) === 'webhook' && $method === 'POST') {
    require_once __DIR__ . '/webhooks.php';
    wh_route_appointments();
    return;
  }

  // /api/public/reviews/webhook — Google Reviews / Trustpilot / generic
  if ($sub === 'reviews' && ($parts[1] ?? null) === 'webhook' && $method === 'POST') {
    require_once __DIR__ . '/webhooks.php';
    wh_route_reviews();
    return;
  }

  // /api/public/voice/webhook — Twilio Voice missed-call status callback
  if ($sub === 'voice' && ($parts[1] ?? null) === 'webhook' && $method === 'POST') {
    require_once __DIR__ . '/webhooks.php';
    wh_route_voice();
    return;
  }

  // /api/public/email-inbound/webhook — SendGrid Parse / Postmark Inbound / Mailgun Routes
  if ($sub === 'email-inbound' && ($parts[1] ?? null) === 'webhook' && $method === 'POST') {
    require_once __DIR__ . '/webhooks.php';
    wh_route_email_inbound();
    return;
  }

  // /api/public/ab/assign  /api/public/ab/convert
  if ($sub === 'ab' && $method === 'GET') {
    require_once __DIR__ . '/abtests.php';
    route_public_ab($parts, $method);
    return;
  }

  err('Public route not found', 404);
}
