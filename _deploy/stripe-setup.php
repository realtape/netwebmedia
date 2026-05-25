<?php
/*
  NetWebMedia — One-time Stripe config injector.
  USAGE:
    1. Fill in your Stripe keys below (STEP 1).
    2. Upload this file to https://netwebmedia.com/_deploy/stripe-setup.php
    3. Open it in your browser (or run: curl https://netwebmedia.com/_deploy/stripe-setup.php?run=1)
    4. DELETE this file from the server immediately after — it contains secrets.

  CONFIG PATH: /home/webmed6/.netwebmedia-config.php
*/

// ─────────────────────────────────────────────
//  STEP 1 — Paste your Stripe keys here
// ─────────────────────────────────────────────
$STRIPE_SECRET_KEY      = 'sk_live_REPLACE_ME';   // Stripe Dashboard → Developers → API Keys → Secret key
$STRIPE_PUBLISHABLE_KEY = 'pk_live_REPLACE_ME';   // Stripe Dashboard → Developers → API Keys → Publishable key
$STRIPE_WEBHOOK_SECRET  = 'whsec_REPLACE_ME';     // Stripe Dashboard → Developers → Webhooks → endpoint secret

// ─────────────────────────────────────────────
//  Safety check — abort if keys are still placeholders
// ─────────────────────────────────────────────
$CONFIG_PATH = '/home/webmed6/.netwebmedia-config.php';

header('Content-Type: text/plain');

if (strpos($STRIPE_SECRET_KEY, 'REPLACE_ME') !== false) {
  die("[ERROR] You forgot to fill in your Stripe keys. Edit this file first.\n");
}

if (!file_exists($CONFIG_PATH)) {
  die("[ERROR] Config file not found at: $CONFIG_PATH\n");
}

// ─────────────────────────────────────────────
//  Load current config
// ─────────────────────────────────────────────
$cfg = require $CONFIG_PATH;

if (!is_array($cfg)) {
  die("[ERROR] Config file did not return an array.\n");
}

// ─────────────────────────────────────────────
//  Merge Stripe keys
// ─────────────────────────────────────────────
$cfg['stripe_secret_key']      = $STRIPE_SECRET_KEY;
$cfg['stripe_publishable_key'] = $STRIPE_PUBLISHABLE_KEY;
$cfg['stripe_webhook_secret']  = $STRIPE_WEBHOOK_SECRET;

// ─────────────────────────────────────────────
//  Write updated config
// ─────────────────────────────────────────────
$export = var_export($cfg, true);
$php    = "<?php\nreturn $export;\n";

$bytes = file_put_contents($CONFIG_PATH, $php);
if ($bytes === false) {
  die("[ERROR] Could not write to $CONFIG_PATH — check file permissions.\n");
}

// ─────────────────────────────────────────────
//  Verify Stripe connection
// ─────────────────────────────────────────────
$ch = curl_init('https://api.stripe.com/v1/account');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => 1,
  CURLOPT_USERPWD        => $STRIPE_SECRET_KEY . ':',
  CURLOPT_TIMEOUT        => 10,
]);
$res  = json_decode(curl_exec($ch), true);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "[OK] Config written to $CONFIG_PATH ($bytes bytes)\n\n";

if ($code === 200 && !empty($res['id'])) {
  echo "[OK] Stripe connection verified!\n";
  echo "     Account: " . ($res['email'] ?? $res['id']) . "\n";
  echo "     Country: " . ($res['country'] ?? '?') . "\n";
  echo "     Mode:    " . ($res['livemode'] ? 'LIVE' : 'TEST') . "\n\n";
} else {
  echo "[WARN] Could not verify Stripe connection (HTTP $code).\n";
  echo "       Response: " . json_encode($res) . "\n\n";
}

echo "Keys added:\n";
echo "  stripe_secret_key:      " . substr($STRIPE_SECRET_KEY, 0, 12) . "...\n";
echo "  stripe_publishable_key: " . substr($STRIPE_PUBLISHABLE_KEY, 0, 12) . "...\n";
echo "  stripe_webhook_secret:  " . substr($STRIPE_WEBHOOK_SECRET, 0, 10) . "...\n\n";
echo "NEXT STEP: Delete this file from the server NOW.\n";
echo "  rm /home/webmed6/public_html/_deploy/stripe-setup.php\n\n";
echo "WEBHOOK endpoint to register in Stripe Dashboard:\n";
echo "  https://netwebmedia.com/api/catalogue/webhook/stripe\n";
echo "  Events: checkout.session.completed\n";
