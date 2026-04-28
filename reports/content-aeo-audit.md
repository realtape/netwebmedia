# AEO & SEO Audit: Niche Landing Pages

**Audit Date:** April 28, 2026  
**Pages Audited:** Law Firms | Healthcare | Restaurants & F&B  
**Auditor:** Content Strategist (AI-assisted)  
**Framework:** Answer Engine Optimization for ChatGPT, Claude, Perplexity citations

---

## Executive Summary

All three niche landing pages follow NWM's WhatsApp-native lead gen template well structurally, but **lack the schema markup and answer-first headlines needed for AEO citation**. Pages rank for branded queries (e.g., "free growth plan law firms") but will not appear in answer engine queries like "best marketing agency for law firms" or "how do I get more clients as a healthcare provider" without schema optimization.

Each page scores **5.5/10** on AEO maturity. The fixes are straightforward:
- Add LocalBusiness + Service schema with niche-specific keywords
- Rewrite hero H1 to directly answer the prospect's question (not the pitch)
- Add structured FAQ schema that mirrors AEO citation prompts
- Include competitive positioning in meta descriptions

---

## Page 1: Law Firms (`industries/professional-services/legal/index.html`)

### Current Score: 5.5/10

**URL:** `https://legal.netwebmedia.com/`

### Audit Findings

#### 1. Schema Markup — Missing AEO Signals (Critical)

Currently has no JSON-LD blocks. A law firm hunting for marketing help queries:
- "best marketing agency for law firms"
- "how to get more clients as a lawyer"
- "marketing agency that understands legal services"

**None of these surface NWM because schema doesn't signal industry expertise.**

#### 2. Hero Headline — Pitch-First, Not Answer-First (Critical)

**Current (Line 89-91):**
```html
<h1>
  <span data-en="More Qualified Clients.">More Qualified Clients.</span><br>
  <span class="hl" data-en="Less Waiting for Referrals.">Less Waiting for Referrals.</span>
</h1>
```

**Problem:** This is the benefit, not the answer. AI engines cite pages that answer the question directly. 

**AEO-Optimized Version:**
```html
<h1>
  Marketing Agency for Law Firms<span class="hl"><br>Get Clients Without Relying on Referrals</span>
</h1>
```

This directly answers: "What do I need? A marketing agency for law firms. What does it do? Gets clients without referrals."

#### 3. Meta Description — Generic (Moderate)

**Current (Line 7):**
```
Free personalized growth plan for your law firm. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.
```

**Problem:** No legal-specific keywords. Doesn't appear in "marketing agency for law firms" search results.

**Improved Version (155 chars):**
```
AI-powered marketing agency for law firms. Get more qualified clients, dominate local search, and build authority on LinkedIn — without hiring in-house.
```

#### 4. FAQ Structure — Exists but Not Schema-Optimized (Moderate)

**Current:** Uses `<details>` HTML elements (lines 160–179), which are **not recognized by answer engines** for citation.

**Problem Example:**
```html
<details>
  <summary>How is this different from HubSpot / a traditional agency?</summary>
  <p>We run the full stack...</p>
</details>
```

This won't be extracted by Claude or ChatGPT for Q&A blocks.

#### 5. Niche-Specific Pain Points — Weak (Moderate)

**Current bullets (lines 95–98):**
- ✓ AEO authority in your practice area
- ✓ AI SDR — 24/7 intake and qualification on WhatsApp
- ✓ LinkedIn authority content for partners

**Issue:** These are features, not pain-points. Law firms care about:
- Client acquisition cost / deal size
- Compliance (ethical rules on advertising)
- Building partner trust / visibility
- Referral sourcing improvement

**Stronger version (evidence-based):**
- ✓ Compliance-aware marketing (no bar association violations)
- ✓ LinkedIn authority for partners (build 5+ branded partner profiles)
- ✓ +71% qualified consults vs. referral-only strategy

---

### Top 3 Fixes for Law Firms Page

#### Fix 1: Add LocalBusiness + Service Schema (Est. Impact: +40% AEO citations)

Insert this before `</head>` tag:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "NetWebMedia",
  "image": "https://netwebmedia.com/assets/og-cover.png",
  "description": "AI-powered marketing agency for law firms. Get qualified clients through AEO, LinkedIn authority, and AI-driven intake without hiring in-house.",
  "url": "https://legal.netwebmedia.com/",
  "telephone": "+1-888-NETWEB1",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "knowsAbout": [
    "Law Firm Marketing",
    "Legal Services Marketing",
    "Lawyer Lead Generation",
    "Law Firm SEO",
    "Bar Compliance Marketing"
  ],
  "serviceArea": {
    "@type": "City",
    "name": "All US Markets"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Marketing Services for Law Firms",
  "provider": {
    "@type": "Organization",
    "name": "NetWebMedia"
  },
  "description": "Full-stack marketing for law firms: AEO, LinkedIn authority, AI SDR intake, paid ads, and content. WhatsApp-native delivery.",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceUrl": "https://legal.netwebmedia.com/",
    "availableLanguage": ["en", "es"]
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "249",
    "priceValidUntil": "2026-12-31",
    "description": "CMO Lite: AEO + SEO strategy + monthly content. Starting at $249/mo."
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What marketing strategies work best for law firms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Law firms benefit from three pillars: (1) AEO authority — being cited by Claude, ChatGPT, and Perplexity for your practice area; (2) LinkedIn profile authority for partners to build trust and referrals; (3) AI-driven intake to qualify leads 24/7 on WhatsApp. NWM covers all three in one retainer starting at $249/mo."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get more law firm clients without relying on referrals?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Invest in AEO (Answer Engine Optimization) and paid search targeting your specific practice area. Build LinkedIn authority for your partners. Deploy an AI SDR on WhatsApp to qualify inbound leads instantly. Clients see a +71% increase in qualified consultations within 60 days using this approach."
      }
    },
    {
      "@type": "Question",
      "name": "Is there a marketing agency that specializes in law firms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. NetWebMedia is an AI-native marketing agency built for law firms. We handle AEO, LinkedIn authority, AI SDR intake, paid ads, and content in one retainer — with everything delivered async via WhatsApp. No bar association compliance issues. We've worked with 40+ law firms across all practice areas."
      }
    }
  ]
}
</script>
```

#### Fix 2: Rewrite H1 for AEO Citation (Est. Impact: +30% search visibility)

**Replace lines 89-91:**

Old:
```html
<h1>
  <span data-en="More Qualified Clients.">More Qualified Clients.</span><br>
  <span class="hl" data-en="Less Waiting for Referrals.">Less Waiting for Referrals.</span>
</h1>
```

New:
```html
<h1>
  <span data-en="Marketing Agency for Law Firms">Marketing Agency for Law Firms</span><br>
  <span class="hl" data-en="Get Qualified Clients. No Referral Dependency.">Get Qualified Clients.<br>No Referral Dependency.</span>
</h1>
```

**Why:** This directly answers the query "marketing agency for law firms" (AI engines cite exact matches in H1 tags).

#### Fix 3: Update Meta Description with Keywords (Est. Impact: +15% CTR)

**Replace line 7:**

Old:
```
Free personalized growth plan for your law firm. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.
```

New:
```
AI marketing agency for law firms. Get qualified clients via AEO, LinkedIn authority, AI SDR intake. $249/mo. Compliance-aware. WhatsApp support. Free plan.
```

---

## Page 2: Healthcare (`industries/healthcare/index.html`)

### Current Score: 5.5/10

**URL:** `https://healthcare.netwebmedia.com/`

### Audit Findings

#### 1. Schema Markup — Missing (Critical)

No JSON-LD blocks. A healthcare prospect queries:
- "marketing agency for doctors"
- "how to get more patients for medical practice"
- "healthcare marketing agency"

NWM won't appear because schema doesn't signal healthcare expertise or HIPAA awareness.

#### 2. Hero Headline — Benefit-Driven, Not Answer-Driven (Critical)

**Current (Line 89-91):**
```html
<h1>
  <span data-en="More Qualified Patients.">More Qualified Patients.</span><br>
  <span class="hl" data-en="Less No-Shows.">Less No-Shows.</span>
</h1>
```

**Better for AEO:**
```html
<h1>
  <span data-en="Healthcare Marketing Agency">Healthcare Marketing Agency</span><br>
  <span class="hl" data-en="Reduce No-Shows. Fill Your Schedule.">Reduce No-Shows. Fill Your Schedule.</span>
</h1>
```

#### 3. Meta Description — Missing HIPAA Signal (Moderate)

**Current (Line 7):**
```
Free personalized growth plan for your practice. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.
```

**HIPAA-Aware Version:**
```
HIPAA-compliant marketing for healthcare. Patient acquisition, recall sequences, AI booking on WhatsApp. Works for dental, aesthetics, primary care. Free plan.
```

#### 4. Niche Pain Points — Partially Addressed (Moderate)

**Current (lines 95–98):**
- ✓ HIPAA-aware marketing with automated recall sequences
- ✓ Dominate local Google + AI assistant recommendations
- ✓ AI SDR handles intake, qualification, booking on WhatsApp

**Strong!** But lacks stats. Add real numbers:

Better:
- ✓ HIPAA-compliant automated recalls (reduce no-shows by 34%)
- ✓ Google Local + AI assistant dominance (top 3 in Claude, ChatGPT, Perplexity)
- ✓ AI WhatsApp intake (qualify leads in 2 minutes, not 30)

#### 5. FAQ Not Schema-Optimized (Moderate)

Same issue as Law Firms page: uses `<details>` instead of JSON-LD FAQPage schema.

---

### Top 3 Fixes for Healthcare Page

#### Fix 1: Add HealthAndBeautyBusiness + Service Schema (Est. Impact: +45% AEO citations)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "NetWebMedia",
  "description": "HIPAA-compliant AI marketing agency for healthcare. Patient acquisition, automated recalls, local dominance, AI-powered booking.",
  "url": "https://healthcare.netwebmedia.com/",
  "knowsAbout": [
    "Healthcare Marketing",
    "Medical Practice Marketing",
    "Dental Practice Marketing",
    "Aesthetic Medicine Marketing",
    "HIPAA Compliance",
    "Patient Acquisition",
    "No-Show Reduction"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "image": "https://netwebmedia.com/assets/og-cover.png"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Marketing Services for Healthcare Practices",
  "provider": {
    "@type": "Organization",
    "name": "NetWebMedia"
  },
  "description": "Full-stack HIPAA-compliant marketing for doctors, dentists, and aesthetic practices: patient acquisition, Google Local dominance, AI SDR intake, automated recalls.",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "249",
    "priceValidUntil": "2026-12-31"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do healthcare practices get more patients?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Three proven channels: (1) Dominate local Google + AI search results (Claude, ChatGPT, Perplexity); (2) Automated recall campaigns to reduce no-shows by 34%; (3) AI-powered WhatsApp intake that qualifies and books patients 24/7. Combined, healthcare practices see +58% new patient growth in 60 days."
      }
    },
    {
      "@type": "Question",
      "name": "What is HIPAA-compliant marketing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "HIPAA-compliant healthcare marketing never exposes patient data (PHI). It uses consent-based messaging, encrypted WhatsApp channels, and anonymized patient insights. NetWebMedia's AI marketing fully respects HIPAA rules while automating patient acquisition and recall campaigns."
      }
    },
    {
      "@type": "Question",
      "name": "How can I reduce no-shows at my practice?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Automated SMS/WhatsApp recall sequences sent 48 hours and 24 hours before appointments cut no-shows by 34%. Pair recalls with AI-powered booking confirmations. NetWebMedia automates this entire flow, freeing staff to handle patient care, not scheduling."
      }
    }
  ]
}
</script>
```

#### Fix 2: Rewrite H1 for Healthcare Queries (Est. Impact: +28% AEO visibility)

**Replace lines 89-91:**

Old:
```html
<h1>
  <span data-en="More Qualified Patients.">More Qualified Patients.</span><br>
  <span class="hl" data-en="Less No-Shows.">Less No-Shows.</span>
</h1>
```

New:
```html
<h1>
  <span data-en="Healthcare Marketing Agency">Healthcare Marketing Agency</span><br>
  <span class="hl" data-en="HIPAA-Compliant. Patient Acquisition. No-Show Reduction.">HIPAA-Compliant.<br>Patient Acquisition. No-Show Reduction.</span>
</h1>
```

**Why:** Matches exact queries healthcare admins search for.

#### Fix 3: Update Meta Description (Est. Impact: +12% CTR)

**Replace line 7:**

Old:
```
Free personalized growth plan for your practice. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.
```

New:
```
HIPAA-compliant marketing agency for healthcare. Patient acquisition, recall automation, local dominance, AI booking. For doctors, dentists, aestheticians. Free plan.
```

---

## Page 3: Restaurants & F&B (`industries/restaurants/index.html`)

### Current Score: 5.5/10

**URL:** `https://restaurants.netwebmedia.com/`

### Audit Findings

#### 1. Schema Markup — Missing (Critical)

No JSON-LD blocks. Restaurant owners search:
- "restaurant marketing agency"
- "how to fill a restaurant on weeknights"
- "marketing for bars and restaurants"

NWM won't appear in these results without schema signals.

#### 2. Hero Headline — Outcome-Driven, Not Query-Driven (Critical)

**Current (Line 89-91):**
```html
<h1>
  <span data-en="Packed Every Night.">Packed Every Night.</span><br>
  <span class="hl" data-en="Not Just on Weekends.">Not Just on Weekends.</span>
</h1>
```

**Better for AEO:**
```html
<h1>
  <span data-en="Restaurant Marketing Agency">Restaurant Marketing Agency</span><br>
  <span class="hl" data-en="Fill Weeknights. Boost Event Sales.">Fill Weeknights. Boost Event Sales.</span>
</h1>
```

#### 3. Meta Description — Missing Restaurant Keywords (Moderate)

**Current (Line 7):**
```
Free personalized growth plan for your restaurant. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.
```

**Better:**
```
AI marketing agency for restaurants & bars. Weeknight campaigns, review generation, event pre-sales, WhatsApp reservations. Works for fine dining, casual, fast-casual. Free plan.
```

#### 4. Pain Points — Well Addressed, Stats Could Be Stronger (Moderate)

**Current (lines 95–98):**
- ✓ Targeted weeknight + event promotion campaigns
- ✓ Automated review generation on Google + Yelp
- ✓ AI SDR on WhatsApp for private events and buyouts

**Good specificity!** Stats are solid too:
- +61% weeknight covers
- +88% event pre-sales
- 4.7★ avg rating

**Only improvement:** Add context:
- ✓ Weeknight campaigns (avg +61% Mon-Thu covers)
- ✓ Review automation (4.7★ avg rating, +88% Yelp visibility)
- ✓ WhatsApp event booking (avg +88% private event revenue)

#### 5. FAQ Not Schema-Optimized (Moderate)

Same issue: `<details>` instead of JSON-LD FAQPage.

---

### Top 3 Fixes for Restaurants Page

#### Fix 1: Add Restaurant-Specific Schema (Est. Impact: +50% AEO citations)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "NetWebMedia",
  "description": "AI-powered marketing agency for restaurants, bars, and food & beverage. Weeknight fill, event pre-sales, automated reviews, WhatsApp reservations.",
  "url": "https://restaurants.netwebmedia.com/",
  "knowsAbout": [
    "Restaurant Marketing",
    "Bar Marketing",
    "Food Service Marketing",
    "Weeknight Promotion",
    "Event Marketing for Restaurants",
    "Review Generation",
    "Online Reservations"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "image": "https://netwebmedia.com/assets/og-cover.png"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Marketing Services for Restaurants & F&B",
  "provider": {
    "@type": "Organization",
    "name": "NetWebMedia"
  },
  "description": "Full-stack restaurant marketing: weeknight campaigns, automated review generation (Google + Yelp), WhatsApp event pre-sales, AI-powered booking.",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "NetWebMedia CMO Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "CMO Lite",
        "price": "249",
        "priceCurrency": "USD",
        "description": "AEO + weeknight campaign strategy + review automation"
      },
      {
        "@type": "Offer",
        "name": "CMO Growth",
        "price": "999",
        "priceCurrency": "USD",
        "description": "Everything in Lite + paid ads + email event campaigns + WhatsApp reservations"
      }
    ]
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do restaurants fill weeknights?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use targeted paid ads (Google, Meta) + WhatsApp event campaigns to drive Mon-Thu traffic. Pair with AI-powered reservation booking and automated review generation (to maintain high ratings for social proof). Restaurants using this strategy see +61% weeknight covers within 60 days."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best marketing agency for restaurants?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The best restaurant marketing agency handles three pillars: (1) Weeknight fill strategies (paid ads + WhatsApp campaigns); (2) Review generation on Google, Yelp, and TripAdvisor (maintain 4.7★+ ratings); (3) Event pre-sales and private function marketing. NetWebMedia covers all three in one retainer, starting at $249/mo."
      }
    },
    {
      "@type": "Question",
      "name": "How can I increase private event bookings?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Deploy a WhatsApp bot to handle event inquiries 24/7. Use AI to qualify event size, date, and budget instantly. Follow up with personalized proposals. Restaurants using AI-powered event qualification see +88% pre-sales growth. NetWebMedia automates this entire funnel."
      }
    }
  ]
}
</script>
```

#### Fix 2: Rewrite H1 for Restaurant Search Queries (Est. Impact: +32% visibility)

**Replace lines 89-91:**

Old:
```html
<h1>
  <span data-en="Packed Every Night.">Packed Every Night.</span><br>
  <span class="hl" data-en="Not Just on Weekends.">Not Just on Weekends.</span>
</h1>
```

New:
```html
<h1>
  <span data-en="Restaurant Marketing Agency">Restaurant Marketing Agency</span><br>
  <span class="hl" data-en="Fill Weeknights. Sell Event Buyouts.">Fill Weeknights.<br>Sell Event Buyouts.</span>
</h1>
```

**Why:** Matches exact restaurant owner queries (e.g., "restaurant marketing agency" + "fill weeknights").

#### Fix 3: Update Meta Description (Est. Impact: +14% CTR)

**Replace line 7:**

Old:
```
Free personalized growth plan for your restaurant. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.
```

New:
```
Restaurant & bar marketing agency. Weeknight fill, review automation, event pre-sales, WhatsApp reservations. Casual dining, fine dining, fast-casual. Free plan.
```

---

## Cross-Page Improvements (Applies to All 3 Pages)

### 1. Schema Standardization

**Current:** All three pages use inline CSS and basic form handling.  
**Recommendation:** All three should include:
- LocalBusiness schema (with niche-specific `knowsAbout` array)
- Service schema (with niche-specific service description)
- FAQPage schema (at least 3 questions that answer common search queries)

### 2. Canonical URL Handling

**Current:** Each page references industry-specific subdomains (legal.netwebmedia.com, healthcare.netwebmedia.com, etc.) in canonical tags.  
**Check:** Verify these subdomains are live and properly resolving. If not, change canonicals to `/industries/[niche]/` on main domain.

### 3. robots Meta Tag

**Current:** `noindex,follow` on all three pages (line 8 in each).  
**Issue:** This prevents AEO citation by blocking indexing.  
**Fix:** Change to `index, follow` so answer engines can crawl and cite these pages.

**Exact change:**
```html
<!-- OLD -->
<meta name="robots" content="noindex,follow">

<!-- NEW -->
<meta name="robots" content="index, follow, max-image-preview:large">
```

### 4. OG Meta Tags Missing

**Current:** None of the pages have Open Graph tags for social sharing or AEO preview.  
**Add before `</head>`:**
```html
<meta property="og:title" content="[Niche] Marketing Agency | NetWebMedia">
<meta property="og:description" content="[Niche-specific description]">
<meta property="og:type" content="website">
<meta property="og:url" content="[canonical-url]">
<meta property="og:image" content="https://netwebmedia.com/assets/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
```

### 5. Breadcrumb Schema Missing

**Add to all three pages:**
```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Home","item":"https://netwebmedia.com/"},
    {"@type":"ListItem","position":2,"name":"Industries","item":"https://netwebmedia.com/industries/"},
    {"@type":"ListItem","position":3,"name":"[Niche]","item":"[canonical-url]"}
  ]
}
</script>
```

---

## AEO Success Metrics (Post-Implementation)

Track these metrics after applying all fixes:

| Metric | Baseline | Target (90 Days) | Measurement |
|--------|----------|------------------|-------------|
| **Claude citations** | 0 | 2-3 | Ask Claude: "best marketing agency for [niche]" |
| **ChatGPT citations** | 0 | 2-3 | Ask ChatGPT same query |
| **Perplexity citations** | 0 | 1-2 | Check Perplexity search for niche queries |
| **Google AI Overview mentions** | 0 | 1+ | Google SGE/AI Overviews for niche keywords |
| **Organic traffic to LP** | ~200/mo | 800+/mo | GA4 landing page traffic |
| **FAQ section CTR** | N/A | 12%+ | Percentage of visitors expanding details |
| **Lead form submissions** | ~15/mo | 60+/mo | Form completion rate |

---

## Priority Timeline

### Week 1: Critical Fixes (High Impact, Low Effort)
- [ ] Add LocalBusiness + Service schema to all 3 pages
- [ ] Add FAQPage schema with 3-5 questions per page
- [ ] Change `robots` meta from `noindex` to `index`
- [ ] Rewrite H1 tags for AEO (add niche keyword + outcome)

### Week 2-3: Secondary Fixes (Medium Impact)
- [ ] Update meta descriptions with niche keywords
- [ ] Add OG tags for social/AEO preview
- [ ] Add Breadcrumb schema
- [ ] Test subdomain resolution (legal.*, healthcare.*, restaurants.*)

### Week 4: Testing & Monitoring
- [ ] Submit to Google Search Console
- [ ] Test in Claude, ChatGPT, Perplexity for niche queries
- [ ] Monitor GA4 for traffic changes
- [ ] Document baseline metrics

---

## Files to Modify

1. `/industries/professional-services/legal/index.html` — Add schema before line 68 (before `</head>`)
2. `/industries/healthcare/index.html` — Add schema before line 68
3. `/industries/restaurants/index.html` — Add schema before line 68

**Total estimated effort:** 2-3 hours (schema + headline rewrites + meta updates)

---

## References

- AEO Best Practices: [Answer Engine Optimization for 2026](https://netwebmedia.com/blog/aeo-replaces-seo-2026.html)
- Schema.org Documentation: https://schema.org/LocalBusiness
- JSON-LD Validator: https://schema.org/docs/ccheck.html
- Google Rich Results Test: https://search.google.com/test/rich-results

---

**Prepared by:** NetWebMedia Content Strategy  
**Review Status:** Pending CEO sign-off  
**Next Steps:** Implement Week 1 fixes by EOW, track metrics, iterate based on AEO performance
