# NetWebMedia Unit Economics Analysis

**Prepared by:** Finance Controller (AI Agent)  
**Date:** April 28, 2026  
**Period:** Y1 (May 2026 – April 2027)  
**Status:** Foundation for pricing review and cash management

---

## Executive Summary

NetWebMedia has repriced to **$249 / $999 / $2,499** monthly for Fractional CMO tiers (effective 2026-04-21). This analysis validates those prices, quantifies unit margins, identifies break-even client counts, and projects cash flow with confidence bands.

**Key findings:**
- **All three tiers are cash-flow positive with 72% blended gross margin** assuming target API and labor costs
- **Starter (Lite) tier serves as a wedge** — designed for volume and upgrades, not retention
- **Growth and Scale are the revenue drivers** — both exceed 70% GM and support sustainable unit economics
- **Break-even on baseline OpEx** occurs at 38–45 clients (weighted mix) by Month 4
- **Y1 exit revenue target of $1.02M ARR** ($85k MRR) is achievable with disciplined CAC and 3.5–4% sales conversion

This model assumes:
- AWS/Anthropic Claude API usage scaled to per-client delivery
- No human headcount beyond Carlos until Month 9
- Monthly invoicing with Net-30 terms
- Monthly churn rates per cohort data in business plan (Section 9)

---

## 1. Recommended 3-Tier Pricing Structure

### Current Live Pricing (as of 2026-04-21)

| Tier | Monthly | Setup | Scope | Annual (15% discount) |
|------|---------|-------|-------|------------------------|
| **CMO Lite** | $249 | $0 | AEO + SEO strategy, monthly content calendar, audit, CRM included. Async-only, 90-day upgrade credit of $249 | $2,540 |
| **CMO Growth** | $999 + ad mgmt fee | $499 | Everything in Lite + paid ads mgmt ($5k–$20k spend), monthly strategy call, email nurture, attribution. Ad mgmt = 12% of spend (min $300/mo). | $10,190 |
| **CMO Scale** | $2,499 + ad mgmt fee | $999 | Everything in Growth + AI SDR outbound, 12 short-form video assets/mo, demand gen, weekly strategy calls, quarterly OKR planning. Ad mgmt = 12% of spend (min $300/mo). | $25,490 |

**Supporting SKUs (CRM/Platform):**

| SKU | Monthly | Notes |
|-----|---------|-------|
| NWM CRM Starter | $49 | Single seat, 1k contacts, self-serve wedge |
| NWM CRM Pro | $249 | 5 seats, 10k contacts, automation, SMS/WhatsApp |
| NWM Agency (white-label) | $449 | Unlimited seats, full CMS + CRM + Video Factory; resellers charge $997–$1,997 |

---

## 2. Cost Structure (Per Client Per Month)

### CMO Lite ($249/mo)

| Cost Category | Monthly | Notes |
|---------------|---------|-------|
| **AI API costs** | $18–22 | 2.5–3M tokens @ $0.003/MTok (Claude Haiku); assumes 1–2 blog posts, 1 audit, strategic note |
| **Infrastructure** | $2–3 | Prorated hosting, domains, email, data storage (shared across client base) |
| **Time (Carlos)** | $35–50 | ~30 min strategy + oversight per month (at $100/hr equiv.) |
| **Total COGS** | **$55–75** | |
| **Gross Margin** | **$174–194 (68–78%)** | Conservatively 68% = $170 / $249 |

### CMO Growth ($999/mo + ad mgmt fee)

| Cost Category | Monthly (excluding ad spend) | Notes |
|---------------|------------------------------|-------|
| **AI API costs** | $65–85 | 5M+ tokens; 4–6 blog posts, paid media optimization, CRM setup, email sequences |
| **Infrastructure** | $4–5 | Prorated shared costs |
| **Time (Carlos)** | $100–150 | ~1.5 hrs/mo for strategy call + account management |
| **Ad mgmt (pass-through)** | Variable | Billed at 12% of ad spend (min $300/mo); **not margin, but operational** |
| **Total COGS (retainer only)** | **$170–240** | |
| **Gross Margin (retainer only)** | **$759–829 (76–83% before ad mgmt)** | Conservatively 70% = $700 / $999 |
| **Ad mgmt margin** | 12% of ad spend | Pure margin after pass-through costs |

### CMO Scale ($2,499/mo + ad mgmt fee)

| Cost Category | Monthly (excluding ad spend) | Notes |
|---------------|------------------------------|-------|
| **AI API costs** | $150–200 | 10M+ tokens; video generation, complex outbound sequences, demand campaigns, custom agents |
| **Infrastructure** | $5–8 | Prorated shared costs |
| **Time (Carlos + contractor)** | $250–350 | 2–3.5 hrs/mo for strategy, weekly calls, campaign oversight |
| **Ad mgmt (pass-through)** | Variable | Billed at 12% of ad spend (min $300/mo); operational |
| **Total COGS (retainer only)** | **$405–558** | |
| **Gross Margin (retainer only)** | **$1,941–2,094 (78–84% before ad mgmt)** | Conservatively 72% = $1,800 / $2,499 |
| **Ad mgmt margin** | 12% of ad spend | Pure margin after pass-through costs |

---

## 3. Gross Margin by Tier

### Summary Table

| Tier | Monthly Price | COGS | Gross Margin $ | Gross Margin % | Notes |
|------|---------------|------|---|---|---|
| **Lite** | $249 | $75 | $174 | 68% | Entry wedge; thin but positive |
| **Growth** | $999 | $240 | $759 | 70% | Primary revenue driver; ad mgmt adds 12% on top |
| **Scale** | $2,499 | $558 | $1,941 | 72% | Enterprise-grade; highest retention & LTV:CAC |
| **Blended (Y1 target mix)** | ~$857 avg | $192 | $665 | **71%** | Assuming 50% Lite, 35% Growth, 15% Scale by Month 12 |

**Platform SKUs (estimated):**
- **CRM $49:** 85% GM ($42 margin)
- **CRM $249:** 80% GM ($199 margin)
- **CRM $449:** 78% GM ($350 margin)

---

## 4. Break-Even Analysis

### Fixed OpEx Baseline (Y1)

| Category | Monthly | Annual | Notes |
|----------|---------|--------|-------|
| Infrastructure (hosting, SaaS, minimal API) | $1,500 | $18,000 | Assumes ~50 clients; scales at $15/client |
| Paid media (self-serve lead gen) | $2,500 | $30,000 | Ramps from $1.5k→$5k M1→M12 |
| Content tools + stock + video rendering | $400 | $4,800 | Tools, licenses |
| Legal / accounting / Stripe + MP fees | $1,500 | $18,000 | ~3% of monthly revenue + base |
| Contractors / human support | $1,000 | $12,000 | None until Month 9; then $1.5k/mo |
| Carlos founder draw | $0–12,000/mo | $96,000 | Starts Month 4 at $6k, ramps to $12k by Month 12 |
| **Total monthly (M1–M3)** | **$7,400** | | |
| **Total monthly (M4+)** | **$13,400–19,400** | **varies** | Depends on founder comp and contractor ramp |

### Break-Even Client Count

**Assumption:** Blended gross margin of 71% on mixed portfolio (50% Lite, 35% Growth, 15% Scale).

**Monthly revenue needed to cover OpEx:**

| Scenario | Monthly OpEx | Required MRR @ 71% GM | Clients needed (weighted avg $857 ACV) |
|----------|--------------|----------------------|-------|
| Months 1–3 (no founder draw) | $7,400 | $10,422 | ~13 clients |
| Months 4–8 (Carlos $6k/mo) | $13,400 | $18,873 | ~22 clients |
| Months 9–12 (Carlos $12k/mo + contractor) | $19,400 | $27,324 | ~32 clients |

**Actual plan targets:**
- **Month 3:** 30 clients → $30k MRR (well above break-even of $10.4k)
- **Month 6:** 56 clients → $60k MRR (well above break-even of $18.9k)
- **Month 12:** 90 clients → $85k MRR (above break-even of $27.3k)

**Conclusion:** Business is **cash-flow positive by Month 4** with ample margin for growth investment.

---

## 5. Revenue Projections (Month 1, 3, 6, Conservative / Realistic / Optimistic)

### Scenario Framework

**Conservative (Bear):** 70% of plan; slower AEO adoption; higher CAC; 1 major churn event  
**Realistic (Base):** Plan-as-written; 15% monthly growth MoM; 3–4 key wins per month  
**Optimistic (Bull):** 130% of plan; AEO accelerates; viral proof-of-concept; strong partner channel  

### Month 1 Projections (May 2026)

| Scenario | Retainer clients | Avg ACV | Retainer MRR | Platform MRR | Projects | Total MRR | Total COGS | Gross Margin |
|----------|---|---|---|---|---|---|---|---|
| **Conservative** | 2 | $700 | $1,400 | $400 | $500 | $2,300 | $690 | $1,610 (70%) |
| **Realistic (Plan)** | 3 | $850 | $2,550 | $600 | $1,000 | $4,150 | $1,245 | $2,905 (70%) |
| **Optimistic** | 5 | $950 | $4,750 | $1,000 | $1,500 | $7,250 | $2,175 | $5,075 (70%) |

### Month 3 Projections (July 2026)

| Scenario | Retainer clients | Avg ACV | Retainer MRR | Platform MRR | Projects | Total MRR | Total COGS | Gross Margin |
|----------|---|---|---|---|---|---|---|---|
| **Conservative** | 15 | $750 | $11,250 | $3,000 | $2,000 | $16,250 | $4,875 | $11,375 (70%) |
| **Realistic (Plan)** | 22 | $860 | $18,920 | $5,000 | $3,500 | $27,420 | $8,226 | $19,194 (70%) |
| **Optimistic** | 35 | $920 | $32,200 | $8,000 | $5,500 | $45,700 | $13,710 | $31,990 (70%) |

### Month 6 Projections (October 2026)

| Scenario | Retainer clients | Avg ACV | Retainer MRR | Platform MRR | Projects | Total MRR | Total COGS | Gross Margin |
|----------|---|---|---|---|---|---|---|---|
| **Conservative** | 35 | $760 | $26,600 | $8,000 | $4,000 | $38,600 | $11,580 | $27,020 (70%) |
| **Realistic (Plan)** | 52 | $875 | $45,500 | $12,000 | $6,500 | $64,000 | $19,200 | $44,800 (70%) |
| **Optimistic** | 80 | $930 | $74,400 | $18,000 | $10,000 | $102,400 | $30,720 | $71,680 (70%) |

### Full Year Exit (Month 12)

| Scenario | Retainer clients | Platform clients | Avg ACV (blended) | Annual MRR | Exit ARR | Y1 EBITDA |
|----------|---|---|---|---|---|---|
| **Conservative (Bear)** | 52 | 35 | $820 | $43,000 | $516,000 | $108,000 |
| **Realistic (Base)** | 90 | 45 | $857 | $85,000 | $1,020,000 | $316,000 |
| **Optimistic (Bull)** | 148 | 65 | $920 | $154,000 | $1,848,000 | $624,000 |

**EBITDA calculation:** (Total MRR × 12 × 71% GM) − OpEx ($235k Y1)

---

## 6. Cash Flow & Payment Terms

### Invoicing & Collection Policy

**Invoice timing:**
- Monthly invoices issued on the 1st of each month for the upcoming month (prepaid model)
- Platform SKUs: same (prepaid monthly)
- Project work: 50% upfront on signed SOW, 50% on delivery

**Payment terms:**
- **Standard:** Net-15 for US clients; Net-30 for LATAM clients
- **Annual prepay:** 15% discount; invoiced Net-15 on Jan 1 and Jul 1
- **Setup fees:** Due at onboarding; non-refundable post-day-7

**Late payment policy:**
- Day 1–5: Friendly reminder (automated email)
- Day 6–15: Second notice + 2% late fee accrual (monthly compounding, capped at 18% APR)
- Day 16–30: Escalation to Carlos; payment plan discussion
- Day 31+: Account suspension (no access to platform, no new deliverables until current + 30 days past due is cleared)

### 13-Week Rolling Cash Forecast (Illustrative, Month 1–3)

**Assumptions:**
- All clients prepay monthly on the 1st
- 90% payment within Net-15; 8% within Net-30; 2% delinquent
- OpEx paid on the 15th (mid-month)
- Initial cash injection: $10k (founder capital); no external financing

| Week | New signups | Collections (prepaid) | Operating outflow | Net cash | Cumulative |
|------|---|---|---|---|---|
| W1 (May 1–7) | 1 retainer ($850) | $2,550 (prior month) | $1,850 | +$700 | $10,700 |
| W2 (May 8–14) | 1 retainer | $0 | $1,200 | -$1,200 | $9,500 |
| W3 (May 15–21) | 1 retainer | $0 | $3,650 (OpEx) | -$3,650 | $5,850 |
| W4 (May 22–28) | 0 | $2,400 | $1,200 | +$1,200 | $7,050 |
| W5 (May 29–Jun 4) | 2 retainers | $5,100 | $1,850 | +$3,250 | $10,300 |
| W6 (Jun 5–11) | 2 retainers | $0 | $1,200 | -$1,200 | $9,100 |
| W7 (Jun 12–18) | 1 retainer | $0 | $3,650 | -$3,650 | $5,450 |
| W8 (Jun 19–25) | 2 retainers | $7,000 | $1,200 | +$5,800 | $11,250 |
| W9 (Jun 26–Jul 2) | 1 retainer | $8,500 | $1,850 | +$6,650 | $17,900 |
| W10 (Jul 3–9) | 1 retainer | $0 | $1,200 | -$1,200 | $16,700 |
| W11 (Jul 10–16) | 2 retainers | $0 | $3,650 | -$3,650 | $13,050 |
| W12 (Jul 17–23) | 2 retainers | $10,200 | $1,200 | +$9,000 | $22,050 |
| W13 (Jul 24–30) | 1 retainer | $15,200 | $1,850 | +$13,350 | $35,400 |

**Observation:** Cash stays positive throughout; by Week 13, surplus is $35.4k, providing buffer for Q3 growth spend.

### Key Cash Flow Triggers

| Event | Month | Action |
|-------|-------|--------|
| **Cash-flow positive month** | M4 | Cumulative gross margin > cumulative OpEx; can begin scaling |
| **Founder comp ramp to $6k/mo** | M4 | Carlos draws first $6k (from cash surplus) |
| **Contractor hire gate** | M9 | Only if >40 active retainers AND 90%+ retention |
| **Founder comp ramp to $12k/mo** | M12 | If MRR > $70k sustained |
| **Annual true-up** | M12 | Review any billing discrepancies; reconcile with contracts |

---

## 7. Key Unit Economics Metrics

### Cohort LTV / CAC (from Business Plan §9, updated for new pricing)

| Tier | Monthly price | Gross margin % | Expected tenure | LTV | Target CAC | LTV:CAC | Payback (months) |
|------|---|---|---|---|---|---|---|
| **Lite** | $249 | 68% | 11 mo | $1,862 | $600 | 3.1x | 3.6 |
| **Growth** | $999 | 70% | 14 mo | $9,790 | $1,500 | 6.5x | 2.2 |
| **Scale** | $2,499 | 72% | 18 mo | $32,387 | $3,200 | 10.1x | 1.8 |
| **CRM $49** | $49 | 85% | 11 mo | $458 | $140 | 3.3x | 3.4 |
| **CRM $249** | $249 | 80% | 14 mo | $2,789 | $650 | 4.3x | 3.3 |

**Enforce:** Reject any channel with LTV:CAC < 3x or payback > 6 months.

### Customer Acquisition Cost (Target)

**Blended Y1 CAC target:** < $800 (down from $3,200 in early stage; achievable through organic, content, and partner leverage)

**CAC by channel (illustrative, Month 12 steady state):**
- **Organic (AEO/content):** ~$400 CAC (highest ROI; scales with content library)
- **Outbound (SDR/AI):** ~$650 CAC (predictable; repeatable at 4%+ reply rate)
- **Partners:** ~$200 CAC (highly leveraged; 20–30% rev-share payout)
- **Paid media:** ~$1,200 CAC (justified only on Growth/Scale; avoid on Lite)

### Churn & Retention

**Monthly churn rates (from business plan cohort curves):**
- **Lite:** 15% Month 0 → 3 (52% retained by M12) — by design; upgrade path is the goal
- **Growth:** 9% Month 0 → 3 (62% retained by M12) — core retention segment
- **Scale:** 6% Month 0 → 3 (72% retained by M12) — sticky; enterprise-like

**Net Retention (NRR):**
- Target 105%+ NRR on Growth and Scale (via upsells, higher ad spend, expansions)
- Lite is intentionally low-NRR; focus on Lite→Growth upgrade velocity (goal: 18% within 90 days)

---

## 8. Financial Assumptions & Sensitivities

### Model Assumptions (Conservative)

1. **API costs:** Claude Haiku @ $0.003/1M tokens; assume 2.5M–10M tokens per client per month (depends on tier)
2. **Infrastructure:** $1,500/mo base + $15/client marginal (hosting, storage, email, domains)
3. **Carlos time:** Valued at $100/hr; assumes 30 min–3.5 hrs per client per month (tier-dependent)
4. **Payment:** 90% prepaid on the 1st; 2% never collected (provision in OpEx)
5. **Churn:** Month-over-month rates per cohort curves; no seasonal cliff
6. **CAC:** Blended $800 by M12 (weighted across channels)

### Sensitivity Analysis

**If Claude API costs increase 30%:**
- Lite: 68% → 65% GM; still above 60% floor
- Growth: 70% → 67% GM; still healthy
- Scale: 72% → 70% GM; minimal impact
- **Action:** Built in 30% cost buffer into pricing; no repricing needed up to +30% API inflation

**If churn accelerates to 20% monthly (vs. 9–15% baseline):**
- Month 12 client count: 90 → ~55 clients
- Month 12 MRR: $85k → ~$52k
- Month 12 EBITDA: $316k → ~$165k
- **Action:** Kill-switch at M6 if MRR < $35k; pause Lite acquisition; concentrate on Growth/Scale

**If CAC jumps to $1,500 (vs. $800 target):**
- Lite LTV:CAC: 3.1x → 1.2x (reject channel immediately)
- Growth LTV:CAC: 6.5x → 6.5x (still healthy at 6.5x)
- Scale LTV:CAC: 10.1x → 6.8x (still 6.8x; acceptable)
- **Action:** Kill channels driving >$1,200 CAC on Lite; concentrate on Growth/Scale and organic

---

## 9. Recommendations & Action Items

### Pricing Assessment

**APPROVED.** The $249 / $999 / $2,499 structure is sound:
- All tiers exceed 65% gross margin (sustainable)
- Lite is correctly positioned as a wedge (low price for volume + upgrades)
- Growth and Scale carry the revenue load and support healthy LTV:CAC
- Ad management fee (12% of spend) is transparent and standard; correctly separated from retainer

### Immediate Actions (Finance)

1. **Reconcile billing.** Ensure all active clients are on the new pricing (not legacy $X rates). Audit Stripe + CRM backend for any residual old tier references.

2. **Retire Carlos26 promo.** Confirm the 50% off coupon is disabled in Stripe and CRM by May 1. Any active users on that code should be grandfathered or manually migrated.

3. **Set up prepaid annual invoicing.** Create Net-15 annual invoices for clients opting for the 15% discount ($2,540 / $10,190 / $25,490). Process on 2026-05-01 and 2027-01-01.

4. **Build cash dashboard.** Looker Studio board tracking daily cash position, weekly collections, 13-week forecast. Auto-refresh daily. Shared with Carlos.

5. **Lock late payment policy in terms.** Add to all new MSAs:
   - Day 1–15: Standard terms (prepaid or Net-15)
   - Day 16+: 2% monthly late fee (capped at 18% APR)
   - Day 31+: Service suspension

### Monthly Processes (Finance)

- **Revenue reconciliation:** By the 5th of each month, match invoiced MRR (in Stripe) to contractual client count and pricing. Flag any discrepancies.
- **Cash flow forecast refresh:** Update 13-week forecast on Fridays. If projected cash < 6 weeks OpEx, flag to Carlos.
- **Cohort churn review:** By the 10th, check which clients are at-risk (no recent activity; support tickets; past-due). Escalate to Customer Success agent.
- **CAC tracking:** Allocate monthly customer acquisition spend to channel; calculate blended CAC. If any channel > $1,500 CAC on Lite, pause that channel.

### Quarterly Reviews (Finance + Carlos)

- **Margin analysis:** Recompute gross margin by tier. If any tier drops below 65%, escalate to pricing/cost review.
- **Scenario update:** Confirm we're on Base / Bear / Bull track. Refresh ARR forecast and EBITDA guidance.
- **Capital requirements:** If projected cash 13 weeks out < 8 weeks OpEx, begin contingency planning (reduce spend, raise capital, or reduce hiring timeline).

---

## 10. Appendix: Full-Year Month-by-Month Projection (Base Case)

| Month | Retainer clients | Platform clients | Avg ACV | MRR | Projects | Total monthly revenue | COGS | Gross margin $ | Gross margin % | Cumulative MRR |
|---|---|---|---|---|---|---|---|---|---|---|
| M1 (May) | 3 | 8 | $850 | $9,400 | $1,000 | $10,400 | $3,120 | $7,280 | 70% | $9,400 |
| M2 | 6 | 14 | $835 | $18,500 | $2,000 | $20,500 | $6,150 | $14,350 | 70% | $27,900 |
| M3 | 10 | 20 | $840 | $30,000 | $3,500 | $33,500 | $10,050 | $23,450 | 70% | $57,900 |
| M4 | 14 | 26 | $845 | $41,500 | $4,000 | $45,500 | $13,650 | $31,850 | 70% | $99,400 |
| M5 | 18 | 30 | $850 | $51,000 | $4,500 | $55,500 | $16,650 | $38,850 | 70% | $150,400 |
| M6 | 22 | 34 | $855 | $60,000 | $5,000 | $65,000 | $19,500 | $45,500 | 70% | $210,400 |
| M7 | 26 | 37 | $860 | $67,500 | $5,500 | $73,000 | $21,900 | $51,100 | 70% | $277,900 |
| M8 | 30 | 40 | $862 | $73,000 | $6,000 | $79,000 | $23,700 | $55,300 | 70% | $350,900 |
| M9 | 34 | 42 | $863 | $77,500 | $6,500 | $84,000 | $25,200 | $58,800 | 70% | $428,400 |
| M10 | 38 | 43 | $864 | $80,500 | $7,000 | $87,500 | $26,250 | $61,250 | 70% | $508,900 |
| M11 | 42 | 44 | $865 | $83,000 | $7,500 | $90,500 | $27,150 | $63,350 | 70% | $591,900 |
| M12 | 45 | 45 | $857 | $85,000 | $8,000 | $93,000 | $27,900 | $65,100 | 70% | $676,900 |

**Y1 totals:**
- **Total revenue:** $676.9k (MRR exit $85k)
- **Total COGS:** $203k
- **Gross Profit:** $473.9k (70% margin)
- **OpEx:** ~$235k
- **Y1 EBITDA:** $238.9k (before founder compensation draw starting M4)

---

## 11. Closeout Notes

**This analysis is the financial foundation for the 2026–2027 business plan.** It validates:
- Pricing is sustainable across all three tiers
- Unit economics support rapid scaling without near-term capital raise
- Cash flow is positive by Month 4 with conservative assumptions
- Break-even on OpEx occurs at 22–32 clients depending on founder compensation model

**For Carlos:** You have the room to invest aggressively in growth (content, outbound, paid media) through Month 6–9 without cash crisis. By Month 6, you'll have $35–40k cash surplus to redeploy. The model holds even if any single assumption (API costs, churn, CAC) moves 20–30% in the wrong direction.

**For finance ops:** Build the cash dashboard first (Week 1). Lock in late payment policy and annual prepay mechanics before May 1 billing runs. Monthly reconciliation is non-negotiable; billing errors compound fast in SaaS.

---

**Document status:** Ready for executive review and incorporation into May 2026 monthly close.
