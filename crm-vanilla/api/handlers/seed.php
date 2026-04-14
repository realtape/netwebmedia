<?php
if ($method !== 'POST') jsonError('Use POST to seed data', 405);

$db = getDB();

// Check if already seeded
$count = (int)$db->query('SELECT COUNT(*) FROM contacts')->fetchColumn();
if ($count > 0) jsonError('Database already has data. Truncate tables first if you want to re-seed.');

// Seed contacts
$contacts = [
    ['Sofia Martinez', 'sofia@latamgroup.com', '+56 9 8765 4321', 'LATAM Group', 'Marketing Director', 'customer', 24500, '2026-04-10'],
    ['Carlos Mendoza', 'carlos@techwave.cl', '+56 2 2345 6789', 'TechWave Chile', 'CEO', 'customer', 18200, '2026-04-08'],
    ['Isabella Torres', 'isabella@greenleaf.com', '+56 9 1234 5678', 'GreenLeaf Organics', 'Brand Manager', 'prospect', 12800, '2026-04-07'],
    ['Diego Ramirez', 'diego@novalabs.io', '+56 9 5555 1234', 'NovaLabs', 'CTO', 'lead', 8400, '2026-04-12'],
    ['Valentina Cruz', 'valentina@skyport.cl', '+56 2 9876 5432', 'SkyPort Logistics', 'VP Sales', 'customer', 32100, '2026-04-05'],
    ['Mateo Silva', 'mateo@andeanventures.com', '+56 9 7777 8888', 'Andean Ventures', 'Founder', 'prospect', 15600, '2026-04-09'],
    ['Camila Rojas', 'camila@blueocean.cl', '+56 2 3456 7890', 'BlueOcean Digital', 'CMO', 'customer', 21300, '2026-03-28'],
    ['Sebastian Flores', 'seb@rapidgrow.io', '+56 9 4444 3333', 'RapidGrow', 'Growth Lead', 'lead', 6200, '2026-04-11'],
    ['Lucia Herrera', 'lucia@solarpeak.cl', '+56 2 6789 0123', 'SolarPeak Energy', 'Director', 'prospect', 28900, '2026-04-01'],
    ['Alejandro Vega', 'alex@cloudpulse.com', '+56 9 2222 4444', 'CloudPulse', 'Head of Marketing', 'churned', 9800, '2026-02-15'],
    ['Renata Diaz', 'renata@freshbite.cl', '+56 2 8901 2345', 'FreshBite Foods', 'Owner', 'lead', 4200, '2026-04-13'],
    ['Nicolas Paredes', 'nico@urbanhub.io', '+56 9 6666 7777', 'UrbanHub', 'Co-Founder', 'prospect', 19400, '2026-04-06'],
];

$stmt = $db->prepare('INSERT INTO contacts (name, email, phone, company, role, status, value, last_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($contacts as $c) {
    $stmt->execute($c);
}

// Seed deals (stages 1-7 already exist from schema)
$deals = [
    ['LATAM Group Full Rebrand', 'LATAM Group', 24500, 1, 6, 95, 2],
    ['TechWave SEO Campaign', 'TechWave Chile', 8400, 2, 4, 60, 5],
    ['GreenLeaf Social Launch', 'GreenLeaf Organics', 12800, 3, 3, 45, 3],
    ['NovaLabs Landing Pages', 'NovaLabs', 6200, 4, 2, 30, 8],
    ['SkyPort Ad Campaign', 'SkyPort Logistics', 15000, 5, 5, 70, 4],
    ['Andean Ventures Branding', 'Andean Ventures', 9800, 6, 4, 55, 6],
    ['BlueOcean Content Strategy', 'BlueOcean Digital', 21300, 7, 6, 90, 1],
    ['RapidGrow PPC', 'RapidGrow', 4800, 8, 1, 15, 12],
    ['SolarPeak Website', 'SolarPeak Energy', 28900, 9, 3, 40, 7],
    ['CloudPulse Email Flows', 'CloudPulse', 7200, 10, 7, 5, 20],
    ['FreshBite Menu Redesign', 'FreshBite Foods', 3500, 11, 2, 25, 3],
    ['UrbanHub App Marketing', 'UrbanHub', 19400, 12, 5, 75, 2],
    ['LATAM Group Q2 Ads', 'LATAM Group', 18000, 1, 4, 65, 1],
    ['TechWave Chatbot Build', 'TechWave Chile', 12000, 2, 1, 10, 15],
];

$stmt = $db->prepare('INSERT INTO deals (title, company, contact_id, value, stage_id, probability, days_in_stage) VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach ($deals as $d) {
    // d[0]=title, d[1]=company, d[2]=value, d[3]=contact_id, d[4]=stage_id, d[5]=prob, d[6]=days
    $stmt->execute([$d[0], $d[1], $d[3], $d[2], $d[4], $d[5], $d[6]]);
}

// Seed conversations
$convos = [
    [1, 'email', 'Q2 Campaign Strategy', 0],
    [2, 'whatsapp', null, 1],
    [3, 'email', 'Proposal Follow-up', 1],
    [5, 'sms', null, 0],
    [6, 'email', 'Brand Discovery Call', 0],
    [4, 'whatsapp', null, 1],
];

$stmtConv = $db->prepare('INSERT INTO conversations (contact_id, channel, subject, unread) VALUES (?, ?, ?, ?)');
$stmtMsg = $db->prepare('INSERT INTO messages (conversation_id, sender, body, sent_at) VALUES (?, ?, ?, ?)');

$convMessages = [
    1 => [
        ['them', 'Hi! Just wanted to check in on the Q2 campaign timeline.', '2026-04-14 09:15:00'],
        ['me', 'Hey Sofia! We are on track. Creative briefs go out this Friday.', '2026-04-14 09:22:00'],
        ['them', 'Perfect. Can we add a TikTok component?', '2026-04-14 09:30:00'],
    ],
    2 => [
        ['them', 'Carlos here. The SEO report looks great, just one question about the keyword clusters.', '2026-04-13 14:00:00'],
        ['me', 'Sure, which cluster?', '2026-04-13 14:05:00'],
        ['them', 'The long-tail group for enterprise SaaS terms.', '2026-04-13 14:08:00'],
        ['me', 'Good catch. Let me send you the expanded analysis by EOD.', '2026-04-13 14:12:00'],
    ],
    3 => [
        ['me', 'Hi Isabella, following up on the social media proposal we sent last week.', '2026-04-12 11:00:00'],
        ['them', 'Thanks for following up! We are reviewing internally. Should have an answer by Wednesday.', '2026-04-12 16:30:00'],
    ],
    4 => [
        ['me', 'Hi Valentina, your ad campaign is live! Here are the first 24h metrics.', '2026-04-14 08:00:00'],
        ['them', 'Wow, 3.2% CTR already? That is amazing!', '2026-04-14 08:45:00'],
    ],
    5 => [
        ['them', 'Mateo from Andean Ventures. When can we schedule the brand discovery call?', '2026-04-11 10:00:00'],
        ['me', 'How about Thursday 2pm?', '2026-04-11 10:30:00'],
        ['them', 'Works for me. Send me the calendar invite.', '2026-04-11 10:35:00'],
    ],
    6 => [
        ['them', 'Hey, Diego here. Can you send me the landing page mockups?', '2026-04-14 07:30:00'],
        ['me', 'Sure, they are almost ready. Give me 2 hours.', '2026-04-14 07:45:00'],
        ['them', 'No rush, just whenever you can.', '2026-04-14 07:50:00'],
    ],
];

foreach ($convos as $i => $c) {
    $stmtConv->execute($c);
    $convId = $i + 1;
    if (isset($convMessages[$convId])) {
        foreach ($convMessages[$convId] as $msg) {
            $stmtMsg->execute([$convId, $msg[0], $msg[1], $msg[2]]);
        }
    }
}

// Seed calendar events
$events = [
    ['Sofia - Campaign Review', '2026-04-14', 10, 1, 'meeting', '#6c5ce7', 1],
    ['Carlos - SEO Check-in', '2026-04-14', 14, 0.5, 'call', '#00cec9', 2],
    ['Team Standup', '2026-04-14', 9, 0.5, 'meeting', '#6c5ce7', null],
    ['Isabella Follow-up Call', '2026-04-15', 11, 0.5, 'call', '#00cec9', 3],
    ['Content Calendar Review', '2026-04-15', 15, 1, 'task', '#fdcb6e', null],
    ['SkyPort Campaign Launch', '2026-04-16', 10, 2, 'meeting', '#6c5ce7', 5],
    ['Mateo - Brand Discovery', '2026-04-17', 14, 1.5, 'meeting', '#6c5ce7', 6],
    ['Social Media Training', '2026-04-17', 10, 2, 'training', '#e17055', null],
    ['SolarPeak Website Review', '2026-04-18', 11, 1, 'meeting', '#6c5ce7', 9],
    ['Weekly Analytics Report', '2026-04-18', 15, 1, 'task', '#fdcb6e', null],
];

$stmtEvent = $db->prepare('INSERT INTO events (title, event_date, start_hour, duration, type, color, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach ($events as $e) {
    $stmtEvent->execute($e);
}

jsonResponse(['seeded' => true, 'contacts' => count($contacts), 'deals' => count($deals), 'conversations' => count($convos), 'events' => count($events)]);
