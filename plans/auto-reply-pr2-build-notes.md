# Auto-Reply PR 2 — Build Notes

## Files created
- `crm-vanilla/api/lib/kb.php` — 159 LOC. KB loader with mtime cache + 1MB cap.
- `crm-vanilla/api/handlers/ai_draft_reply.php` — 624 LOC. Pure-function drafter + thin HTTP wrapper, self-contained.

## File modified
- `crm-vanilla/api/index.php` — single-line addition to the `$handlers` map.

```diff
     'workflows'             => __DIR__ . '/handlers/workflows.php',
+    'ai_draft_reply'        => __DIR__ . '/handlers/ai_draft_reply.php',
     'wa_flush'              => __DIR__ . '/handlers/wa_flush.php',
```

The route inherits the existing auth gate (not in `$public_routes`) and the same-origin CSRF check (POST and not in `$token_write_routes`). No other index.php changes.

## Deviations from spec
1. **Model name.** Used `claude-sonnet-4-6` per the brief, not the `claude-3-5-sonnet-latest` string in spec §3 — brief says spec was written against an older name.
2. **KB schema accessors extended** beyond spec §2 to expose the richer kb.json shape: `kb_company_facts`, `kb_pricing_facts`, `kb_human_required_topics`, `kb_blocked_tags`, `kb_holding_reply`, `kb_safety_rules`. Each is documented with a 1-line contract at the top of the file. `kb_search` returns extra fields (`label`, `answer_en`, `answer_es`, `links`, `auto_send_eligible`) on top of the spec's `{topic_id, score, snippet}` so the drafter can build a strong system prompt without a second KB pass.
3. **Lang detection is local, not from the KB.** A naive regex sweep on the latest inbound (diacritics + common ES stopwords) picks `en|es`. The model is told the detected lang and may override via the tool call's `lang` field.
4. **Channel field on tool schema is conditional** — only emails get `subject`. The tool definition omits the property entirely on sms/whatsapp/ig_dm so the model can't return one.

## Security decisions
- **CSP / SSRF / XSS:** N/A — handler is server-side JSON only. No user-supplied URLs are fetched (`url_guard` not needed; KB `links` are read-only display strings, not fetched).
- **Prompt injection:** inbound bodies wrapped in `<inbound_message>` tags + system instruction declaring tag content untrusted. Outbound (us) bodies are NOT wrapped — they are our own copy and trusted.
- **Belt-and-suspenders denylist:** six regex patterns sweep raw inbound regardless of model output (refund, cancel, legal, competitor, compliance, discount). Any hit forces `requires_human=true` with `human_reason='regex_denylist:<label>'`.
- **Tag check:** `contacts.tags` (comma-separated) is intersected with `kb_blocked_tags()`. Any overlap forces `requires_human=true` with `human_reason='blocked_tag:<tag>'`. The model cannot override either of these gates.
- **Tenancy:** ownership of the conversation enforced at the route entry via `tenancy_where('conv')`. Cross-tenant `id` probes return 404, not 403 (avoids enumeration leak).
- **Admin gate:** `require_org_access_for_write('admin')` — drafter spends Anthropic tokens, blocks members.
- **PII / log hygiene:** error_log lines never contain raw inbound body, draft body, or full Anthropic response — only labels (`http_503`, `attempt=2`, audit codes).
- **TLS:** `CURLOPT_SSL_VERIFYPEER => true`, `CURLOPT_SSL_VERIFYHOST => 2`. Production CA bundle works on InMotion.
- **Idempotency:** read-only check against `conversation_drafts` for `(conversation_id, source='ai', created_at > NOW() - INTERVAL 60 SECOND)`. Drafter never inserts. Lazy `CREATE TABLE IF NOT EXISTS` mirrors `schema_conversation_drafts.sql` so the route works on a fresh DB before migrate runs.
- **Tool-use schema** with `tool_choice: {type: 'tool', name: 'submit_draft'}` forces structured output. Free-text "ignore previous instructions" cannot escape the tool envelope. Topic value is allowlist-validated against KB topic IDs server-side; anything else collapses to `kb_gap` which forces `requires_human=true`.
- **Failure path is structured, never thrown:** on timeout, 4xx, 5xx-after-retry, parse error, or missing tool_use block, the drafter returns the canonical fallback shape with `confidence=0`, `topic='error'`, `requires_human=true`, `human_reason='drafter_error'` and a populated `audit_blob.error`. The PR 3 workflow step receives this and routes to approval; it never auto-sends a failed draft.

## Smoke test
After the next deploy, Carlos can verify:

```bash
curl -sS -X POST 'https://netwebmedia.com/crm-vanilla/api/?r=ai_draft_reply&action=draft' \
     -H 'Content-Type: application/json' \
     -H 'Origin: https://netwebmedia.com' \
     -H 'Referer: https://netwebmedia.com/crm-vanilla/' \
     -H 'X-Auth-Token: <admin token>' \
     --data '{"conversation_id": <existing conv id>}' | jq
```

Expected: HTTP 200, body has `draft`, `confidence`, `topic`, `audit_blob.tokens_in > 0`, `audit_blob.prompt_hash` starts with `sha256:`. If `tokens_in == 0` and `audit_blob.error` is set, Anthropic call failed — check error_log for the labelled failure.

If the response is 503 `{error: 'anthropic_not_configured'}`, the deploy didn't write `ANTHROPIC_API_KEY` into `crm-vanilla/api/config.local.php`. Confirm the GitHub Secret is populated and redeploy.

## Blockers / inputs needed before PR 3 starts
None of the open questions in spec §14 block PR 3's workflow step from being written, but items 1, 2, 4, 5, 7 will be needed before activation:

1. **Operator phone secret name** for the WhatsApp approval push (spec §14.1) — not used by PR 2 but PR 3's `push_for_approval` step will need it.
2. **Race-condition resolution** between WhatsApp approve and CRM reject (§14.2) — affects the workflow step's send guard, not the drafter.
4. **Non-EN/ES inbound policy** (§14.4) — current behavior: lang detector falls back to `en` and the drafter will still produce something; safety rule #4 in kb.json instructs the model to set `requires_human=true` for non-EN/ES messages, which is consistent with recommendation (a). Confirm before flipping shadow off.
5. **Holding reply persona / final string** (§14.5) — kb.json already ships a default; auto_reply_config can override per-tenant. PR 3's holding step will read from the config row, not the KB.
7. **Confidence threshold default** (§14.7) — auto_reply_config defaults to 0.850; doesn't block PR 2.

No PR 2 blockers — handler is shippable as-is.
