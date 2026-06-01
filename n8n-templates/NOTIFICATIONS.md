# Alternatives to Slack

Workflows `01-lead-capture-to-hubspot.json` and `02-daily-seo-audit-to-slack.json` post alerts to Slack by default. If you don't use Slack, swap in any of the channels below. All are supported natively by n8n or via a simple HTTP Request node.

## Quick recommendation

| If you use… | Swap to | Setup time |
|---|---|---|
| **Discord** (free, most popular Slack alternative) | Discord webhook | 2 minutes |
| **Microsoft Teams** (enterprise / Office 365 shops) | Teams webhook or n8n Teams node | 5 minutes |
| **Telegram** (mobile-first, great push reliability) | Telegram Bot API | 5 minutes |
| **WhatsApp Business** (LATAM / SMB US market) | Twilio WhatsApp API | 15 minutes |
| **Plain email** (no app at all) | n8n Email Send node (SMTP) | 2 minutes |
| **SMS text** (critical alerts only) | Twilio SMS | 10 minutes |
| **Self-hosted push** (no 3rd-party) | ntfy.sh or Gotify | 5 minutes |

**Our recommendation for NetWebMedia:** Discord for the team sales channel + Email for daily reports. Zero monthly cost, solid reliability, and the alert UX is nearly identical to Slack.

---

## 1. Discord (free, recommended)

**Setup:**
1. In your Discord server → right-click the channel → **Edit Channel** → **Integrations** → **Webhooks** → **New Webhook**
2. Copy the webhook URL (looks like `https://discord.com/api/webhooks/12345.../abc...`)

**Replace in workflow 01 (Slack: Alert Sales node):**

```json
{
  "method": "POST",
  "url": "DISCORD_WEBHOOK_URL_HERE",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"username\": \"NetWebMedia Alerts\",\n  \"embeds\": [{\n    \"title\": \"🔥 New Hot Lead — Score {{$json.score}}/100\",\n    \"color\": 16739871,\n    \"fields\": [\n      {\"name\": \"Name\", \"value\": \"{{$json.original.first_name}} {{$json.original.last_name}}\", \"inline\": true},\n      {\"name\": \"Company\", \"value\": \"{{$json.original.company}}\", \"inline\": true},\n      {\"name\": \"Service Fit\", \"value\": \"{{$json.service_fit}}\", \"inline\": true},\n      {\"name\": \"Budget\", \"value\": \"{{$json.original.budget}}\", \"inline\": true},\n      {\"name\": \"Message\", \"value\": \"{{$json.original.message}}\"}\n    ]\n  }]\n}"
}
```

That's the only change — rename the node to "Discord: Alert Sales".

---

## 2. Microsoft Teams

**Setup:**
1. In Teams → channel → **···** → **Connectors** → search **Incoming Webhook**
2. Name it "NetWebMedia Alerts" → copy the webhook URL

**Replace URL and body:**

```json
{
  "method": "POST",
  "url": "TEAMS_WEBHOOK_URL_HERE",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"@type\": \"MessageCard\",\n  \"@context\": \"https://schema.org/extensions\",\n  \"summary\": \"New Hot Lead\",\n  \"themeColor\": \"FF671F\",\n  \"title\": \"🔥 New Hot Lead — Score {{$json.score}}/100\",\n  \"sections\": [{\n    \"facts\": [\n      {\"name\": \"Name\", \"value\": \"{{$json.original.first_name}} {{$json.original.last_name}}\"},\n      {\"name\": \"Company\", \"value\": \"{{$json.original.company}}\"},\n      {\"name\": \"Service Fit\", \"value\": \"{{$json.service_fit}}\"},\n      {\"name\": \"Budget\", \"value\": \"{{$json.original.budget}}\"}\n    ],\n    \"text\": \"{{$json.original.message}}\"\n  }]\n}"
}
```

n8n also ships a built-in **Microsoft Teams** node (`n8n-nodes-base.microsoftTeams`) if you prefer OAuth over webhooks.

---

## 3. Telegram

**Setup:**
1. Message `@BotFather` on Telegram → `/newbot` → follow prompts → copy the **bot token**
2. Add your new bot to a group (or DM it) → send any message
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` → copy the `chat.id` value

**Replace the Slack node with:**

```json
{
  "method": "POST",
  "url": "=https://api.telegram.org/bot{{ $credentials.telegramBotToken }}/sendMessage",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"chat_id\": \"YOUR_CHAT_ID\",\n  \"parse_mode\": \"Markdown\",\n  \"text\": \"🔥 *New Hot Lead — Score {{$json.score}}/100*\\n\\n*Name:* {{$json.original.first_name}} {{$json.original.last_name}}\\n*Company:* {{$json.original.company}}\\n*Service Fit:* {{$json.service_fit}}\\n*Budget:* {{$json.original.budget}}\\n\\n_{{$json.original.message}}_\"\n}"
}
```

n8n also has a first-class **Telegram** node — even easier if you use credentials.

---

## 4. Plain Email (zero-setup fallback)

Replace the Slack HTTP Request node with n8n's built-in **Email Send** node:

```json
{
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "alerts@netwebmedia.com",
    "toEmail": "sales@netwebmedia.com",
    "subject": "=🔥 New Hot Lead — {{ $json.original.company }} ({{ $json.score }}/100)",
    "text": "=Name: {{ $json.original.first_name }} {{ $json.original.last_name }}\nCompany: {{ $json.original.company }}\nEmail: {{ $json.original.email }}\nService Fit: {{ $json.service_fit }}\nBudget: {{ $json.original.budget }}\n\nMessage:\n{{ $json.original.message }}"
  },
  "credentials": {
    "smtp": { "id": "CRED_SMTP", "name": "NetWebMedia SMTP" }
  }
}
```

Works with Gmail app passwords, any SMTP server, SendGrid, Mailgun, Amazon SES, etc.

---

## 5. SMS via Twilio

**Setup:** Twilio account → buy a number ($1/mo) → grab Account SID + Auth Token.

```json
{
  "type": "n8n-nodes-base.twilio",
  "parameters": {
    "resource": "sms",
    "operation": "send",
    "from": "+1XXXXXXXXXX",
    "to": "+1YYYYYYYYYY",
    "message": "=🔥 Hot lead {{ $json.score }}/100: {{ $json.original.first_name }} @ {{ $json.original.company }}. Check HubSpot."
  }
}
```

Cost: ~$0.0079 per SMS. Best for genuinely urgent alerts only.

---

## 6. WhatsApp Business (Twilio)

Same as Twilio SMS above, but set `from` to `whatsapp:+14155238886` (Twilio's sandbox) or your approved business number. You'll need the Twilio WhatsApp Business Channel verified first.

---

## 7. Self-Hosted Push: ntfy.sh or Gotify

**ntfy.sh (free, public or self-hosted):**

```json
{
  "method": "POST",
  "url": "https://ntfy.sh/netwebmedia-leads",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      { "name": "Title", "value": "=Hot Lead: {{ $json.original.company }}" },
      { "name": "Priority", "value": "high" },
      { "name": "Tags", "value": "fire,money_with_wings" }
    ]
  },
  "sendBody": true,
  "specifyBody": "string",
  "body": "={{$json.original.first_name}} {{$json.original.last_name}} ({{$json.score}}/100) — {{$json.service_fit}} — {{$json.original.budget}}"
}
```

Install the free **ntfy** app on your phone, subscribe to `netwebmedia-leads`, and push notifications arrive instantly. Self-host if you want privacy.

---

## Deciding which to pick

**For NetWebMedia specifically (US market, SMB clients):**

1. **Primary sales alerts (workflow 01):** Discord — your team probably already uses it, setup is 2 minutes, the embed UX is great for lead cards.
2. **Daily SEO reports (workflow 02):** Email to `reports@netwebmedia.com` — daily digests belong in email, not chat. Plus it's searchable later.
3. **Critical outage alerts (future):** ntfy.sh or Twilio SMS — bypasses chat entirely and pings your phone directly.

Mix and match. All three replacements are drop-in for the existing Slack node — same trigger, same data, different delivery.
