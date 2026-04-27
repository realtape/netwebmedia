"""
Add burned-in caption tracks + update logo to latest brand colors
across all 10 NWM reel compositions.

Run with: PYTHONUTF8=1 python add_captions.py
"""

import re, os, sys

COMP_DIR = os.path.join(os.path.dirname(__file__), "compositions")

# ---------------------------------------------------------------------------
# Logo color: update .wm-a from #00AEEF (cyan) → #7EB2C8 (steel-blue match)
#             update .wm-b from #FF6600 → #FF671F (exact brand orange)
# ---------------------------------------------------------------------------
LOGO_OLD_A = "#00AEEF"
LOGO_NEW_A = "#7EB2C8"
LOGO_OLD_B = "#FF6600"
LOGO_NEW_B = "#FF671F"

# ---------------------------------------------------------------------------
# Caption CSS block (injected once per file before </style>)
# ---------------------------------------------------------------------------
CAPTION_CSS = """
      /* ── CAPTIONS ── */
      .cap-wrap {
        position: absolute;
        bottom: 160px;
        left: 50%;
        transform: translateX(-50%);
        width: 960px;
        text-align: center;
        z-index: 500;
        opacity: 0;
      }
      .cap-text {
        display: inline-block;
        background: rgba(0,0,0,0.75);
        color: #fff;
        font-family: 'Poppins', sans-serif;
        font-size: 40px;
        font-weight: 600;
        line-height: 1.35;
        padding: 12px 28px;
        border-radius: 10px;
        white-space: pre-line;
        max-width: 920px;
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
      }
      .cap-text .cap-hi { color: #FF671F; font-weight: 800; }
"""

# ---------------------------------------------------------------------------
# Per-reel captions: list of (start_sec, duration_sec, text)
# Text can include <span class="cap-hi">...</span> for orange highlights.
# ---------------------------------------------------------------------------
REEL_CAPTIONS = {

"reel-01-ai-sdr": [
    (0.3,  2.5, "Can you replace a\n<span class='cap-hi'>$70K SDR</span> with $180/mo of AI?"),
    (2.8,  2.2, "Yes. Here's the live build."),
    (5.3,  4.0, "A human SDR costs <span class='cap-hi'>$71K/year</span>.\n8 meetings/month. Quits in 14 months."),
    (9.5,  4.0, "The AI SDR: <span class='cap-hi'>$180/month</span>.\n24/7. Never quits."),
    (14.0, 3.5, "Here's the three-step build."),
    (18.3, 5.0, "Step 1: Apollo finds\n500 ICP-matched leads."),
    (23.5, 5.0, "Step 2: Claude writes\na personalized email for each."),
    (29.0, 5.0, "Step 3: Smartlead sends.\nHubSpot tracks. You close."),
    (35.0, 5.0, "Nine minutes to build.\n<span class='cap-hi'>98% cheaper</span> than a human SDR."),
    (41.0, 4.0, "Same pipeline. Fraction of the cost."),
    (45.5, 5.0, "More meetings booked.\nLower cost per meeting."),
    (51.0, 5.0, "Pipeline in 30 days.\n<span class='cap-hi'>Zero new headcount.</span>"),
    (57.0, 5.0, "This is the future\nof outbound sales."),
    (63.3, 4.0, "Want the AI SDR playbook?"),
    (67.5, 5.0, "Chat with us\nat <span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-02-seo-dead": [
    (0.3,  2.0, "SEO is dead."),
    (2.3,  2.5, "Here's what replaced it."),
    (5.3,  4.0, "People ask AI, not Google.\n<span class='cap-hi'>600M ChatGPT users</span> every week."),
    (9.5,  4.5, "<span class='cap-hi'>40%</span> of Google searches\nend with zero clicks."),
    (14.3, 3.5, "2026: AEO beats SEO for SaaS."),
    (18.3, 5.5, "How to win AEO:\nthree things that matter now."),
    (24.0, 6.0, "One: structured Q&A content.\nWrite for extraction, not keywords."),
    (30.5, 6.0, "Two: high-authority citations.\nGet named where models already trust."),
    (37.0, 4.5, "Three: FAQ schema\nand conversational phrasing."),
    (42.3, 4.0, "Client result — 60 days."),
    (46.5, 5.0, "<span class='cap-hi'>14 buyer-intent citations</span>\nin ChatGPT."),
    (52.0, 5.5, "Started at zero.\n$340K pipeline from AI referrals."),
    (58.3, 3.5, "Want the AEO playbook?"),
    (62.0, 5.5, "We rebuild your content stack\nfor LLM citation."),
    (63.5, 4.0, "Chat with us at <span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-03-80-hours": [
    (0.3,  3.5, "We gave a $6M ARR founder\n<span class='cap-hi'>80 hours</span> a month back."),
    (4.3,  4.0, "One AI agent.\nHere's what we built."),
    (8.5,  4.5, "The client:\nVertical SaaS, drowning in ops."),
    (13.3, 4.0, "80+ hours a month on\nlead enrichment and CRM hygiene."),
    (18.3, 5.0, "The agent pipeline:\nHubSpot pull every 4 minutes."),
    (23.5, 5.0, "Clearbit enrichment.\n14-criteria ICP scoring."),
    (29.0, 5.0, "Auto-route to the right rep\nwith a written context brief."),
    (35.0, 5.0, "Before: <span class='cap-hi'>80 hours</span> manual ops/month.\n34-hour lead response time."),
    (41.0, 4.0, "After: fully automated.\nResponse time under 5 minutes."),
    (45.5, 5.0, "80 hours recovered.\nRevenue ops runs itself."),
    (51.0, 5.0, "Growth without chaos.\n<span class='cap-hi'>Zero new hires.</span>"),
    (57.0, 3.5, "Ready to automate your ops?"),
    (60.3, 4.0, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-04-roas-playbook": [
    (0.3,  2.5, "1.1× ROAS to <span class='cap-hi'>3.5×</span>."),
    (2.8,  2.5, "Same spend. Plus $190K monthly."),
    (5.3,  4.5, "DTC brand, $80K/mo on Meta.\nROAS of 1.1×. Losing money."),
    (10.0, 4.5, "Old agency said:\n\"Just scale the budget.\""),
    (15.0, 2.5, "We said: scale the thinking."),
    (18.3, 5.0, "Three levers."),
    (23.5, 5.0, "Lever one: kill product hooks.\n<span class='cap-hi'>Lead with customer pain.</span>"),
    (29.0, 5.0, "Lever two: kill lookalikes.\nBuild intent clusters."),
    (35.0, 5.5, "Lever three: your landing page\nis 70% of your ROAS."),
    (41.0, 3.5, "Rebuild the page."),
    (45.0, 5.0, "Day 47:\nROAS from 1.1× to <span class='cap-hi'>3.5×</span>."),
    (51.0, 5.0, "Same $80K spend.\n<span class='cap-hi'>+$190K</span> monthly net profit."),
    (57.0, 5.0, "This is the exact playbook.\nFive steps, reproducible."),
    (63.0, 5.0, "Every step documented.\nEvery lever explained."),
    (69.0, 5.0, "Want the full playbook?"),
    (76.3, 4.0, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-05-2m-teardown": [
    (0.3,  2.5, "Let's tear down a\n<span class='cap-hi'>$2M/month</span> Meta ad."),
    (2.8,  2.0, "Four layers decoded."),
    (5.3,  4.5, "Layer one: 1.3 seconds.\n<span class='cap-hi'>Pattern interrupt.</span>"),
    (10.0, 4.5, "Handwritten Post-it on a MacBook.\nNovelty gates attention."),
    (15.0, 3.0, "Static thumb: 0.3 seconds.\nPattern break: 1.3 seconds."),
    (18.3, 5.0, "Layer two: founder venting.\nNot pitching. No script energy."),
    (23.5, 5.0, "Authenticity signal.\nYour brain relaxes its guard."),
    (29.0, 5.0, "Layer three: three verifiable\n<span class='cap-hi'>proof beats.</span>"),
    (35.0, 5.0, "Verifiability equals credibility.\nUnverifiable claims equal ad blindness."),
    (41.0, 3.5, "Layer four: one CTA.\n\"Book a call.\""),
    (45.0, 5.0, "The formula:\nhook, problem, proof, ask."),
    (51.0, 5.0, "CVR: <span class='cap-hi'>4.2%</span>.\nIndustry average: 1.1%.\n3.8× above benchmark."),
    (57.0, 4.5, "This formula works at\nevery spend level."),
    (62.3, 4.0, "Comment AEO and I'll\nDM you the full teardown."),
    (67.0, 4.5, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-06-aeo-audit": [
    (0.3,  3.5, "Watch me build an\n<span class='cap-hi'>AEO audit agent</span>. Live."),
    (4.3,  4.5, "The AEO gap:\nwhen buyers ask ChatGPT your category —"),
    (9.0,  3.5, "— does your name appear?"),
    (13.0, 4.5, "Most B2B sites:\ninvisible to AI."),
    (18.3, 5.0, "Step one:\nquery the LLMs for your ICP terms."),
    (23.5, 5.0, "\"Best fractional CMO for SaaS B2B.\"\n\"Top AI marketing agency 2026.\""),
    (29.0, 5.0, "Extract named entities.\nWho gets cited? Who's invisible?"),
    (35.0, 5.0, "Step two: score your site\nfor <span class='cap-hi'>LLM readability</span>."),
    (41.0, 3.5, "FAQ schema. Q&A structure.\nEntity markup."),
    (45.0, 5.0, "Our client's score:\n<span class='cap-hi'>34 out of 100</span>. Needs a rebuild."),
    (51.0, 5.0, "We rebuilt the content stack.\n60 days later: 14 citations."),
    (57.0, 4.5, "$340K pipeline\nfrom AI referrals."),
    (62.3, 4.0, "Want your AEO audit done?"),
    (67.0, 4.5, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-07-agency-freelancer": [
    (0.3,  2.5, "Your agency is a\n<span class='cap-hi'>glorified freelancer.</span>"),
    (2.8,  2.0, "Here's why."),
    (5.3,  4.5, "The agency trap:\nyour retainer pays a mid-level exec"),
    (10.0, 4.0, "to forward briefs to juniors.\nNo skin in revenue outcomes."),
    (15.0, 3.0, "Strategy decks. Zero\nimplementation accountability."),
    (18.3, 5.0, "Fractional CMO is different.\nExec-level, direct access."),
    (23.5, 5.0, "Revenue-accountable.\nOwns pipeline, not campaigns."),
    (29.0, 5.0, "AI-native: builds systems,\ndoesn't just buy tools."),
    (35.0, 5.5, "No account manager layers.\nNo channel silos."),
    (41.0, 3.5, "Client reality check."),
    (45.0, 4.5, "<span class='cap-hi'>3× more pipeline</span> from\nthe same monthly budget."),
    (50.0, 4.5, "6 weeks to see the difference.\nSame spend. Better outcomes."),
    (55.3, 4.0, "Time to upgrade from agency\nto Fractional CMO?"),
    (60.0, 5.0, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-08-340k-pipeline": [
    (0.3,  3.5, "<span class='cap-hi'>$340K pipeline</span> from\nChatGPT citations."),
    (4.3,  3.5, "60 days. Zero paid ads."),
    (8.0,  3.5, "Here's how AEO beats SEO\nfor pipeline."),
    (12.0, 3.5, "Starting point:\nzero AI citations."),
    (16.3, 5.0, "Four moves in 60 days."),
    (21.5, 5.0, "Move one: rewrote 22 core pages\nas Q&A structures."),
    (27.0, 5.0, "Every H2 is a buyer question.\nEvery section: a direct answer."),
    (32.5, 5.0, "Move two: FAQ schema\non 8 high-intent pages."),
    (38.0, 5.0, "Move three: earned 6 citations\nfrom tier-1 sources."),
    (43.5, 4.5, "Day 60: <span class='cap-hi'>$340K</span> in pipeline\nfrom AI referrals."),
    (48.5, 4.5, "Named in ChatGPT\nfor 14 buyer-intent queries."),
    (53.5, 3.5, "Concentration beats expansion."),
    (57.3, 3.5, "Ready to get cited by AI?"),
    (61.0, 5.0, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-09-cac-62": [
    (0.3,  2.5, "We cut CAC <span class='cap-hi'>62%</span>\nin 11 weeks."),
    (2.8,  2.0, "Same headcount. Same spend."),
    (5.3,  4.5, "B2B SaaS, $12M ARR.\nCAC at <span class='cap-hi'>$3,400</span>."),
    (10.0, 4.0, "$40K/month on dead channels.\nTarget: sub-$1,500 CAC."),
    (15.0, 3.0, "Three levers."),
    (18.3, 5.0, "Lever one: kill $40K/mo\nin zero-signal spend."),
    (23.5, 5.0, "Not all channels are equal.\n<span class='cap-hi'>Kill the dead weight.</span>"),
    (29.0, 5.0, "Lever two: AI SDR plus AEO.\nPipeline from zero-cost channels."),
    (35.0, 5.5, "Lever three: rebuild the funnel.\n<span class='cap-hi'>Triple the close rate.</span>"),
    (41.5, 4.5, "Week 1 CAC: $3,400."),
    (46.5, 4.5, "Week 9 CAC: <span class='cap-hi'>$1,292</span>.\nMinus 62%."),
    (52.0, 5.0, "Same team. Same budget.\nDifferent levers."),
    (58.0, 4.5, "This is reproducible\nin any B2B SaaS company."),
    (63.5, 4.0, "Want to cut your CAC?"),
    (68.0, 5.5, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

"reel-10-apollo-teardown": [
    (0.3,  2.5, "Let's tear down\n<span class='cap-hi'>Apollo's</span> homepage funnel."),
    (2.8,  2.0, "Four layers. What works, what leaks."),
    (5.3,  4.5, "Layer one: above the fold.\n<span class='cap-hi'>What works.</span>"),
    (10.0, 4.0, "Outcome-first headline.\nFree tier. Social proof. Strong hook."),
    (15.0, 3.0, "Assessment: best practice.\nKeep it."),
    (18.3, 5.0, "Layer two: 10,000 logo wall.\n<span class='cap-hi'>Too much, too fast.</span>"),
    (23.5, 5.0, "Fix: swap 3 logos for\noutcome-specific case study blurbs."),
    (29.0, 5.0, "Layer three: feature-led,\nnot problem-led."),
    (35.0, 5.5, "Fix: reframe every feature as\n'problem — Apollo solves it by...'"),
    (41.0, 4.5, "Layer four: three CTAs\nat the bottom."),
    (46.0, 4.5, "One too many.\nKill 'see pricing.'"),
    (51.0, 5.0, "Push 'book a demo'\nas the <span class='cap-hi'>only</span> primary CTA."),
    (57.0, 4.5, "The verdict: great hero.\nBut logo wall, features, and CTAs leak pipeline."),
    (62.3, 4.0, "Want your homepage torn down?"),
    (67.0, 4.5, "Chat with us at\n<span class='cap-hi'>netwebmedia.com</span>"),
],

}

# ---------------------------------------------------------------------------
# Inject helpers
# ---------------------------------------------------------------------------

def build_caption_html(caps, reel_id):
    """Build HTML comment block + clip divs for all captions."""
    lines = ["\n      <!-- CAPTIONS -->"]
    for i, (start, dur, text) in enumerate(caps):
        cap_id = f"cap-{reel_id}-{i:02d}"
        lines.append(
            f'      <div id="{cap_id}" class="cap-wrap clip"'
            f' data-start="{start}" data-duration="{dur}" data-track-index="500">'
            f'\n        <div class="cap-text">{text}</div>'
            f'\n      </div>'
        )
    return "\n".join(lines)


def build_caption_gsap(caps, reel_id):
    """Build GSAP fade-in/out lines for all captions."""
    lines = ["\n      /* Caption animations */"]
    for i, (start, dur, _) in enumerate(caps):
        cap_id = f"cap-{reel_id}-{i:02d}"
        fade_in = min(0.25, dur * 0.2)
        fade_out = min(0.25, dur * 0.2)
        hold = dur - fade_in - fade_out
        lines.append(
            f'      tl.to("#{cap_id}", {{opacity:1, duration:{fade_in:.2f}}}, {start:.2f})'
            f'\n        .to("#{cap_id}", {{opacity:0, duration:{fade_out:.2f}}}, {start + fade_in + hold:.2f});'
        )
    return "\n".join(lines)


def process_file(reel_id):
    path = os.path.join(COMP_DIR, f"{reel_id}.html")
    if not os.path.exists(path):
        print(f"  SKIP {reel_id} — not found")
        return

    with open(path, encoding="utf-8") as f:
        html = f.read()

    original = html

    # 1. Update logo colors
    html = html.replace(LOGO_OLD_A, LOGO_NEW_A)
    html = html.replace(LOGO_OLD_B, LOGO_NEW_B)

    # 2. Skip if captions already injected
    if "cap-wrap" in html:
        print(f"  SKIP captions for {reel_id} — already present")
        # Still write logo update
        if html != original:
            with open(path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  UPDATED logo colors in {reel_id}")
        return

    # 3. Inject caption CSS before </style>
    html = html.replace("    </style>", CAPTION_CSS + "    </style>", 1)

    # 4. Inject caption HTML before closing </div> of root
    caps = REEL_CAPTIONS.get(reel_id, [])
    if not caps:
        print(f"  WARNING: no captions defined for {reel_id}")
        return

    cap_html = build_caption_html(caps, reel_id)
    # Insert before the last </div> before </body>
    html = html.replace("\n    </div>\n    <script>", f"\n{cap_html}\n\n    </div>\n    <script>", 1)

    # 5. Inject caption GSAP before window.__timelines assignment
    cap_gsap = build_caption_gsap(caps, reel_id)
    html = html.replace(
        "      window.__timelines",
        cap_gsap + "\n\n      window.__timelines",
        1
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  DONE {reel_id} — {len(caps)} captions, logo updated")


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
print("Adding captions + updating logos...")
for reel_id in REEL_CAPTIONS.keys():
    process_file(reel_id)

# Also update reel-02 logo colors (captions already handled above but logo needs updating)
reel02_path = os.path.join(COMP_DIR, "reel-02-seo-dead.html")
with open(reel02_path, encoding="utf-8") as f:
    html = f.read()
changed = html.replace(LOGO_OLD_A, LOGO_NEW_A).replace(LOGO_OLD_B, LOGO_NEW_B)
if changed != html or "cap-wrap" not in changed:
    # Also inject captions in reel-02 if missing
    if "cap-wrap" not in changed:
        changed2 = changed
        changed2 = changed2.replace("    </style>", CAPTION_CSS + "    </style>", 1)
        caps = REEL_CAPTIONS["reel-02-seo-dead"]
        cap_html = build_caption_html(caps, "reel-02-seo-dead")
        changed2 = changed2.replace("\n    </div>\n    <script>", f"\n{cap_html}\n\n    </div>\n    <script>", 1)
        cap_gsap = build_caption_gsap(caps, "reel-02-seo-dead")
        changed2 = changed2.replace("      window.__timelines", cap_gsap + "\n\n      window.__timelines", 1)
        with open(reel02_path, "w", encoding="utf-8") as f:
            f.write(changed2)
        print(f"  DONE reel-02-seo-dead — {len(caps)} captions, logo updated")
    else:
        with open(reel02_path, "w", encoding="utf-8") as f:
            f.write(changed)
        print(f"  UPDATED logo colors in reel-02-seo-dead")

print("\nAll done. Run: npx hyperframes lint && npx hyperframes render")
