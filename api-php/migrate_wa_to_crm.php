<?php
/**
 * One-shot: copy whatsapp_sessions (webmed6_nwm) → conversations/messages (webmed6_crm)
 * GET /api-php/migrate_wa_to_crm.php?token=NWM_MIGRATE_2026&dry=1  — preview
 * GET /api-php/migrate_wa_to_crm.php?token=NWM_MIGRATE_2026         — run
 */

if (($_GET['token'] ?? '') !== 'NWM_MIGRATE_2026') {
    http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
}

require_once __DIR__ . '/lib/db.php'; // webmed6_nwm connection via config()

$dry = !empty($_GET['dry']);
$log = [];

// ── webmed6_nwm (source) ──────────────────────────────────────────────────────
$nwm = db(); // already connected to webmed6_nwm

// ── webmed6_crm (target) ──────────────────────────────────────────────────────
$cfg = config();
$crm = new PDO(
    'mysql:host=' . ($cfg['db_host'] ?? 'localhost') . ';dbname=webmed6_crm;charset=utf8mb4',
    $cfg['db_user'],
    $cfg['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

// ── Ensure whatsapp_sessions table exists ─────────────────────────────────────
try {
    $nwm->query("SELECT 1 FROM whatsapp_sessions LIMIT 1");
} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'error' => 'whatsapp_sessions table not found: ' . $e->getMessage()]);
    exit;
}

// ── Load unique phones ────────────────────────────────────────────────────────
$phones = $nwm->query("SELECT DISTINCT phone FROM whatsapp_sessions ORDER BY phone")->fetchAll(PDO::FETCH_COLUMN);
$log[]  = "Found " . count($phones) . " phone(s) in whatsapp_sessions";

foreach ($phones as $phone) {
    $stmt = $nwm->prepare("SELECT role, message, created_at FROM whatsapp_sessions WHERE phone = ? ORDER BY id ASC");
    $stmt->execute([$phone]);
    $turns = $stmt->fetchAll();
    if (!$turns) continue;

    $log[] = "\n$phone — " . count($turns) . " turns";
    if ($dry) continue;

    // Find or create contact in webmed6_crm
    $r = $crm->prepare('SELECT id, name FROM contacts WHERE phone = ? LIMIT 1');
    $r->execute([$phone]);
    $contact = $r->fetch();
    if ($contact) {
        $cid = (int)$contact['id'];
        $log[] = "  contact id=$cid exists";
    } else {
        $crm->prepare('INSERT INTO contacts (name, phone, status) VALUES (?, ?, ?)')->execute([$phone, $phone, 'lead']);
        $cid = (int)$crm->lastInsertId();
        $log[] = "  created contact id=$cid";
    }

    // Find or create conversation
    $r = $crm->prepare("SELECT id FROM conversations WHERE contact_id = ? AND channel = 'whatsapp' LIMIT 1");
    $r->execute([$cid]);
    $conv = $r->fetch();
    if ($conv) {
        $vid = (int)$conv['id'];
        $log[] = "  conversation id=$vid exists";
    } else {
        $crm->prepare(
            "INSERT INTO conversations (contact_id, channel, phone, subject, unread, created_at, updated_at) VALUES (?, 'whatsapp', ?, ?, 0, ?, ?)"
        )->execute([$cid, $phone, "WhatsApp: $phone", $turns[0]['created_at'], end($turns)['created_at']]);
        $vid = (int)$crm->lastInsertId();
        $log[] = "  created conversation id=$vid";
    }

    // Insert messages (dedup within 5s)
    $ins = $crm->prepare("INSERT INTO messages (conversation_id, sender, body, sent_at) VALUES (?, ?, ?, ?)");
    $dup = $crm->prepare("SELECT id FROM messages WHERE conversation_id = ? AND body = ? AND ABS(TIMESTAMPDIFF(SECOND, sent_at, ?)) < 5 LIMIT 1");
    $added = $skipped = 0;
    foreach ($turns as $t) {
        $dup->execute([$vid, $t['message'], $t['created_at']]);
        if ($dup->fetch()) { $skipped++; continue; }
        $ins->execute([$vid, $t['role'] === 'user' ? 'them' : 'me', $t['message'], $t['created_at']]);
        $added++;
    }

    $crm->prepare("UPDATE conversations SET updated_at = (SELECT MAX(sent_at) FROM messages WHERE conversation_id = ?) WHERE id = ?")->execute([$vid, $vid]);
    $log[] = "  added=$added skipped=$skipped";
}

$log[] = $dry ? "\nDRY RUN complete." : "\nMigration complete.";
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'dry' => $dry, 'log' => $log], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
