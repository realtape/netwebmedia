# Auto-Reply PR 3 — Build Notes

**Status:** Engine extended; production-safe (silent fallthrough on trigger errors); awaiting PR 4 (channel adapter refactor) and PR 5 (real WhatsApp push).
**Date:** 2026-05-01

## Files modified

- `crm-vanilla/api/lib/wf_crm.php` — added 5 step types, hardcoded denylist constants, 3 helpers, honored `$advanceIdx=false` in tail logic for self-looping holding step. (~430 LOC added.)
- `crm-vanilla/api/handlers/workflows.php` — appended 5 step types to `$ALLOWED_STEP_TYPES`; added `conversation_inbound` to `$ALLOWED_TRIGGERS`; per-type config sanitization for the 5 new steps. (~50 LOC added.)
- `crm-vanilla/api/handlers/messages.php` — fired `wf_crm_trigger('conversation_inbound', …)` after `lastInsertId()` when `$sender === 'them'`. Wrapped in try/catch — inbound persistence ALWAYS succeeds even if engine throws. Hydrates trigger ctx from a single in-DB SELECT. (~40 LOC added.)
- `crm-vanilla/api/handlers/ai_draft_reply.php` — wrapped route dispatcher in `AI_DRAFT_REPLY_AS_LIBRARY` sentinel guard. PHP function/const hoisting means library-mode include only registers the callable surface and skips the `$method`/`jsonError`/`exit` machinery. (~10 LOC, structural.)
- `api-php/routes/whatsapp.php` — new `wa_mirror_to_crm()` helper opens a SECOND PDO bound to `webmed6_crm`, performs idempotent contact/conversation/message upsert, returns the IDs the trigger needs. Trigger fire wired into `wa_generate_reply` after `wa_save_turn`. (~140 LOC added.)

## Deviations from spec

1. **Engine `$advanceIdx` honor** — the existing `wf_crm.php` declared `$advanceIdx` but never read it. Required to make `holding_reply_if_no_approval` self-loop after a wait. One-line tail change: `$nextIdx = $advanceIdx ? ($idx + 1) : $idx;`. Doesn't affect any pre-existing step (all defaulted to `true`).
2. **Sentinel guard on `ai_draft_reply.php`** — spec said "no new files," but the existing handler runs route-dispatch on `require_once`. Cleanest minimum-impact fix: an `if (defined(SENTINEL))` guard that lets the same file act as both route AND library. No behavior change for the route path.
3. **`route_by_confidence` veto count** — spec described 4 sources of veto; I implemented 7 (added IG-DM channel force-approval, tenant denylist topics, tenant allowlist topics). All additive — no source weakens the check.
4. **`auto_reply_config` cache** — static per-request cache keyed by org. Cheap and correct for cron-tick lifetime; spec didn't mention but it avoids re-querying for every run on the same org in one batch.

## Security decisions

1. **Cross-DB mirror — second PDO, never JOIN.** `wa_mirror_to_crm()` instantiates a brand-new `PDO('mysql:dbname=webmed6_crm', 'webmed6_crm', DB_PASS)`. Static cached for the request. CLAUDE.md hard rule respected: no cross-DB JOIN, no shared handler reading both DBs.
2. **WA webhook fail-closed for trigger, fail-open for inbound.** If the mirror or trigger throws, `error_log` and continue. The actual WhatsApp reply path is unaffected — Meta sees 200, no retries, no duplicate inbound rows.
3. **Tenancy in trigger fire.** `messages.php` reads `organization_id` from the conversation row itself (matches existing H1/H3 pattern), passes that to `wf_crm_trigger` as `$orgId`. The drafter/router/sender steps inherit that org context from the run row — no `current_org_id()` calls inside the engine.
4. **Send failure = `status='rejected'`, not pretend-success.** `auto_send_if_eligible` writes the send error into `audit_blob.send_error` and flips status to `rejected`. The run does NOT advance "as if sent" — the failure is captured for the data-analyst weekly review.
5. **Hardcoded denylist NON-overridable.** Topics and tags constants live in `wf_crm.php` as `const` (not config). Tenant config can ADD to the denylist via `denylist_topics` JSON, but cannot remove from the hardcoded list. Belt-and-suspenders against AI hallucination.
6. **IG DM force-approval.** `route_by_confidence` checks `ctx.channel === 'ig_dm'` and forces approval regardless of confidence. Even if a future bug allowed an IG draft past, `auto_send_if_eligible` rejects it again as a defense-in-depth check.
7. **WA mirror tenancy hardcoded to org 1.** Documented TODO. Multi-tenant WA routing requires Twilio/Meta subaccount-per-tenant, deferred to Phase 2.

## Smoke-test plan (post-deploy)

1. **Inbound trigger no-op.** Open any CRM conversation, click "Simulate Inbound." `tail -f error_log` on InMotion. Expected: zero `conversation_inbound` errors. No active workflow → trigger returns 0 queued, silently.
2. **Workflow save accepts new types.** In CRM visual builder, create a new workflow with `trigger_type=conversation_inbound`, `status=paused`, steps=`[draft_ai_reply, route_by_confidence, push_for_approval, holding_reply_if_no_approval, auto_send_if_eligible]`. Save. Expect 201 (not 400 "invalid type").
3. **Run-now drafter call.** Flip workflow to `status=active`. POST `?r=workflows&id=N&action=run_now` with admin token. Watch `conversation_drafts` table — expect a new row with `status='shadow'` (because `auto_reply_config.shadow_mode_enabled=1` default), `confidence > 0`, `audit_blob` non-null and parseable JSON containing `tokens_in > 0`.
4. **Holding wait observability.** Manually expire the holding wait via `UPDATE workflow_runs SET next_run_at = NOW() WHERE status='waiting'` then trigger the cron endpoint. Expect a new outbound `messages` row with the holding text in the conversation's lang, the `conversation_drafts` row staying at `pending_approval`/`shadow` (not flipped to sent), and `source='holding'`.
5. **WA bridge cross-DB write.** Send a real WhatsApp message to the Twilio sandbox (or Meta number, whichever is provisioned). Verify `webmed6_crm.contacts`, `webmed6_crm.conversations`, `webmed6_crm.messages` all gain rows. Then check `webmed6_crm.workflow_runs` for a `pending` run on the auto-reply workflow.
6. **Send failure path.** Manually break `RESEND_API_KEY` in config.local.php (or set an unresolvable email on a contact). Run a workflow end-to-end with shadow off. Expect the draft row to flip to `status='rejected'`, `audit_blob.send_error` populated, no outbound `messages` row.

## Blockers / dependencies for downstream PRs

**PR 4 — channel_send.php refactor:**
- The two inline send blocks in `wf_crm.php` (`auto_send_if_eligible` and `holding_reply_if_no_approval`) are marked `// TODO(PR 4):`. Replace each with `channel_send($channel, $convRow, $body, $subject)` once the lib lands. Keep the failure-handling shape identical — the rejected-on-error path is load-bearing.
- `wa_meta_send()` needs extracting from `wa_flush.php` into the same lib so both `wa_flush` and `channel_send` use one Meta sender.

**PR 5 — real WhatsApp push for approval:**
- `push_for_approval` is currently a stub that only updates `approval_channel='whatsapp'` and logs `[PUSH STUB]`. PR 5 must add the actual `twilio_send($OPERATOR_PHONE, $formattedMsg, 'whatsapp')` call.
- `OPERATOR_WHATSAPP_NUMBER` secret is still an open question (spec §14 #1). PR 5 cannot ship until Carlos confirms the operator phone source.
- The inbound parser for Carlos's `y / n / edit:` replies in `api-php/routes/whatsapp.php` is also out of scope here — PR 5 lands that.

**PR 6 — CRM UI:**
- The polling badge for `pending_approval` drafts already has a row to render (any draft created by PR 3). UI work is unblocked.
- All draft body/topic/contact-name renders in `conversations.js` MUST go through `CRM_APP.esc()` — the AI draft body is user-influenced (prompt injection surface) and must be HTML-escaped before `innerHTML`.

## Notes for the data-analyst agent

- Every draft row carries `audit_blob` JSON with `tokens_in`, `tokens_out`, `latency_ms`, `decision_path`, `denylist_hits`, `kb_topics_matched`. Weekly shadow-mode calibration query:
  ```
  SELECT topic, COUNT(*) total, SUM(status='shadow') shadow,
         AVG(confidence) avg_conf,
         JSON_EXTRACT(audit_blob, '$.latency_ms') latency
  FROM conversation_drafts
  WHERE created_at > NOW() - INTERVAL 7 DAY
  GROUP BY topic
  ORDER BY total DESC;
  ```
- `audit_blob.send_error` (set by `auto_send_if_eligible` failure) is the leading indicator for channel adapter health.
