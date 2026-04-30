# Chatbot & WhatsApp Test Plan — 10 Prospect Questions

Test both `/api/public/chat` (website widget) and WhatsApp via Meta Cloud API using this prospect question suite.

## Test Questions

### 1. **Service Overview**
*"What services does NetWebMedia offer?"*

**Expected:** Short description of core offerings (AI automation, lead generation, marketing), with link to services page or pricing.

---

### 2. **Pricing & Affordability**
*"How much does NetWebMedia cost? Do you have plans for small businesses?"*

**Expected:** Reference to pricing page, mention of scalable plans, or invitation to audit/call for custom pricing.

---

### 3. **Implementation Timeline**
*"How long does it take to set up NetWebMedia for my business?"*

**Expected:** General timeline (e.g., "days to weeks depending on scope"), mention of setup/onboarding, or link to docs.

---

### 4. **AI Capabilities & Automation**
*"What can your AI actually automate? Can it handle customer support?"*

**Expected:** Specific examples (lead qualification, email sequences, chat widget, WhatsApp), honest scope boundaries, offer for demo/audit.

---

### 5. **Integration & Tech Stack**
*"Does NetWebMedia integrate with our CRM? We use HubSpot."*

**Expected:** Honest about HubSpot integration status, mention of native CRM, or suggest workaround (Zapier/API).

---

### 6. **Proof of Results**
*"Do you have case studies? What kind of ROI should we expect?"*

**Expected:** Realistic framing (results vary by niche), offer audit, link to results/industries pages, avoid generic "X% lift" claims.

---

### 7. **Data Privacy & Security**
*"Is my customer data secure with NetWebMedia? GDPR compliant?"*

**Expected:** Security assurance, mention of compliance, or escalation to hello@netwebmedia.com for detailed docs.

---

### 8. **Feature Requests / Limitations**
*"Can your system handle [X specific feature]? What can't you do?"*

**Expected:** Honest scope, offer to discuss requirements, escalation to sales if needed.

---

### 9. **Getting Started / Free Trial**
*"How do I get started? Is there a free trial?"*

**Expected:** Direct to /pricing.html, mention free audit at /contact.html, or clear CTA to book demo.

---

### 10. **Support & Availability**
*"Do you have phone support? What's your response time?"*

**Expected:** Honest about support model (async AI chat, email, no phone), offer WhatsApp for faster back-and-forth, link to contact options.

---

## Testing Protocol

### Web Chat (nwm-chat.js widget)
1. Open **netwebmedia.com** in browser
2. Click chat bubble (bottom-left)
3. Paste each question verbatim
4. Record: Response length, relevance, CTAs offered, tone
5. Check: KB accuracy, language switching (EN ↔ ES), rate limit after 20 questions

### WhatsApp (Meta Cloud API)
1. Use test WhatsApp Business Account or personal number paired with test sandbox
2. Send each question via WhatsApp message
3. Record: Response time, accuracy, suggested actions, conversation flow
4. Check: Rate limit enforcement (50 msgs/phone/24h), CRM sync if configured

---

## Success Criteria

- ✅ Response is **relevant and on-brand** (uses KB, matches tone)
- ✅ **No hallucination** (pricing, features, integrations only from KB)
- ✅ **Clear CTA** (link to page, suggestion to contact, or escalation path)
- ✅ **Under 4 paragraphs** (web chat should be scannable; WhatsApp ditto)
- ✅ **Bilingual ready** (Spanish versions work if language setting changed)
- ✅ **Graceful degradation** (if KB is missing info, says "email hello@" instead of inventing)

---

## Rate Limit Validation

**Web chat:** 20 messages per IP per 24h
- Test by sending 21 messages rapidly; 21st should return rate-limit fallback message.

**WhatsApp:** 50 messages per phone per 24h
- Test similarly; 51st should return rate-limit message.

---

## Quick Links for Testing

- **Web chat widget:** https://netwebmedia.com (bottom-left chat bubble)
- **Pricing page:** https://netwebmedia.com/pricing.html
- **Free audit:** https://netwebmedia.com/contact.html
- **API endpoint (web):** POST `/api/public/chat`
- **API endpoint (WhatsApp):** Configured in `/api/whatsapp.php`

---

## Notes

- Run this test **monthly** as KB grows or after major feature launches
- Document any hallucinations or KB gaps in a separate issue
- Check Sentry (`netwebmedia` org) for any errors during testing
