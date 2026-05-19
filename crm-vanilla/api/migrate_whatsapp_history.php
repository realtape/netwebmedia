<?php
/**
 * One-shot: import whatsapp_sessions from webmed6_nwm into crm-vanilla conversations.
 * GET  /crm-vanilla/api/migrate_whatsapp_history.php?token=NWM_MIGRATE_2026&dry=1  — preview
 * GET  /crm-vanilla/api/migrate_whatsapp_history.php?token=NWM_MIGRATE_2026        — run
 */

require_once __DIR__ . '/config.php';

if (($_GET['token'] ?? '') !== 'NWM_MIGRATE_2026') {
    http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit;
}

$dry = !empty($_GET['dry']);
$log = [];

// ── Two DB connections ────────────────────────────────────────────────────────

$crmDb = getDB(); // webmed6_crm (crm-vanilla)

// webmed6_nwm uses the same host/user/pass — only DB name differs
$nwmDb = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=webmed6_nwm;charset=utf8mb4',
    DB_USER, DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

// ── Load sessions grouped by phone ───────────────────────────────────────────

$phones = $nwmDb->query(
    "SELECT DISTINCT phone FROM whatsapp_sessions ORDER BY phone"
)->fetchAll(PDO::FETCH_COLUMN);

$log[] = "Found " . count($phones) . " unique phone(s) in whatsapp_sessions";

foreach ($phones as $phone) {
    // Get all turns for this phone in chronological order
    $stmt = $nwmDb->prepare(
        "SELECT role, message, created_at FROM whatsapp_sessions
          WHERE phone = ? ORDER BY id ASC"
    );
    $stmt->execute([$phone]);
    $turns = $stmt->fetchAll();

    if (empty($turns)) continue;

    $log[] = "\nPhone $phone — " . count($turns) . " turn(s)";

    if ($dry) { continue; }

    // Find or create contact
    $row = $crmDb->prepare('SELECT id, name FROM contacts WHERE phone = ? LIMIT 1');
    $row->execute([$phone]);
    $contact = $row->fetch();

    if ($contact) {
        $contactId = (int)$contact['id'];
        $log[] = "  contact exists: id=$contactId {$contact['name']}";
    } else {
        $crmDb->prepare('INSERT INTO contacts (name, phone, status) VALUES (?, ?, ?)')->execute([$phone, $phone, 'lead']);
        $contactId = (int)$crmDb->lastInsertId();
        $log[] = "  created contact id=$contactId";
    }

    // Find or create whatsapp conversation
    $row = $crmDb->prepare("SELECT id FROM conversations WHERE contact_id = ? AND channel = 'whatsapp' LIMIT 1");
    $row->execute([$contactId]);
    $conv = $row->fetch();

    if ($conv) {
        $convId = (int)$conv['id'];
        $log[] = "  conversation exists: id=$convId";
    } else {
        $crmDb->prepare(
            "INSERT INTO conversations (contact_id, channel, phone, subject, unread, created_at, updated_at) VALUES (?, 'whatsapp', ?, ?, 0, ?, ?)"
        )->execute([
            $contactId,
            $phone,
            "WhatsApp: $phone",
            $turns[0]['created_at'],
            end($turns)['created_at'],
        ]);
        $convId = (int)$crmDb->lastInsertId();
        $log[] = "  created conversation id=$convId";
    }

    // Insert messages (skip duplicates by body+sent_at within 5s)
    $inserted = 0;
    $skipped  = 0;
    $insStmt  = $crmDb->prepare(
        "INSERT INTO messages (conversation_id, sender, body, sent_at) VALUES (?, ?, ?, ?)"
    );
    $dupStmt  = $crmDb->prepare(
        "SELECT id FROM messages WHERE conversation_id = ? AND body = ? AND ABS(TIMESTAMPDIFF(SECOND, sent_at, ?)) < 5 LIMIT 1"
    );
    foreach ($turns as $t) {
        $sender = $t['role'] === 'user' ? 'them' : 'me';
        $dupStmt->execute([$convId, $t['message'], $t['created_at']]);
        if ($dupStmt->fetch()) { $skipped++; continue; }
        $insStmt->execute([$convId, $sender, $t['message'], $t['created_at']]);
        $inserted++;
    }

    // Update conversation timestamps
    $crmDb->prepare(
        "UPDATE conversations SET updated_at = (SELECT MAX(sent_at) FROM messages WHERE conversation_id = ?) WHERE id = ?"
    )->execute([$convId, $convId]);

    $log[] = "  inserted=$inserted skipped=$skipped";
}

$log[] = $dry ? "\nDRY RUN — nothing written." : "\nDone.";

header('Content-Type: application/json');
echo json_encode(['ok' => true, 'dry' => $dry, 'log' => $log], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
