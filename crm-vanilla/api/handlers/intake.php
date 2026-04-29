<?php
/**
 * AI Intake Agent — qualifies leads using Claude, saves to CRM, pushes to HubSpot.
 *
 * POST /api/?r=intake
 * Body: {first_name, last_name, email, company, budget, service_interest, message, source?}
 *
 * Returns: {ok, lead_id, score, service_fit, reply, hubspot_id}
 *
 * Requires: ANTHROPIC_API_KEY (optional — falls back to heuristic scoring if missing)
 *           HUBSPOT_TOKEN (optional — skips HS push if missing)
 */

// Rate limit: 5 intakes per 5 min per IP — Anthropic spend protection
require_once __DIR__ . '/../lib/rate_limit.php';
rate_limit('intake', 5, 300);

if ($method !== 'POST') jsonError('POST required', 405);
$data = getInput();

// --- Validate ---
$first  = trim($data['first_name'] ?? '');
$last   = trim($data['last_name']  ?? '');
$email  = trim($data['email']      ?? '');
$company = trim($data['company']   ?? '');
$budget = trim($data['budget']     ?? '');
$svcInt = trim($data['service_interest'] ?? '');
$msg    = trim($data['message']    ?? '');
$source = trim($data['source'] ?? 'contact_form');
if (!$email || !$first) jsonError('first_name and email required');
$fullName = trim("$first $last") ?: $email;

// --- Call Claude for qualification ---
function ai_qualify(array $lead): array {
    if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '') {
        // Heuristic fallback
        $score = 40;
        $budgetScore = ['5k'=>10, '10k'=>25, '25k'=>40, '50k'=>55, '50k+'=>60];
        $score += $budgetScore[$lead['budget']] ?? 0;
        if (!empty($lead['company']))  $score += 10;
        if (strlen($lead['message']) > 100) $score += 15;
        $score = min(100, $score);
        return [
            'score' => $score,
            'service_fit' => $lead['service_interest'] ?: 'ai-seo',
            'reply' => "Hi " . ($lead['first_name'] ?? 'there') . ", thanks for reaching out to NetWebMedia! We received your message and a strategist will be in touch within 24 hours with a personalized plan. In the meantime, feel free to explore our free website analyzer at netwebmedia.com/analytics.html.",
            'source' => 'heuristic',
        ];
    }

    $systemPrompt = "You are NetWebMedia's AI sales qualification assistant. NetWebMedia is an AI marketing agency serving US brands (primary market: United States) with 7 services: ai-automations, ai-agents, crm, ai-websites, paid-ads, ai-seo, social. For each inbound lead, return STRICT JSON only with keys: score (0-100 integer reflecting budget + intent + fit), service_fit (one of the 7 service slugs), reply (warm, specific 3-sentence reply in the same language as the message; mention the recommended service by name; sign as 'The NetWebMedia team'). No prose outside the JSON.";

    $userPrompt = "Lead:\n"
        . "Name: {$lead['first_name']} {$lead['last_name']}\n"
        . "Email: {$lead['email']}\n"
        . "Company: {$lead['company']}\n"
        . "Budget: {$lead['budget']}\n"
        . "Service interest: {$lead['service_interest']}\n"
        . "Message: {$lead['message']}";

    $payload = [
        'model' => 'claude-sonnet-4-5-20250929',
        'max_tokens' => 600,
        'system' => $systemPrompt,
        'messages' => [['role' => 'user', 'content' => $userPrompt]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'x-api-key: ' . ANTHROPIC_API_KEY,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
        CURLOPT_TIMEOUT => 25,
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) return ai_qualify(array_merge($lead, ['_bypass' => true]));
    $json = json_decode($raw, true);
    $text = $json['content'][0]['text'] ?? '';
    // Strip markdown fences if any
    $text = preg_replace('/^```(?:json)?|```$/mi', '', trim($text));
    $parsed = json_decode($text, true);
    if (!is_array($parsed)) return ai_qualify(array_merge($lead, ['_bypass' => true]));
    $parsed['source'] = 'claude';
    return $parsed;
}

// --- Run the AI ---
$lead = compact('first','last','email','company','budget','svcInt','msg');
$aiInput = [
    'first_name' => $first, 'last_name' => $last, 'email' => $email,
    'company' => $company, 'budget' => $budget,
    'service_interest' => $svcInt, 'message' => $msg,
];
$qual = ai_qualify($aiInput);

// --- Save to CRM ---
$db = getDB();
$status = $qual['score'] >= 70 ? 'prospect' : 'lead';
$notes = "AI Score: {$qual['score']}\nService Fit: {$qual['service_fit']}\nSource: $source\n\nMessage:\n$msg";

$stmt = $db->prepare('INSERT INTO contacts (name,email,phone,company,status,value,notes) VALUES (?,?,?,?,?,?,?)');
$stmt->execute([$fullName, $email, null, $company, $status, 0, $notes]);
$leadId = $db->lastInsertId();

// Also to leads table for demo-tracking
try {
    $db->prepare('INSERT INTO leads (name,email,company,source) VALUES (?,?,?,?)
                  ON DUPLICATE KEY UPDATE name=VALUES(name), company=VALUES(company)')
       ->execute([$fullName, $email, $company, $source]);
} catch (Exception $e) { /* ignore */ }

// --- Push to HubSpot if available ---
$hubspotId = null;
if (defined('HUBSPOT_TOKEN') && HUBSPOT_TOKEN !== '') {
    require_once __DIR__ . '/../lib/hubspot_client.php';
    $hubspotId = hs_upsert_contact([
        'name'    => $fullName,
        'email'   => $email,
        'company' => $company,
        'status'  => $status,
    ]);
}

jsonResponse([
    'ok'          => true,
    'lead_id'     => (int)$leadId,
    'score'       => $qual['score'],
    'service_fit' => $qual['service_fit'],
    'reply'       => $qual['reply'],
    'hubspot_id'  => $hubspotId,
    'ai_source'   => $qual['source'] ?? 'heuristic',
]);
