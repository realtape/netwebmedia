# Pre-Launch Pricing Audit — NetWebMedia (2026-05-01)

**Conducted by:** Finance Controller  
**Status:** 🔴 NOT READY FOR MONDAY LAUNCH (critical backend/frontend mismatches)

---

## 1. Pricing Master Table

All prices shown in USD. Billing in CLP via Mercado Pago at rate 950 CLP/USD (set in `api-php/routes/billing.php` L19).

| Tier | pricing.html | services.html | billing.php | Variance | Notes |
|---|---|---|---|---|---|
| **AEO Audit** | $997 one-time | — | (no seed) | 🟢 None | Credit guarantee: 100% toward first 3 mo retainer |
| **AEO Starter** | $249/mo, setup $0 | $249 | $249/mo, setup $249 | 🔴 SETUP MISMATCH | HTML shows $0 setup; backend charges $249 |
| **CMO Growth** | $999/mo, setup $499 | $999 + $499 | $999/mo, setup $999 | 🔴 SETUP MISMATCH | HTML shows $499 setup; backend charges $999 |
| **CMO Scale** | $2,499/mo, setup $999 | $2,499 + $999 | $2,499/mo, setup $2,499 | 🔴 SETUP MISMATCH | HTML shows $999 setup; backend charges $2,499 |
| **CMO Enterprise** | $5,999/mo, setup TBD | — | **MISSING** | 🔴 NOT IN BACKEND | Displayed on pricing.html; no plan seed in billing.php |

### Annual Prepay Pricing (15% discount, setup waived)

| Tier | Monthly | Annual Display | Implied Annual | Math | Status |
|---|---|---|---|---|---|
| **AEO Starter** | $249 | $212/mo, $2,540/yr | $2,540 | $249 × 12 = $2,988; − $448 = $2,540 ✓ | ✓ CORRECT |
| **CMO Growth** | $999 + $499 setup | $849/mo, $10,190/yr | $10,190 | $999 × 12 = $11,988; × 0.85 = $10,189 ✓ | ✓ CORRECT* |
| **CMO Scale** | $2,499 + $999 setup | $2,124/mo, $25,490/yr | $25,490 | $2,499 × 12 = $29,988; × 0.85 = $25,489 ✓ | ✓ CORRECT* |
| **CMO Enterprise** | $5,999 + TBD | $5,099/mo, "save 15%" | $5,099 × 12 = $61,188 | $5,999 × 12 = $71,988; × 0.85 = $61,189 ≈ $61,188 | ⚠ CORRECT BUT NOT IN BACKEND |

*Note: Annual math applies 15% discount to monthly recurring fee only, not setup (setup is waived/included). HTML wording "setup waived" is correct UX framing but backend logic must handle it.

---

## 2. Inconsistencies Flagged by Severity

### 🔴 CRITICAL (Customer-facing, billing impact)

**Issue 1: CMO Growth setup fee mismatch**
- **Location:** pricing.html L481 vs billing.php L323
- **HTML says:** "setup $499"
- **Backend charges:** $999
- **Impact:** Customer sees $499 on checkout; billed $999 on first invoice
- **Evidence:**
  ```html
  <!-- pricing.html L481 -->
  data-monthly="/mo · setup $499" 
  ```
  ```php
  // billing.php L323
  'code' => 'cmo_growth',
  'setup' => 999,
  ```
- **Severity:** Billable discrepancy. Customer feels overcharged. **MUST FIX before checkout goes live.**

**Issue 2: CMO Starter setup fee mismatch**
- **HTML says:** "setup $0" (no setup fee)
- **Backend charges:** $249
- **Impact:** Customer sees free onboarding; billed $249
- **Evidence:**
  ```html
  <!-- pricing.html L464 -->
  data-monthly="/mo · no setup fee" 
  ```
  ```php
  // billing.php L315
  'setup' => 297,  // Not zero!
  ```
- **Note:** Starter also shows setup $249 in billing.php, matching the intended $297 ~ $249 pattern.
- **Severity:** Moderate—Starter is entry tier, but still a surprise charge.

**Issue 3: CMO Scale setup fee mismatch**
- **HTML says:** "setup $999"
- **Backend charges:** $2,499
- **Impact:** Customer sees $999; billed $2,499
- **Evidence:**
  ```html
  <!-- pricing.html L499 -->
  data-monthly="/mo · setup $999" 
  ```
  ```php
  // billing.php L334
  'setup' => 2499,
  ```
- **Severity:** High—$1,500 surprise charge on the $2,499/mo tier is material.

**Issue 4: CMO Enterprise tier missing from backend**
- **Location:** pricing.html L513–530 vs billing.php (no plan seed)
- **HTML displays:** Enterprise tier with $5,999/mo, setup custom
- **Backend:** No `cmo_enterprise` plan in `bl_plans_seed()`
- **Impact:** User clicks "Apply for Enterprise" → 404 or checkout fails
- **Evidence:**
  ```html
  <!-- pricing.html L529 -->
  <a href="/contact.html?plan=cmo-enterprise&intent=sales" ... >Apply for Enterprise
  ```
  ```php
  // billing.php: no cmo_enterprise seed
  ```
- **Severity:** Critical—Enterprise tier is unshippable without backend support.

### 🟡 MODERATE (Schema/backend consistency, no customer-facing billing impact yet)

**Issue 5: Annual billing math ambiguity**
- **What HTML says:** "setup waived" on annual prepay
- **What backend does:** `bl_apply_discount()` on the monthly recurring fee only (not setup)
- **Reconciliation:** For Growth: $999 × 12 × 0.85 = $10,189; setup $499 is not included in the discount base (already "waived" in the annual skim, or applied after). Annual display math is *correct* but the narrative is ambiguous.
- **Impact:** None if backend checkout logic handles it right (setup is one-time upfront, discount applies to recurring only). But the copy "setup waived" could confuse sales reps answering customer questions.
- **Severity:** Low for now; clarify copy if there are customer support tickets about it.

**Issue 6: Starter setup fee doesn't round to $249**
- **Stated in billing.php:** `'setup' => 297`
- **Displayed in pricing.html:** "no setup fee"
- **Reconciliation:** Either the backend seed should be $249 (matching Growth's $499 / Scale's $999 pattern), or HTML should display it. Typo?
- **Impact:** Minor—Starter is free tier entry path, but the $297 vs $249 mismatch is sloppy.

---

## 3. Ordering Issues

✓ **No ordering issues detected.**

All pricing pages display tiers in ascending price order:
1. AEO Starter ($249/mo) or AEO Audit ($997 one-time)
2. CMO Growth ($999/mo) — flagged "Most Popular"
3. CMO Scale ($2,499/mo)
4. CMO Enterprise ($5,999/mo)

Growth tier is correctly positioned as mid-tier and visually highlighted. ✓

---

## 4. Currency Issues

✓ **No currency issues detected.**

- All public pages display USD throughout (no CLP hard-coded in HTML)
- `billing.php` correctly converts USD → CLP on checkout at 950 rate
- No leftover CLP from Chile-only era in public copy

---

## 5. Math Verification

### Starter Annual Prepay
- Monthly: $249 × 12 = $2,988
- Annual shown: $2,540
- Save: $2,988 − $2,540 = $448 ✓

### Growth Annual Prepay
- Monthly: $999 × 12 = $11,988
- 15% discount: $11,988 × 0.85 = $10,189.20
- Annual shown: $10,190 ✓
- Setup ($499) is waived (not added to annual total, not discounted) ✓

### Scale Annual Prepay
- Monthly: $2,499 × 12 = $29,988
- 15% discount: $29,988 × 0.85 = $25,489.20
- Annual shown: $25,490 ✓
- Setup ($999) is waived ✓

### Enterprise Annual Prepay
- Monthly: $5,999 × 12 = $71,988
- 15% discount: $71,988 × 0.85 = $61,189.80
- HTML copy: "$5,099/mo · billed annually · save 15%"
- Implied annual: $5,099 × 12 = $61,188 ✓ (matches discount calculation)

**Math Status:** ✓ Annual discount math is correct on all tiers.

---

## 6. Per-Industry Pricing Overrides

✓ **No industry-specific overrides detected.**

Audited 14 niche pages (`industries/*/index.html`):
- Tourism/Hospitality: $249/mo entry shown ✓
- Restaurants: $249/mo entry shown ✓
- Health/Healthcare: $249/mo entry shown ✓
- Beauty/Salons: $249/mo entry shown ✓
- Law Firms: $249/mo entry shown ✓
- Real Estate: $249/mo entry shown ✓
- All other 8 niches: Consistent ✓

Industry pages inherit the main pricing.html tier structure (AEO Audit, Starter, Growth, Scale) with no niche-specific discounts or premium pricing. ✓

---

## 7. Recommended Fixes

### 🔴 MUST FIX BEFORE MONDAY LAUNCH

#### Fix 1: Align billing.php setup fees to pricing.html (CRITICAL)

**File:** `/c/Users/Usuario/Desktop/NetWebMedia/api-php/routes/billing.php`

**Current state (lines 313–334):**
```php
[
  'code'     => 'cmo_starter',
  'setup'    => 297,
],
[
  'code'      => 'cmo_growth',
  'setup'     => 999,    // ← MISMATCH: HTML says $499
],
[
  'code'          => 'cmo_scale',
  'setup'         => 2499,  // ← MISMATCH: HTML says $999
],
```

**Recommended fix:**
```php
[
  'code'     => 'cmo_starter',
  'setup'    => 0,        // ← Change from 297 to 0 (match "no setup fee" in HTML)
],
[
  'code'      => 'cmo_growth',
  'setup'     => 499,     // ← Change from 999 to 499 (match HTML)
],
[
  'code'          => 'cmo_scale',
  'setup'         => 999,    // ← Change from 2499 to 999 (match HTML)
],
```

**Why:** The HTML is the canonical source for customer-facing pricing. Backend must match, or customers will see $X on checkout and be billed $Y on invoice.

**Risk:** NONE—this aligns backend to the published pricing. No customer has been charged yet (still pre-launch).

---

#### Fix 2: Add CMO Enterprise plan seed to billing.php (CRITICAL)

**File:** `/c/Users/Usuario/Desktop/NetWebMedia/api-php/routes/billing.php`

**Add this plan seed after cmo_scale (after line 338):**

```php
[
  'code'          => 'cmo_enterprise',
  'name'          => 'CMO Enterprise',
  'category'      => 'cmo',
  'usd'           => 5999,
  'setup'         => 0,         // Setup is custom; handled via contact sales
  'needs_contact' => true,       // Route to contact form, not self-serve checkout
  'tagline'       => 'Multi-brand · dedicated agent · custom AI — board-ready reports',
  'features'      => [
    'Everything in CMO Scale',
    'Multi-brand CRM (up to 5 brands)',
    'Voice AI unlimited (was metered)',
    'Video Factory unlimited (vs 16/mo)',
    'Custom AI agent build (1 included)',
    'Weekly call with Carlos (founder)',
    'Quarterly strategy offsite',
    '+ ad spend at cost + 10% mgmt fee (min $500/mo)',
  ],
],
```

**Why:** pricing.html displays this tier; backend must have it (even if checkout redirects to /contact.html). Allows the billing API to return the full tier list for UI rendering.

**Risk:** NONE—the tier already exists in pricing.html. This just makes the backend consistent.

---

#### Fix 3: Verify annual prepay logic in checkout flow

**File:** `/c/Users/Usuario/Desktop/NetWebMedia/api-php/routes/billing.php`

**Lines to audit:** 710–788 (annual prepay / one-time checkout)

**Current behavior:**
- Monthly flow: Apply coupon discount → create preapproval
- Annual flow: ??? (not visible in line snippet)

**Action:** Verify that when a user toggles "Annual" on pricing.html and submits:
1. The $999 → $849/mo recalc is sent from UI to backend
2. Backend setup fee logic: is it waived (not charged) or included in the discount base?

**Why:** The HTML says "setup waived" on annual, but billing.php `bl_apply_discount()` only discounts the monthly recurring amount. Setup is one-time. If annual prepay is actually a 12-month preapproval with setup bundled in month 1, the math breaks.

**Recommendation:** 
- If setup is truly not charged on annual, then annual checkout should not include setup in the transaction total.
- If setup is charged on annual, then HTML copy "setup waived" is wrong.

**Current math (assuming HTML is correct):**
- Growth annual: $999 × 12 months × 0.85 discount = $10,189. Setup $499 is NOT added (not charged).
- This implies annual prepay skips the setup entirely.

This needs a code review before checkout opens.

---

### 🟡 NICE-TO-FIX (Before or after launch, low priority)

#### Fix 4: Align Starter setup in billing.php to $249 (optional)

**Rationale:** The $297 in billing.php vs $249 in HTML is odd. Likely a typo. Match it to the pattern: Starter $249 / Growth $499 / Scale $999. Or update HTML to show "setup $297" if that's intentional.

**Current:** `'setup' => 297` in billing.php, but HTML says "no setup fee"

**Recommendation:** Change to `'setup' => 0` to match HTML "no setup fee" claim. If Starter should have a setup, then update HTML to show "$249 setup".

---

#### Fix 5: Clarify annual billing copy (optional, for sales team)

**File:** `/c/Users/Usuario/Desktop/NetWebMedia/pricing.html`

**Current wording:** "Annual prepay locks 12 months · setup fee waived · save 15%."

**Clearer wording:** "Annual prepay locks 12 months at fixed rate · setup fee waived · 15% discount on recurring fee · billed once upfront."

**Why:** The word "waived" is correct but could trip up sales reps explaining the offer. Clarity helps.

---

## 8. Launch Readiness

**Overall:** 🔴 **NOT READY FOR MONDAY LAUNCH**

**Blockers:**
1. Setup fee mismatches will cause billing errors on all three paid tiers (Growth, Scale) and mislead customers on Starter.
2. Enterprise tier is unpublishable without backend plan seed.
3. Annual prepay checkout logic needs verification to ensure setup is handled correctly.

**Action Required (Priority):**
1. **TODAY:** Fix setup fees in billing.php (1h, low risk)
2. **TODAY:** Add cmo_enterprise seed (20 min, low risk)
3. **TODAY:** Test annual prepay checkout end-to-end (2h, medium risk — may reveal payment flow bugs)
4. **By EOD:** Smoke test full checkout flow on all four tiers (monthly + annual)

**Launch Date:** Recommend delaying to **Wednesday 2026-05-03** to allow:
- Setup fee alignment + deploy
- Annual prepay flow testing
- Smoke test on live
- Any unforeseen fixes

**If Must Launch Monday:**
- Disable annual toggle (change button to "Contact sales for annual pricing")
- Fix setup fees for monthly flow only
- Test monthly checkout only (Growth, Scale, Enterprise all route to contact form)
- This limits revenue per user but prevents billing errors

---

## Summary

| Category | Count | Status |
|---|---|---|
| **Setup fee mismatches** | 3 tiers | 🔴 CRITICAL |
| **Missing backend plans** | 1 (Enterprise) | 🔴 CRITICAL |
| **Annual math errors** | 0 | ✓ CORRECT |
| **Ordering issues** | 0 | ✓ CORRECT |
| **Currency issues** | 0 | ✓ CORRECT |
| **Industry overrides** | 0 | ✓ CONSISTENT |

**Final Verdict: Do not ship Monday without fixes 1–3 above. Fixes are low-risk and high-ROI.**

---

**Report signed:** Finance Controller, NetWebMedia  
**Date:** 2026-05-01  
**Next review:** Post-fix verification, before checkout cutover
