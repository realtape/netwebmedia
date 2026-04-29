# Conversion & Product-Readiness Rating — 2026-04-29

**Lens:** A 50-year-old US SMB owner deciding whether to wire $249–$2,499/mo to a vendor they've never heard of.

---

## Overall conversion/product rating: **6.0 / 10**

Strong above-the-fold clarity and a real Stripe-wired checkout, sabotaged by thin US-targeted social proof, a Spanish "Nuestros clientes" block on a US-targeted homepage, and the absence of any human-shaped trust artifact (named client, real face, verifiable logo).

---

## Sub-ratings

| # | Dimension | Score | One-line rationale |
|---|---|---|---|
| 1 | Hero conversion clarity | 8/10 | H1, ICP, price, primary + secondary CTA all visible in 8s; "Cited by Claude/ChatGPT/Perplexity" is a sharp differentiator. |
| 2 | Funnel path | 6/10 | Home → Pricing → Contact flows; CTAs are consistent ("Free AI Audit") but the path dead-ends in a form, not a Calendly or checkout. |
| 3 | Pricing page clarity | 8/10 | Three clean tiers, anchor pricing, 15% annual discount, 14-day free trial, comparison table vs. 12 platforms. Best page on the site. |
| 4 | Trust building | 4/10 | One anonymous "boutique hotel · Chile" case study, no logos, no named US clients, no founder photo above the fold, no SOC2/GDPR badges. The biggest weakness. |
| 5 | Objection handling | 6/10 | FAQ exists, comparison page is credible post-vapor-claim demotion, 14-day trial + 90-day-then-month-to-month is generous. No money-back guarantee stated. |
| 6 | Audit/lead-magnet flow | 5/10 | "48h written audit, no call needed" is a strong promise — but no email confirmation copy promised, no auto-reply preview, no sample audit shown. Prospect submits into a void. |
| 7 | Pricing legitimacy | 7/10 | $249 fCMO is dramatically below the $5–15K market rate; that's either a steal or a red flag. Comparison table helps; "why so cheap" answer doesn't appear up front. |
| 8 | Industry pages | 7/10 | Restaurants and Legal pages are genuinely tailored (restaurant-specific KPIs, law-firm AEO framing). `/industries/healthcare/` returns 404 — broken funnel for a top-3 vertical. |
| 9 | Self-serve vs. sales-led | 7/10 | Stripe checkout is wired (`/api/billing/checkout`, register → checkout flow exists). But pricing CTAs route to `/contact.html?plan=…`, not the checkout. Self-serve is built but hidden. |
| 10 | "Should I buy this" gut-check | 5/10 | Headline impresses, price reassures, but "who else trusts these guys with their marketing?" returns no answer. A cautious 50-year-old clicks away. |

---

## Top 3 conversion wins to protect

1. **The hero stack** (H1 + AI-citation differentiator + visible $249 + dual CTA) — this is best-in-class for the AEO category. Don't dilute it.
2. **The pricing page comparison table** vs. 12 platforms — gives the analytical buyer an exit ramp from "is this real?" to "this is the cheapest option."
3. **The 48h written-audit promise** — replacing the discovery call with a deliverable is a category-defining move. Most prospects hate sales calls; this is differentiated.

---

## Top 5 conversion improvements (impact ÷ effort)

| Rank | Improvement | Impact | Effort | Why now |
|---|---|---|---|---|
| 1 | Replace anonymous "boutique hotel · Chile" block with **3 named US case studies + logos** (or, if none exist yet, a "Founding Cohort — first 10 clients get $99/mo for life" honesty play). | High | Low–Med | The single biggest barrier. Trust gap is the conversion killer. |
| 2 | **Wire pricing CTAs directly to Stripe checkout** (the code exists — line 873 of pricing.html). Today the buttons route to a contact form; the self-serve product is hidden behind a sales motion. | High | Low | Code is built. Just change the link. |
| 3 | **Audit form → instant confirmation page + auto-reply email** with a sample audit PDF and "Carlos personally reviews every audit" line. Today prospects submit into a void. | High | Low | Mailchimp/SendGrid + one HTML page. <4 hours. |
| 4 | **Fix the `/industries/healthcare/` 404** and any other broken industry slugs. Health is one of the 14 canonical niches and likely sourced in ads. | Med | Trivial | Generator already exists (`build_industry_pages.py`). |
| 5 | Translate the **"Nuestros clientes"** section to English on the US-targeted homepage (or split EN/ES via existing `data-en`/`data-es` mechanism). A US prospect seeing Spanish copy mid-funnel breaks trust. | Med | Low | Bilingual infra already wired. Just fill the missing strings. |

---

## The single biggest barrier to purchase — and how to remove it this week

**Barrier: There is no verifiable human proof.** The site has zero named clients, zero logos, zero photo testimonials, zero linkable LinkedIn endorsements. A 50-year-old SMB owner asking "who else has paid these guys $249/mo and is still around six months later?" cannot find an answer. The "Cited by ChatGPT/Claude" line is impressive but it's not the same as another business owner saying "I paid them and they delivered." Pricing being 5–10x below the market rate amplifies the doubt rather than easing it — cheapness without proof reads as risk.

**Remove it this week (5-day plan):**

- **Mon:** Pick the 3 most successful pilot clients (even if they're friends-and-family); ask each for one sentence + a logo + a first-name + city.
- **Tue:** Shoot one 60-second founder video — Carlos to camera, Gulf-Oil-navy backdrop: "Why we charge $249 when others charge $5K." Embed above the testimonial strip.
- **Wed:** Replace the Spanish anonymous case study with a "Trusted by [Logo] [Logo] [Logo]" strip + one named US quote. If three real US clients don't exist yet, use the **Founding Cohort framing** ("First 25 clients — locked rate for 24 months — 9 seats left") to convert the absence of proof into urgency.
- **Thu:** Publish a 90-second sample-audit PDF on `/sample-audit` and link it from the contact form CTA + audit auto-reply.
- **Fri:** Add a 30-day money-back guarantee badge to the pricing page. The 14-day free trial already de-risks; making the guarantee explicit converts cautious analytical buyers.

**Expected lift:** +40–80% on contact-to-paid conversion, based on the gap between current trust signals (1 anonymous case) and the minimum viable trust stack (3 named clients + founder face + guarantee).

---

*Word count: ~870*
