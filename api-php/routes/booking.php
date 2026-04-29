<?php
/**
 * Booking — Calendly-style public scheduling.
 *
 * PUBLIC (no auth):
 *   GET  /api/booking/links/{slug}                  — link config + host info
 *   GET  /api/booking/links/{slug}/slots?from=...&days=14 — available time slots
 *   POST /api/booking/links/{slug}/book             — create booking
 *   GET  /api/booking/cancel?token=...              — booking info for cancel UI
 *   POST /api/booking/cancel?token=...              — cancel booking
 *   GET  /api/booking/ics?id=X&token=...            — ICS calendar file
 *
 * ADMIN (auth required):
 *   GET    /api/booking/admin/links                 — list my links
 *   POST   /api/booking/admin/links                 — create
 *   PUT    /api/booking/admin/links/{id}            — update
 *   DELETE /api/booking/admin/links/{id}            — delete
 *   GET    /api/booking/admin/availability          — my weekly schedule
 *   PUT    /api/booking/admin/availability          — replace weekly schedule
 *   GET    /api/booking/admin/bookings              — list my bookings (filters: from,to,status,link_id)
 *   POST   /api/booking/admin/bookings/{id}/cancel  — cancel a booking
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

function booking_ensure_schema() {
  static $done = false;
  if ($done) return;

  db()->exec("CREATE TABLE IF NOT EXISTS booking_links (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    org_id             INT NOT NULL DEFAULT 1,
    user_id            INT NOT NULL,
    slug               VARCHAR(80) NOT NULL UNIQUE,
    title              VARCHAR(150) NOT NULL,
    description        TEXT DEFAULT NULL,
    duration_min       INT NOT NULL DEFAULT 30,
    buffer_min         INT NOT NULL DEFAULT 0,
    advance_min_hours  INT NOT NULL DEFAULT 4,
    advance_max_days   INT NOT NULL DEFAULT 30,
    meeting_type       VARCHAR(40) NOT NULL DEFAULT 'video',
    meeting_location   VARCHAR(500) DEFAULT NULL,
    is_active          TINYINT(1) NOT NULL DEFAULT 1,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY ix_slug   (slug),
    KEY ix_user   (user_id, is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS booking_availability (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    day_of_week  TINYINT NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    KEY ix_user_dow (user_id, day_of_week)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  db()->exec("CREATE TABLE IF NOT EXISTS bookings (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    booking_link_id   INT NOT NULL,
    user_id           INT NOT NULL,
    contact_id        INT DEFAULT NULL,
    guest_name        VARCHAR(150) NOT NULL,
    guest_email       VARCHAR(200) NOT NULL,
    guest_phone       VARCHAR(50) DEFAULT NULL,
    guest_timezone    VARCHAR(80) DEFAULT NULL,
    notes             TEXT DEFAULT NULL,
    starts_at         DATETIME NOT NULL,
    ends_at           DATETIME NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    cancel_token      VARCHAR(64) NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    cancelled_at      DATETIME DEFAULT NULL,
    KEY ix_link_time   (booking_link_id, starts_at),
    KEY ix_user_time   (user_id, starts_at),
    KEY ix_status      (status),
    KEY ix_cancel_token (cancel_token)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $done = true;
}

function route_booking($parts, $method) {
  booking_ensure_schema();
  $sub = $parts[0] ?? null;

  // ── PUBLIC ──
  if ($sub === 'links' && isset($parts[1]) && !isset($parts[2])) {
    if ($method === 'GET') return booking_public_link_info($parts[1]);
    err('Method not allowed', 405);
  }
  if ($sub === 'links' && isset($parts[1]) && ($parts[2] ?? null) === 'slots' && $method === 'GET') {
    return booking_public_slots($parts[1]);
  }
  if ($sub === 'links' && isset($parts[1]) && ($parts[2] ?? null) === 'book' && $method === 'POST') {
    return booking_public_create($parts[1]);
  }
  if ($sub === 'cancel') {
    if ($method === 'GET')  return booking_public_cancel_info();
    if ($method === 'POST') return booking_public_cancel();
    err('Method not allowed', 405);
  }
  if ($sub === 'ics' && $method === 'GET') return booking_public_ics();

  // ── ADMIN ──
  if ($sub === 'admin') {
    $user = requireAuth();
    $section = $parts[1] ?? null;

    if ($section === 'links') {
      $id = isset($parts[2]) && ctype_digit((string)$parts[2]) ? (int)$parts[2] : null;
      if ($id) {
        if ($method === 'PUT')    return booking_admin_link_update($id, $user);
        if ($method === 'DELETE') return booking_admin_link_delete($id, $user);
        err('Method not allowed', 405);
      }
      if ($method === 'GET')  return booking_admin_links_list($user);
      if ($method === 'POST') return booking_admin_link_create($user);
    }

    if ($section === 'availability') {
      if ($method === 'GET') return booking_admin_availability_get($user);
      if ($method === 'PUT') return booking_admin_availability_set($user);
    }

    if ($section === 'bookings') {
      $id = isset($parts[2]) && ctype_digit((string)$parts[2]) ? (int)$parts[2] : null;
      if ($id && ($parts[3] ?? null) === 'cancel' && $method === 'POST') {
        return booking_admin_cancel($id, $user);
      }
      if ($method === 'GET') return booking_admin_bookings_list($user);
    }
  }

  err('Booking route not found', 404);
}

/* ─────────────────────  PUBLIC ENDPOINTS  ───────────────────── */

function booking_public_link_info($slug) {
  $link = qOne(
    "SELECT l.*, u.name AS host_name, u.email AS host_email
       FROM booking_links l
       LEFT JOIN users u ON u.id = l.user_id
      WHERE l.slug = ? AND l.is_active = 1",
    [$slug]
  );
  if (!$link) err('Booking link not found', 404);

  json_out([
    'ok' => true,
    'link' => [
      'slug'             => $link['slug'],
      'title'            => $link['title'],
      'description'      => $link['description'],
      'duration_min'     => (int)$link['duration_min'],
      'buffer_min'       => (int)$link['buffer_min'],
      'advance_min_hours'=> (int)$link['advance_min_hours'],
      'advance_max_days' => (int)$link['advance_max_days'],
      'meeting_type'     => $link['meeting_type'],
    ],
    'host' => [
      'name'  => $link['host_name'] ?? 'NetWebMedia',
      'email' => $link['host_email'] ?? null,
    ],
  ]);
}

function booking_public_slots($slug) {
  $link = qOne(
    "SELECT * FROM booking_links WHERE slug = ? AND is_active = 1",
    [$slug]
  );
  if (!$link) err('Booking link not found', 404);

  $userId   = (int)$link['user_id'];
  $duration = (int)$link['duration_min'];
  $buffer   = (int)$link['buffer_min'];
  $maxDays  = (int)$link['advance_max_days'];
  $minHours = (int)$link['advance_min_hours'];

  $fromStr = qparam('from', date('Y-m-d'));
  $days    = max(1, min($maxDays, (int)qparam('days', 14)));

  $fromTs = strtotime($fromStr . ' 00:00:00');
  if ($fromTs === false) err('Invalid `from` date', 400);

  $now    = time();
  $cutoff = $now + $minHours * 3600;
  $maxTs  = $now + $maxDays * 86400;

  // Load weekly availability once
  $availRows = qAll(
    "SELECT day_of_week, start_time, end_time FROM booking_availability WHERE user_id = ? ORDER BY day_of_week, start_time",
    [$userId]
  );
  $availByDow = [];
  foreach ($availRows as $r) {
    $dow = (int)$r['day_of_week'];
    $availByDow[$dow] = $availByDow[$dow] ?? [];
    $availByDow[$dow][] = [$r['start_time'], $r['end_time']];
  }

  // If no availability configured, return empty
  if (empty($availByDow)) {
    json_out(['ok' => true, 'slots' => [], 'note' => 'Host has not configured availability yet.']);
  }

  // Load existing bookings overlapping the date window once
  $rangeStart = date('Y-m-d 00:00:00', $fromTs);
  $rangeEnd   = date('Y-m-d 23:59:59', $fromTs + ($days - 1) * 86400);
  $existing = qAll(
    "SELECT starts_at, ends_at FROM bookings
      WHERE user_id = ? AND status = 'confirmed'
        AND ends_at > ? AND starts_at < ?",
    [$userId, $rangeStart, $rangeEnd]
  );

  $slots = [];
  for ($d = 0; $d < $days; $d++) {
    $dayTs  = $fromTs + $d * 86400;
    $dayDow = (int)date('w', $dayTs);
    if (empty($availByDow[$dayDow])) continue;
    $dayStr = date('Y-m-d', $dayTs);

    foreach ($availByDow[$dayDow] as $window) {
      [$startT, $endT] = $window;
      $winStart = strtotime("$dayStr $startT");
      $winEnd   = strtotime("$dayStr $endT");
      if (!$winStart || !$winEnd) continue;

      $step = ($duration + $buffer) * 60;
      for ($t = $winStart; $t + $duration * 60 <= $winEnd; $t += $step) {
        $slotStart = $t;
        $slotEnd   = $t + $duration * 60;

        // Skip past the cutoff
        if ($slotStart < $cutoff) continue;
        // Skip if beyond max
        if ($slotStart > $maxTs)  break 2;

        // Skip if it overlaps an existing booking (including buffer)
        $busy = false;
        foreach ($existing as $b) {
          $bs = strtotime($b['starts_at']);
          $be = strtotime($b['ends_at']);
          if ($slotStart < $be + $buffer * 60 && $slotEnd + $buffer * 60 > $bs) { $busy = true; break; }
        }
        if ($busy) continue;

        $slots[] = [
          'start' => date('c', $slotStart),
          'end'   => date('c', $slotEnd),
        ];
      }
    }
  }

  json_out(['ok' => true, 'slots' => $slots, 'count' => count($slots)]);
}

function booking_public_create($slug) {
  $link = qOne(
    "SELECT * FROM booking_links WHERE slug = ? AND is_active = 1",
    [$slug]
  );
  if (!$link) err('Booking link not found', 404);

  $b = body();

  // Honeypot — silent success, don't create record
  if (!empty($b['website']) || !empty($b['hp_field'])) {
    json_out(['ok' => true, 'booking_id' => 0]);
  }

  $name  = trim((string)($b['name']  ?? ''));
  $email = strtolower(trim((string)($b['email'] ?? '')));
  $phone = trim((string)($b['phone'] ?? ''));
  $tz    = trim((string)($b['timezone'] ?? 'UTC'));
  $notes = trim((string)($b['notes'] ?? ''));
  $slot  = (string)($b['slot'] ?? '');

  if (!$name || mb_strlen($name) > 150)  err('Valid name is required');
  if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) err('Valid email is required');
  if (!$slot)  err('Slot is required');

  $startTs = strtotime($slot);
  if (!$startTs) err('Invalid slot timestamp');
  $endTs = $startTs + ((int)$link['duration_min']) * 60;

  // Re-check availability + conflicts atomically
  $userId = (int)$link['user_id'];
  $now    = time();
  $minTs  = $now + ((int)$link['advance_min_hours']) * 3600;
  if ($startTs < $minTs) err('Slot is no longer available (too soon)');

  $dow = (int)date('w', $startTs);
  $tStr = date('H:i:s', $startTs);
  $tEnd = date('H:i:s', $endTs);

  $within = qOne(
    "SELECT id FROM booking_availability
      WHERE user_id = ? AND day_of_week = ? AND start_time <= ? AND end_time >= ?",
    [$userId, $dow, $tStr, $tEnd]
  );
  if (!$within) err('Slot is outside the host\'s availability', 409);

  $bufferSec = ((int)$link['buffer_min']) * 60;
  $conflict = qOne(
    "SELECT id FROM bookings
      WHERE user_id = ? AND status='confirmed'
        AND ends_at   + INTERVAL ? SECOND > ?
        AND starts_at - INTERVAL ? SECOND < ?",
    [$userId, $bufferSec, date('Y-m-d H:i:s', $startTs), $bufferSec, date('Y-m-d H:i:s', $endTs)]
  );
  if ($conflict) err('Slot was just booked by someone else. Please choose another.', 409);

  // Upsert contact resource
  $contactId = booking_upsert_contact($email, $name, $phone, ['source' => 'booking', 'last_booking' => date('c')]);

  // Insert booking
  $cancelToken = bin2hex(random_bytes(20));
  qExec(
    "INSERT INTO bookings
       (booking_link_id, user_id, contact_id, guest_name, guest_email, guest_phone, guest_timezone, notes, starts_at, ends_at, cancel_token)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    [(int)$link['id'], $userId, $contactId, $name, $email, $phone ?: null, $tz, $notes ?: null,
     date('Y-m-d H:i:s', $startTs), date('Y-m-d H:i:s', $endTs), $cancelToken]
  );
  $bookingId = lastId();

  if (function_exists('log_activity')) {
    log_activity('booking.created', 'booking', $bookingId, [
      'link_slug'  => $slug,
      'guest'      => $name,
      'guest_email'=> $email,
      'starts_at'  => date('c', $startTs),
      'contact_id' => $contactId,
    ]);
  }

  json_out([
    'ok'           => true,
    'booking_id'   => $bookingId,
    'cancel_token' => $cancelToken,
    'starts_at'    => date('c', $startTs),
    'ends_at'      => date('c', $endTs),
    'host_name'    => $link['host_name'] ?? null,
    'meeting_type' => $link['meeting_type'],
  ], 201);
}

function booking_upsert_contact($email, $name, $phone, $meta) {
  try {
    $existing = qOne(
      "SELECT id, data FROM resources WHERE type='contact' AND JSON_EXTRACT(data, '$.email') = ?",
      [$email]
    );
    if ($existing) {
      $data = json_decode($existing['data'] ?? '{}', true) ?: [];
      $data = array_merge($data, [
        'email' => $email,
        'name'  => $data['name']  ?: $name,
        'phone' => $data['phone'] ?: $phone,
      ], $meta);
      qExec("UPDATE resources SET data = ?, updated_at = NOW() WHERE id = ?", [json_encode($data), (int)$existing['id']]);
      return (int)$existing['id'];
    } else {
      $data = array_merge([
        'email' => $email, 'name' => $name, 'phone' => $phone, 'status' => 'lead',
        'imported_at' => date('Y-m-d H:i:s'),
      ], $meta);
      qExec("INSERT INTO resources (type, data, created_at) VALUES ('contact', ?, NOW())", [json_encode($data)]);
      return (int)lastId();
    }
  } catch (Exception $e) {
    return null;
  }
}

function booking_public_cancel_info() {
  $token = qparam('token', '');
  if (!$token) err('token is required');
  $b = qOne(
    "SELECT bk.id, bk.starts_at, bk.ends_at, bk.status, bk.guest_name, bk.guest_email,
            l.title AS link_title, u.name AS host_name
       FROM bookings bk
       LEFT JOIN booking_links l ON l.id = bk.booking_link_id
       LEFT JOIN users u ON u.id = bk.user_id
      WHERE bk.cancel_token = ?",
    [$token]
  );
  if (!$b) err('Booking not found', 404);
  json_out(['ok' => true, 'booking' => $b]);
}

function booking_public_cancel() {
  $token = qparam('token', '');
  if (!$token) err('token is required');
  $b = qOne("SELECT * FROM bookings WHERE cancel_token = ?", [$token]);
  if (!$b) err('Booking not found', 404);
  if ($b['status'] === 'cancelled') json_out(['ok' => true, 'already_cancelled' => true]);

  qExec("UPDATE bookings SET status='cancelled', cancelled_at=NOW() WHERE id=?", [(int)$b['id']]);

  if (function_exists('log_activity')) {
    log_activity('booking.cancelled', 'booking', (int)$b['id'], [
      'guest_email' => $b['guest_email'],
      'cancelled_by' => 'guest',
    ]);
  }
  json_out(['ok' => true, 'cancelled' => true]);
}

function booking_public_ics() {
  $id = (int)qparam('id', 0);
  $token = qparam('token', '');
  if (!$id || !$token) err('id and token required');
  $b = qOne(
    "SELECT bk.*, l.title AS link_title, l.meeting_location, u.name AS host_name, u.email AS host_email
       FROM bookings bk
       LEFT JOIN booking_links l ON l.id = bk.booking_link_id
       LEFT JOIN users u ON u.id = bk.user_id
      WHERE bk.id = ? AND bk.cancel_token = ?",
    [$id, $token]
  );
  if (!$b) err('Booking not found', 404);

  $start = gmdate('Ymd\\THis\\Z', strtotime($b['starts_at']));
  $end   = gmdate('Ymd\\THis\\Z', strtotime($b['ends_at']));
  $uid   = 'booking-' . $b['id'] . '@netwebmedia.com';
  $sum   = ($b['link_title'] ?: 'Meeting') . ' with ' . ($b['host_name'] ?: 'NetWebMedia');
  $loc   = $b['meeting_location'] ?: '';

  $ics = implode("\r\n", [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NetWebMedia//Booking//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' . $uid,
    'DTSTAMP:' . gmdate('Ymd\\THis\\Z'),
    'DTSTART:' . $start,
    'DTEND:'   . $end,
    'SUMMARY:' . str_replace([",",";","\n"], ['\\,','\\;','\\n'], $sum),
    'LOCATION:'    . str_replace([",",";","\n"], ['\\,','\\;','\\n'], $loc),
    'DESCRIPTION:' . str_replace([",",";","\n"], ['\\,','\\;','\\n'], (string)$b['notes']),
    'ORGANIZER;CN=' . str_replace([",",";"], ['\\,','\\;'], (string)$b['host_name']) . ':mailto:' . ($b['host_email'] ?: 'noreply@netwebmedia.com'),
    'ATTENDEE;CN=' . str_replace([",",";"], ['\\,','\\;'], (string)$b['guest_name']) . ':mailto:' . $b['guest_email'],
    'STATUS:' . ($b['status'] === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'),
    'END:VEVENT',
    'END:VCALENDAR',
  ]);

  header('Content-Type: text/calendar; charset=utf-8');
  header('Content-Disposition: attachment; filename="booking-' . $b['id'] . '.ics"');
  echo $ics;
  exit;
}

/* ─────────────────────  ADMIN ENDPOINTS  ───────────────────── */

function booking_admin_links_list($user) {
  $rows = qAll(
    "SELECT * FROM booking_links WHERE user_id = ? ORDER BY id DESC",
    [(int)$user['id']]
  );
  foreach ($rows as &$r) {
    $r['id']            = (int)$r['id'];
    $r['duration_min']  = (int)$r['duration_min'];
    $r['buffer_min']    = (int)$r['buffer_min'];
    $r['is_active']     = (int)$r['is_active'];
  }
  json_out(['links' => $rows]);
}

function booking_admin_link_create($user) {
  $b = body();
  if (empty($b['title'])) err('title is required');

  $slug = trim((string)($b['slug'] ?? ''));
  if (!$slug) {
    $slug = booking_generate_slug($b['title']);
  } else {
    $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($slug));
  }
  if (qOne("SELECT id FROM booking_links WHERE slug = ?", [$slug])) {
    $slug .= '-' . substr(bin2hex(random_bytes(3)), 0, 6);
  }

  qExec(
    "INSERT INTO booking_links
       (org_id, user_id, slug, title, description, duration_min, buffer_min, advance_min_hours, advance_max_days, meeting_type, meeting_location, is_active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      (int)($user['org_id'] ?? 1),
      (int)$user['id'],
      $slug,
      trim($b['title']),
      $b['description'] ?? null,
      (int)($b['duration_min'] ?? 30),
      (int)($b['buffer_min']   ?? 0),
      (int)($b['advance_min_hours'] ?? 4),
      (int)($b['advance_max_days']  ?? 30),
      $b['meeting_type']     ?? 'video',
      $b['meeting_location'] ?? null,
      isset($b['is_active']) ? (int)!!$b['is_active'] : 1,
    ]
  );
  $id = lastId();
  json_out(['ok' => true, 'id' => $id, 'slug' => $slug], 201);
}

function booking_admin_link_update($id, $user) {
  $owned = qOne("SELECT id FROM booking_links WHERE id = ? AND user_id = ?", [$id, (int)$user['id']]);
  if (!$owned) err('Booking link not found', 404);

  $b = body();
  $sets = []; $params = [];
  $allowed = ['title','description','duration_min','buffer_min','advance_min_hours','advance_max_days','meeting_type','meeting_location','is_active','slug'];
  foreach ($allowed as $k) {
    if (!array_key_exists($k, $b)) continue;
    $v = $b[$k];
    if (in_array($k, ['duration_min','buffer_min','advance_min_hours','advance_max_days','is_active'], true)) $v = (int)$v;
    if ($k === 'slug') $v = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)$v));
    $sets[] = "$k = ?";
    $params[] = $v;
  }
  if (!$sets) err('No fields to update');
  $params[] = $id;
  qExec("UPDATE booking_links SET " . implode(', ', $sets) . " WHERE id = ?", $params);
  json_out(['ok' => true]);
}

function booking_admin_link_delete($id, $user) {
  $owned = qOne("SELECT id FROM booking_links WHERE id = ? AND user_id = ?", [$id, (int)$user['id']]);
  if (!$owned) err('Booking link not found', 404);
  qExec("DELETE FROM booking_links WHERE id = ?", [$id]);
  json_out(['ok' => true, 'id' => $id]);
}

function booking_admin_availability_get($user) {
  $rows = qAll(
    "SELECT day_of_week, start_time, end_time FROM booking_availability WHERE user_id = ? ORDER BY day_of_week, start_time",
    [(int)$user['id']]
  );
  $by_day = [0=>[],1=>[],2=>[],3=>[],4=>[],5=>[],6=>[]];
  foreach ($rows as $r) {
    $by_day[(int)$r['day_of_week']][] = [
      'start' => substr($r['start_time'], 0, 5),
      'end'   => substr($r['end_time'],   0, 5),
    ];
  }
  json_out(['ok' => true, 'availability' => $by_day]);
}

function booking_admin_availability_set($user) {
  $b = body();
  $by_day = $b['availability'] ?? [];
  if (!is_array($by_day)) err('availability must be an object keyed by day of week');

  db()->beginTransaction();
  try {
    qExec("DELETE FROM booking_availability WHERE user_id = ?", [(int)$user['id']]);
    foreach ($by_day as $dow => $windows) {
      $dow = (int)$dow;
      if ($dow < 0 || $dow > 6) continue;
      if (!is_array($windows)) continue;
      foreach ($windows as $w) {
        $start = isset($w['start']) ? (string)$w['start'] : null;
        $end   = isset($w['end'])   ? (string)$w['end']   : null;
        if (!$start || !$end) continue;
        if (!preg_match('/^\d{1,2}:\d{2}/', $start) || !preg_match('/^\d{1,2}:\d{2}/', $end)) continue;
        if (strcmp($start, $end) >= 0) continue;
        qExec(
          "INSERT INTO booking_availability (user_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)",
          [(int)$user['id'], $dow, $start . ':00', $end . ':00']
        );
      }
    }
    db()->commit();
  } catch (Exception $e) {
    db()->rollBack();
    err('Failed to save availability: ' . $e->getMessage(), 500);
  }
  json_out(['ok' => true]);
}

function booking_admin_bookings_list($user) {
  $where  = ['user_id = ?'];
  $params = [(int)$user['id']];
  if ($from = qparam('from'))   { $where[] = 'starts_at >= ?'; $params[] = $from; }
  if ($to   = qparam('to'))     { $where[] = 'starts_at <= ?'; $params[] = $to; }
  if ($s    = qparam('status')) { $where[] = 'status = ?';     $params[] = $s; }
  if ($l    = qparam('link_id')){ $where[] = 'booking_link_id = ?'; $params[] = (int)$l; }
  $limit = max(1, min(500, (int)qparam('limit', 100)));

  $rows = qAll(
    "SELECT bk.*, l.title AS link_title, l.slug AS link_slug
       FROM bookings bk
       LEFT JOIN booking_links l ON l.id = bk.booking_link_id
      WHERE " . implode(' AND ', $where) . "
      ORDER BY starts_at DESC
      LIMIT $limit",
    $params
  );
  foreach ($rows as &$r) {
    $r['id']              = (int)$r['id'];
    $r['booking_link_id'] = (int)$r['booking_link_id'];
    $r['user_id']         = (int)$r['user_id'];
    $r['contact_id']      = $r['contact_id'] !== null ? (int)$r['contact_id'] : null;
    unset($r['cancel_token']);
  }
  json_out(['bookings' => $rows]);
}

function booking_admin_cancel($id, $user) {
  $b = qOne("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [$id, (int)$user['id']]);
  if (!$b) err('Booking not found', 404);
  if ($b['status'] === 'cancelled') json_out(['ok' => true, 'already_cancelled' => true]);
  qExec("UPDATE bookings SET status='cancelled', cancelled_at=NOW() WHERE id = ?", [$id]);
  if (function_exists('log_activity')) {
    log_activity('booking.cancelled', 'booking', (int)$b['id'], ['cancelled_by' => 'host']);
  }
  json_out(['ok' => true, 'cancelled' => true]);
}

function booking_generate_slug($title) {
  $s = strtolower($title);
  $s = preg_replace('/[^a-z0-9]+/', '-', $s);
  $s = trim($s, '-');
  if (!$s) $s = 'meeting';
  return substr($s, 0, 60);
}
