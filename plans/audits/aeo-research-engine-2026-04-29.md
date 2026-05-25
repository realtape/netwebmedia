# AEO Research Engine — Deliverables & Timeline — April 29, 2026

**Status:** 5 files created. Ready for launch. Survey goes live immediately.

---

## Files Created

### 1. `aeo-survey.html` (NEW landing page)
- **Path:** `/aeo-survey.html`
- **Purpose:** Survey hosting + enrollment
- **Features:**
  - Bilingual EN/ES with `data-en`/`data-es` attributes
  - Native form submission to `/api/public/forms/submit?form=aeo-survey-2026`
  - 15 questions (demographics, behavior, adoption, barriers, willingness-to-pay)
  - FAQ schema + WebPage schema for AI discoverability
  - Full brand compliance (Gulf Oil palette, Poppins/Inter fonts, no cutesy emojis)
- **CTA:** "Start Survey" + headline emphasizing 4 minutes + free report + $499 audit
- **Early access messaging:** "Survey participants get the report 7 days early (June 23, 2026)"

### 2. `assets/aeo-survey-2026.json` (NEW)
- **Path:** `/assets/aeo-survey-2026.json`
- **Purpose:** Survey metadata + question definitions
- **Contains:**
  - All 15 questions with EN/ES copy
  - Options and data types
  - Citation potential flags (high/medium/low)
  - Headline potential for each question (e.g., "X% of SMBs would pay $1K+/mo")
  - Reporting guidance (5 ranked findings + expected headlines)
- **Use case:** Reference for report generation, API consumption, audit trail

### 3. `aeo-survey-thanks.html` (NEW)
- **Path:** `/aeo-survey-thanks.html`
- **Purpose:** Post-submission confirmation + next-steps
- **Features:**
  - Bilingual EN/ES
  - GA4 event tracking: `survey_submit` + label `aeo_survey_2026`
  - Facebook Pixel tracking (if connected): Lead event
  - FAQ block addressing common concerns (anonymity, data usage, audit details)
  - Cross-links to AEO Methodology + blog posts
  - Related articles section (3 blogs)
  - `noindex` robots tag (don't rank this page)
- **CTA:** Links to methodology page + blog articles

### 4. `plans/aeo-survey-tier1-pitches-2026.md` (NEW)
- **Path:** `/plans/aeo-survey-tier1-pitches-2026.md`
- **Purpose:** Outreach playbook for Tier 1 outlets
- **Targets:** TechCrunch, CMSWire, HubSpot Blog, Search Engine Land, MarTech.org
- **For each outlet:**
  - Reporter targeting (with beat verification notes)
  - Customized subject line + pitch angle
  - Full email template (ready to customize with names)
  - Why NetWebMedia wins (differentiator per audience)
- **Timeline:** All pitches ship June 30 (report launch day), simultaneous (no embargo)
- **Sequence:** Initial pitch (Day 0) → no-reply follow-up (Day 3) → hard close (Day 7)
- **Reuse plan:** Once one placement lands, cascade to secondary outlets within 2 weeks

### 5. `plans/aeo-rankings-applications-2026.md` (NEW)
- **Path:** `/plans/aeo-rankings-applications-2026.md`
- **Purpose:** Agency ranking applications playbook
- **Targets:** First Page Sage, Modern Marketing Partners, Respona, Moosend
- **For each ranking:**
  - Current URL (verify before applying)
  - Submission deadline / method
  - Customized angle (what appeals to each)
  - Supporting links (methodology, homepage, case studies)
  - Why NetWebMedia wins (differentiator per ranking)
- **Timeline:** Applications July 1-15, 2026. Awards announce Sept-Oct
- **Success criteria:** Get listed in 3+ rankings by Q3
- **Post-listing:** Update website with badges, amplify on social, add to sales materials

---

## Survey Question Rationale (Citation-Generating Questions)

### Top 3 questions designed for citable headlines:

**#3 — "Have you asked ChatGPT, Claude, or Perplexity for buying advice?"**
- **Why:** Establishes the addressable market for AEO
- **Expected headline:** "X% of US SMB owners use AI search for buying decisions"
- **Citation potential:** High (reporters love market-size stats)
- **Use case:** TechCrunch story ("SMBs Are Using AI to Buy But Not Optimizing for It")

**#11 — "What would you pay for AI-citation services?"**
- **Why:** Pricing sensitivity is the goldmine statistic
- **Expected headline:** "X% of SMBs would pay $1K+/month for AEO services"
- **Citation potential:** Highest (vendors care about TAM; investors care about pricing tiers)
- **Use case:** MarTech.org / CMSWire ("Market Opportunity in AEO Services")
- **Secondary stat:** "X% wouldn't invest (awareness gap)"

**#9 — "Are you cited by any AI engine when someone asks about your category?"**
- **Why:** Shows the execution gap (awareness vs. results)
- **Expected headline:** "Only X% of SMBs are being cited by AI engines today"
- **Citation potential:** High (defines the problem NetWebMedia solves)
- **Use case:** All outlets ("The AEO Adoption Gap")

---

## Outreach Sequence & Timeline

### Phase 1: Survey Launch (April 29 - June 30)
- **April 29:** Survey goes live at `/aeo-survey.html`
- **May 1-15:** Social campaign + email campaign to customer list (warm signups)
- **May 16-June 15:** Sustained organic recruitment (blog, paid if budget allows)
- **June 1:** Target 100+ responses (enough for early statistical validity)
- **June 15:** Data collection closes; analysis begins

### Phase 2: Report Publishing (June 23-30)
- **June 23:** Early access email to 300 survey participants (7-day head start)
- **June 30:** Public report release

### Phase 3: Tier 1 Pitch Wave (June 30 - July 7)
- **June 30 (Day 0):** All 5 Tier 1 pitches ship simultaneously
  - TechCrunch (marketing angle)
  - CMSWire (industry trade angle)
  - HubSpot Blog (SMB audience angle)
  - Search Engine Land (SEO community angle)
  - MarTech.org (vendor angle)
- **July 3 (Day 3):** No-reply follow-up to all 5 outlets
- **July 7 (Day 7):** Hard close (move to warm social outreach if needed)
- **Expected outcome:** 1-2 placements by July 31

### Phase 4: Rankings Applications (July 1-15)
- **July 1-7:** Submit to First Page Sage + Modern Marketing Partners (deadline-driven)
- **July 8-14:** Pitch Respona + Moosend editorial (relationship-based)
- **Expected outcome:** 3+ listings announced Sept-Oct

### Phase 5: Compound Effect (July - October)
- Once Tier 1 placement lands: secondary outlets cite the placement + request interviews
- Once ranking listings go live: add badges to website, amplify on social, improve SEO authority
- By October: 5-8 earned mentions across Tier 1 + Tier 2 sources

---

## Success Metrics & Timeline to First Citation

### 8-10 week ideal path:
1. **Week 1-8** (Apr 29 - Jun 30): Survey recruitment, data collection, report writing
2. **Week 8-9** (Jun 30 - Jul 7): Tier 1 pitches ship + follow-ups
3. **Week 9-12** (Jul 7 - Aug 4): Outlets deliberate, request interviews, publish
4. **Target:** First Tier 1 placement by August 4, 2026

### 14-16 week realistic path (accounting for slower editorial cycles):
1. **Week 1-8**: Survey + report (same)
2. **Week 8-14**: Pitches go out, but outlets take 2-3 weeks to respond
3. **Week 14-16**: Publication window (late August / early September)
4. **Target:** First Tier 1 placement by September 15, 2026

### Success markers along the way:
- [ ] 300+ survey responses collected (by June 15)
- [ ] Report drafted with 5+ citable findings (by June 23)
- [ ] Early access email delivered to survey participants (June 23)
- [ ] All 5 Tier 1 pitches sent (June 30)
- [ ] First reporter reply received (within 7-10 days of pitch)
- [ ] First placement published (target: August 1 - September 15)
- [ ] 3+ ranking applications submitted (by July 15)
- [ ] First ranking listing announced (target: September 1 - October 31)

---

## Bet: Which Tier 1 outlet says yes first?

**Primary bet: CMSWire**

**Reasoning:**
1. **Editorial appetite:** CMSWire covers AEO adoption heavily (part of their MarTech vertical)
2. **Audience match:** Their readers are MarTech practitioners + strategy buyers — exact audience for the survey findings
3. **Timing:** CMSWire publishes 2-3 original research stories per month; editorial cycle is predictable
4. **Relationship potential:** Craig Borowski (editor) has been quoted in our own content — existing awareness
5. **Lower competition:** TechCrunch will get 50+ pitches on this topic; CMSWire is more selective but actively recruiting stories

**Secondary bet: HubSpot Blog**

**Reasoning:**
1. **Audience overlap:** HubSpot's SMB audience directly matches survey respondents
2. **Guest post model:** Lower barrier to entry than news placement (they publish guest posts aggressively)
3. **Brand alignment:** HubSpot loves original SMB research (they published their own State of HubSpot Report, similar model)
4. **Timeline:** Guest post editorial cycle is 2-3 weeks (faster than news outlets)

**Tertiary bet: Search Engine Land**

**Reasoning:**
1. **Expertise credibility:** SEO/AEO thought leadership is their DNA
2. **Technical angle:** Our methodology is technically sound, which appeals to their audience
3. **Contrarian positioning:** The "AEO adoption lags behind usage" angle is the kind of counterintuitive finding they love
4. **Risk:** Slower editorial (4+ week turnaround), but high prestige if it lands

**Unlikely but possible: TechCrunch**

**Reasoning:**
1. **High prestige** but also highest volume of pitches
2. **SMB angle** is secondary to their enterprise/startup focus
3. **Timing:** Their marketing vertical moves slower than their tech news section

**Unlikely: MarTech.org**

**Reasoning:**
1. **Relationship-based** (not pitch-responsive like trade publications)
2. **Longer cycle** (editorial decisions are collaborative, slower)
3. **Worth pursuing but don't lead with this one**

---

## Resource Requirements

**To execute this play, you need:**
1. **Survey form backend:** `/api/public/forms/submit?form=aeo-survey-2026` (already exists, tested in audit)
2. **Email platform:** To send early access + follow-ups (use crm-vanilla)
3. **Analytics:** GA4 events on survey submission page (already configured)
4. **Report writing:** 2-3 hours (Carlos or subcontract to freelancer)
5. **Pitch execution:** 4 hours (personalize templates, send emails)
6. **Rankings applications:** 3-4 hours (fill forms, gather links)

**Total execution time:** 12-15 hours spread over 8 weeks.

---

## Why This Moat Works

Original research is the only citation tactic that:
1. **Creates primary data** (not commentary on others' findings)
2. **Generates 15-40 earned backlinks** from one Tier 1 placement
3. **Persists in training data** (cited by LLMs for 12+ months)
4. **Compounds:** One placement enables 3-5 secondary placements

The survey itself is also a lead magnet: 300+ participants = 300+ email addresses + intent signal (they care about AEO). Even if the report only generates 1 Tier 1 placement, the lead list alone is worth the effort.

**This is the play that converts NetWebMedia from "teaches AEO" to "cited authority on AEO."**

---

## Next Steps

1. **Carlos:** Send survey live at `/aeo-survey.html` with LinkedIn/Twitter announcement
2. **Email list:** Send "We're surveying 300 SMBs on AEO" campaign
3. **Team:** Share survey link in all relevant customer touchpoints (audit reports, email sig, etc.)
4. **Track:** Monitor responses in CRM; aim for 300+ by June 15
5. **June 23:** Prepare early-access report + send to participants
6. **June 30:** Finalize report, send all 5 Tier 1 pitches
7. **July 1-15:** Apply to all 4 rankings
8. **Aug 1+:** Expect placement responses and follow-ups

**Ship date:** Survey goes live today (April 29). Report target: June 30. Tier 1 pitches: June 30 + July 1-3 follow-ups.
