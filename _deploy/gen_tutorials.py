#!/usr/bin/env python3
"""Generate all remaining tutorial HTML pages from a shared template.

Each tutorial: hero + TOC + 6-10 content sections + FAQ + CTA.
All pages use ../css/styles.css + _tutorial.css for consistent look.
"""
import os, textwrap

OUT = os.path.join(os.path.dirname(__file__), '..', 'tutorials')
os.makedirs(OUT, exist_ok=True)

BASE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | NetWebMedia</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://netwebmedia.com/tutorials/{slug}.html">
<link rel="icon" type="image/svg+xml" href="../assets/nwm-logo.svg">
<link rel="stylesheet" href="../css/styles.css">
<link rel="stylesheet" href="_tutorial.css">
</head>
<body>

<nav class="navbar" id="navbar">
  <div class="container"><div class="navbar-inner">
    <a href="../index.html" class="nav-logo"><img src="../assets/nwm-logo-horizontal.svg" alt="NetWebMedia" style="height:38px"></a>
    <div class="nav-links">
      <a href="../pricing.html">Pricing</a>
      <a href="../services.html">Services</a>
      <a href="/tutorials.html" style="color:#8b5cf6">Tutorials</a>
      <a href="../blog.html">Blog</a>
      <a href="../contact.html">Contact</a>
    </div>
    <div class="nav-ctas"><a href="../contact.html" class="btn-nav-solid">Get a Free Audit</a></div>
  </div></div>
</nav>

<main class="tut-wrap">

<div class="tut-breadcrumb">
  <a href="../index.html">Home</a> / <a href="/tutorials.html">Tutorials</a> / <strong>{nav}</strong>
</div>

<h1>{h1}</h1>
<p class="tut-lede">{lede}</p>

<div class="tut-meta">
  <span>⏱ {minutes} min read</span>
  <span>📖 {section_count} sections</span>
  <span>🆕 Updated Apr 2026</span>
</div>

<div class="tut-toc">
  <h4>What's inside</h4>
  <ol>{toc}</ol>
</div>

{sections}

<div class="next-cta">
  <h3>{cta_title}</h3>
  <p>{cta_body}</p>
  <a class="btn-next" href="{cta_href}">{cta_btn}</a>
  <a class="btn-ghost" href="../contact.html">Talk to us</a>
</div>

<h3>Common questions</h3>
<div class="faq">
{faqs}
</div>

</main>

<footer>
  <div class="container" style="padding:30px 20px">
    <p style="color:#8b99b2;font-size:13px;margin:0">© 2026 NetWebMedia. <a href="/tutorials.html" style="color:#8b5cf6">← Back to tutorials</a></p>
  </div>
</footer>
</body>
</html>
"""

def render(**kw):
    toc = ''.join(f'<li><a href="#{s[0]}">{s[1]}</a></li>' for s in kw['section_list'])
    sections = []
    for sid, sname, body in kw['section_list']:
        sections.append(f'<h2 id="{sid}">{sname}</h2>\n{body}')
    kw['toc'] = toc
    kw['sections'] = '\n\n'.join(sections)
    kw['section_count'] = len(kw['section_list'])
    kw['faqs'] = '\n'.join(
        f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in kw['faq_list']
    )
    html = BASE.format(**kw)
    path = os.path.join(OUT, f"{kw['slug']}.html")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'wrote {path}')

# -----------------------------------------------------------------------------
render(
    slug='ai-chat-agents',
    title='AI Chat Agents Tutorial — 24/7 Lead Capture',
    desc='Launch an AI chatbot trained on your site. FAQ auto-answers, lead capture, smart human handoff.',
    nav='AI Chat Agents',
    h1='AI Chat Agents — 24/7 lead capture on autopilot',
    lede='Deploy an AI chatbot on your site that answers FAQs, captures leads, books meetings, and hands off to humans when it should. Trained on your own content in under 30 minutes.',
    minutes=8,
    section_list=[
        ('what','1. What AI Chat Agents do',
         '<p>A chat widget bottom-right on your site. Visitors ask questions; the AI answers from your own content (pages, PDFs, help docs). When intent is high — pricing, booking, support — it collects contact info and routes the conversation to your team.</p>'
         '<div class="feat-sm">'
         '<div class="c"><b>FAQ auto-answer</b><p>Handles 60–80% of common questions instantly.</p></div>'
         '<div class="c"><b>Lead capture</b><p>Ask for email/phone when intent spikes. Lands in CRM.</p></div>'
         '<div class="c"><b>Booking</b><p>Hooks into Calendly or Google Calendar.</p></div>'
         '<div class="c"><b>Human handoff</b><p>Live-takeover or scheduled follow-up.</p></div>'
         '</div>'),
        ('setup','2. Setup — 30 minutes start to finish',
         '<div class="step"><div class="num">1</div><div><h4>Point it at your content</h4><p>Drop in your site URL, upload PDFs, or paste text. The agent indexes in ~2 minutes.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Pick a persona</h4><p>Friendly assistant, expert consultant, customer-service rep. Sets the tone + opening line.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Define handoff rules</h4><p>"When visitor mentions pricing over $5k, collect email + route to sales@."</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Embed the widget</h4><p>Copy a one-line script tag; paste before <code>&lt;/body&gt;</code>. Done.</p></div></div>'),
        ('train','3. Training &amp; guardrails',
         '<p>The agent will only answer from content you provide. If it doesn\'t know, it says so and offers human handoff. You can add:</p>'
         '<ul><li><strong>Must-answer</strong> Q&amp;A pairs (pricing, hours, policies) that get verbatim replies.</li>'
         '<li><strong>Blocked topics</strong> — agent refuses to speculate (legal advice, medical, competitor disparagement).</li>'
         '<li><strong>Escalation phrases</strong> — "refund", "cancel", "speak to manager" auto-trigger a human alert.</li></ul>'
         '<div class="callout warn"><strong>⚠️ Never let it hallucinate prices</strong><p>Always hard-code current pricing in the must-answer list. LLMs will invent numbers otherwise.</p></div>'),
        ('integrate','4. Integrations',
         '<ul>'
         '<li><strong>NWM CRM</strong> — every captured lead lands as a contact with full chat transcript attached.</li>'
         '<li><strong>HubSpot / Pipedrive / Salesforce</strong> — via webhooks or Zapier.</li>'
         '<li><strong>Calendar</strong> — Calendly, Google Cal, Microsoft Bookings, Cal.com.</li>'
         '<li><strong>Slack / Email</strong> — push every high-intent conversation to a channel or inbox in real time.</li>'
         '</ul>'),
        ('analytics','5. Analytics &amp; tuning',
         '<p>Weekly dashboard surfaces:</p>'
         '<ul><li>Conversations handled · resolved vs. escalated</li>'
         '<li>Top unanswered questions (add these to your FAQ)</li>'
         '<li>Leads captured, meetings booked, revenue attributed</li>'
         '<li>Drop-off points in long chats (signals a weak answer)</li></ul>'
         '<p>Review every Monday. Add missing content; the agent gets smarter each week.</p>'),
        ('pricing','6. Pricing',
         '<p>$149/mo up to 1,000 conversations. $349/mo up to 5,000. Enterprise: custom. Every plan includes: unlimited pages indexed, CRM integration, weekly tuning, branding removal.</p>'),
    ],
    cta_title='Get your AI agent live this week',
    cta_body='Free 14-day trial. White-glove setup included — we do the hard part.',
    cta_href='../contact.html',
    cta_btn='Start free trial →',
    faq_list=[
        ('How does it handle off-topic questions?','It politely declines and offers to connect the visitor with a human. You can customize the decline message in Settings.'),
        ('What about GDPR / privacy?','Transcripts are stored in EU data centers for EU visitors. You choose how long to retain (default 90 days). "Delete all my data" is one click.'),
        ('Can it work in Spanish?','Yes — Spanish, Portuguese, French, German out of the box. Auto-detects from browser language.'),
        ('Will it replace my sales team?','No — it makes them 5x more productive. It handles the first touch; humans close.'),
    ],
)

render(
    slug='ai-automate',
    title='AI Automate Tutorial — Agentic Workflows',
    desc='Build agentic workflows with n8n + Claude: lead scoring, invoice chasing, content repurposing, no-code.',
    nav='AI Automate',
    h1='AI Automate — workflows that run your business',
    lede='Every repetitive task in your business — scoring leads, chasing invoices, repurposing content, onboarding customers — can run itself. This is how we build workflows that replace hours of manual work per week.',
    minutes=14,
    section_list=[
        ('what','1. What AI Automate actually is',
         '<p>It\'s n8n (an open-source workflow platform) wired up with Claude, OpenAI, your CRM, your email, your billing system, and whatever else you use. We design the workflow, deploy it, monitor it, and tune it monthly.</p>'
         '<p><strong>The "agentic" part:</strong> instead of rigid if-this-then-that rules, every step can ask an LLM to make a judgment call — "does this look like a real lead?", "is this invoice dispute-worthy?", "rewrite this email for a cold prospect".</p>'),
        ('usecases','2. Highest-ROI use cases',
         '<div class="feat-sm">'
         '<div class="c"><b>Lead scoring &amp; enrichment</b><p>Every inbound lead → scraped from LinkedIn + Clearbit + Apollo → scored 0-100 → routed to the right rep.</p></div>'
         '<div class="c"><b>Invoice chasing</b><p>Day 1 reminder, day 7 polite nudge, day 14 firm request, day 30 escalation to collections. Pauses automatically on payment.</p></div>'
         '<div class="c"><b>Content repurposing</b><p>One blog post → 5 tweets + 1 LinkedIn post + 30s video script + email newsletter. Queued to publish over 2 weeks.</p></div>'
         '<div class="c"><b>Customer onboarding</b><p>Signup → welcome email → calendar invite → training doc → 7-day check-in → renewal reminder.</p></div>'
         '</div>'),
        ('build','3. How a workflow gets built',
         '<div class="step"><div class="num">1</div><div><h4>Map the current process</h4><p>30-min call. You walk us through the manual version. We document every step.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Identify judgment points</h4><p>Which decisions need an LLM ("is this lead worth pursuing?") vs. rules ("if contract_value &gt; $10k, loop in legal").</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Draft the flow diagram</h4><p>We send you a visual flowchart. You approve or request changes.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Build + test</h4><p>We implement in n8n, test with 10+ real scenarios, share a sandbox URL.</p></div></div>'
         '<div class="step"><div class="num">5</div><div><h4>Deploy + monitor</h4><p>Go live. Dashboard shows every execution. Errors alert us immediately. You see weekly report.</p></div></div>'),
        ('stack','4. What we connect it to',
         '<ul>'
         '<li><strong>CRMs</strong> — NWM CRM, HubSpot, Salesforce, Pipedrive, Zoho, Close</li>'
         '<li><strong>Email</strong> — Gmail, Outlook, SMTP, SendGrid, Mailgun, Postmark</li>'
         '<li><strong>Billing</strong> — Stripe, QuickBooks, Xero, FreshBooks</li>'
         '<li><strong>Data</strong> — Google Sheets, Airtable, PostgreSQL, MySQL, Snowflake</li>'
         '<li><strong>Communication</strong> — Slack, MS Teams, Discord, WhatsApp, SMS (Twilio)</li>'
         '<li><strong>AI</strong> — Claude (primary), GPT-4, Gemini, custom fine-tuned models</li>'
         '</ul>'),
        ('cost','5. Cost &amp; ROI',
         '<p>Setup fee: $2,500–$7,500 per workflow (depends on complexity). Monthly: $200–$600 for monitoring + tuning + LLM API usage.</p>'
         '<p>Typical payback: 1–3 months. A lead-scoring workflow that saves your SDR team 8 hours/week pays for itself by month 2.</p>'
         '<div class="callout tip"><strong>💡 We guarantee payback</strong><p>If a workflow hasn\'t saved more than it cost by month 6, we rebuild it free or refund the setup fee.</p></div>'),
        ('governance','6. Governance &amp; safety',
         '<p>Every workflow has:</p>'
         '<ul>'
         '<li><strong>Human-in-the-loop gates</strong> on anything involving money, legal, or customer messaging above a threshold</li>'
         '<li><strong>Full audit log</strong> — every step, every LLM call, every action, every input + output</li>'
         '<li><strong>Kill switch</strong> — one click to pause a runaway workflow</li>'
         '<li><strong>Monthly review</strong> — we surface drift, errors, and tuning opportunities</li>'
         '</ul>'),
        ('startshort','7. Start small',
         '<p>Don\'t boil the ocean. Pick <em>one</em> workflow that annoys you every week. Automate it. Measure the savings. Then pick the next one.</p>'
         '<p>Our most successful customers start with <strong>lead scoring</strong> or <strong>invoice chasing</strong> — easy wins with visible ROI in &lt; 30 days.</p>'),
    ],
    cta_title='Tell us the task you\'d pay to never do again',
    cta_body='30-min call. We\'ll tell you honestly if it\'s a good automation candidate and what it would cost.',
    cta_href='../contact.html',
    cta_btn='Book an automation call →',
    faq_list=[
        ('Do I need to know n8n or code?','No. We build, deploy, and monitor. You see a dashboard; you approve changes; you don\'t touch the wiring.'),
        ('What if I want to bring it in-house eventually?','We document every workflow and can hand it over at any time. No lock-in.'),
        ('How do you prevent AI mistakes?','Every money/legal/customer-facing action has a human approval gate by default. LLMs suggest; humans confirm on anything high-stakes.'),
        ('How fast to launch a first workflow?','2–3 weeks from kickoff for a standard workflow. Complex multi-system ones: 4–6 weeks.'),
    ],
)

render(
    slug='video-factory',
    title='Short-Form Video Factory — 30 videos/month',
    desc='How we produce 30 TikTok/Reels/Shorts per month: brief, AI-assisted editing, voiceovers, captions, delivery.',
    nav='Video Factory',
    h1='Short-Form Video Factory — 30 videos/month',
    lede='Consistent short-form video is the single highest-ROI channel for SMB awareness right now. Here\'s how we produce 30/month at a fraction of agency rates — AI-assisted, human-directed.',
    minutes=9,
    section_list=[
        ('what','1. What you get',
         '<ul>'
         '<li><strong>30 short-form videos per month</strong> (15–60s), formatted for TikTok, Instagram Reels, YouTube Shorts, LinkedIn</li>'
         '<li>AI-generated voiceovers (or your own voice, cloned with permission)</li>'
         '<li>Burned-in captions in English + Spanish</li>'
         '<li>Branded intros, outros, lower-thirds</li>'
         '<li>Monthly strategy call + content calendar</li>'
         '</ul>'),
        ('brief','2. The monthly brief',
         '<div class="step"><div class="num">1</div><div><h4>30-min strategy call on the 25th</h4><p>We cover: what\'s working, what\'s not, upcoming launches, seasonal angles, trending sounds/formats in your niche.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>We send a content calendar</h4><p>30 video topics mapped to posting dates, hook lines, visual direction, and call-to-action.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>You approve or edit</h4><p>Turnaround: 48 hours. After approval, production starts.</p></div></div>'),
        ('production','3. Production pipeline',
         '<p>Each video goes through:</p>'
         '<ol>'
         '<li><strong>Script</strong> — AI draft, human edit. ~3 min per video.</li>'
         '<li><strong>Footage sourcing</strong> — stock library, your existing footage, AI-generated B-roll (Runway/Sora).</li>'
         '<li><strong>Voiceover</strong> — ElevenLabs + your voice clone, or a selection of licensed voices.</li>'
         '<li><strong>Edit</strong> — cuts, captions, music, transitions. Human editor, ~20 min per video.</li>'
         '<li><strong>Review</strong> — internal QA pass for brand, accuracy, legal.</li>'
         '<li><strong>Delivery</strong> — you get a ZIP with all 30 videos + a posting schedule.</li>'
         '</ol>'),
        ('formats','4. Formats that work',
         '<div class="feat-sm">'
         '<div class="c"><b>Hook + teach + CTA</b><p>12s format. High retention, high save rate.</p></div>'
         '<div class="c"><b>Before / After</b><p>Screen capture of your product solving a problem. Great for SaaS.</p></div>'
         '<div class="c"><b>Customer testimonial</b><p>30s AI-edited from a longer recording. Social proof.</p></div>'
         '<div class="c"><b>Founder POV</b><p>Selfie-style, you speaking to camera about a spicy opinion. Builds brand.</p></div>'
         '</div>'),
        ('posting','5. Posting &amp; distribution',
         '<p>We can post for you (included on Pro plan) or deliver files for your team. Posting schedule:</p>'
         '<ul><li>Weekdays 9am + 6pm local time (tuned per account based on audience data)</li>'
         '<li>Same video cross-posted to TikTok, Reels, Shorts, LinkedIn (with caption adaptation per platform)</li>'
         '<li>Best-performing videos boosted with $50–$150 paid spend (optional)</li></ul>'),
        ('reporting','6. Reporting',
         '<p>Weekly Monday report:</p>'
         '<ul><li>Views, reach, engagement per video</li>'
         '<li>Top 3 performers last week → we double down on those formats next week</li>'
         '<li>Bottom 3 → we learn from what didn\'t land</li>'
         '<li>Follower growth, profile visits, outbound link clicks</li></ul>'),
        ('pricing','7. Pricing',
         '<ul>'
         '<li><strong>Standard</strong> — 30 videos/mo, delivered monthly: $2,490/mo</li>'
         '<li><strong>Pro</strong> — 30 videos/mo + we post + paid boosting: $3,990/mo</li>'
         '<li><strong>Enterprise</strong> — 60+ videos/mo + dedicated editor: custom</li>'
         '</ul>'),
    ],
    cta_title='Start your video engine',
    cta_body='First month 50% off during launch. No long-term contract; month-to-month.',
    cta_href='../contact.html',
    cta_btn='Get started →',
    faq_list=[
        ('Do I need to appear on camera?','No. Most clients never appear. We use screen recordings, stock footage, AI-generated visuals, and voiceovers.'),
        ('What if I hate a video?','Unlimited revisions within 7 days of delivery. If a video is unfixable, we reshoot it free.'),
        ('Can I see examples before committing?','Yes — we\'ll show you 3 full videos we\'ve made for businesses in your industry during the sales call.'),
        ('Who owns the footage?','You do. Full commercial rights. We just deliver.'),
    ],
)

render(
    slug='ai-seo',
    title='AI SEO & Content Tutorial — AEO-first strategy',
    desc='How we do AI SEO: AEO-first keyword strategy, AI drafts + human QA, citations in Google + LLMs.',
    nav='AI SEO',
    h1='AI SEO &amp; Content — rank in Google and get cited by ChatGPT',
    lede='The SEO game changed in 2025. Ranking #1 in Google is no longer enough — you also need to be the source LLMs (ChatGPT, Perplexity, Claude, Gemini) cite when your customers ask them questions. This is our playbook.',
    minutes=11,
    section_list=[
        ('aeo','1. Why AEO changes everything',
         '<p>AEO = Answer Engine Optimization. When a prospect asks ChatGPT "which fractional CMO services work for SaaS under $10M ARR?", the LLM cites 3-5 URLs. Those citations are the new #1 ranking.</p>'
         '<p>AEO ≠ SEO. AEO rewards:</p>'
         '<ul><li><strong>Clear question-answer structure</strong> — LLMs can extract "the answer"</li>'
         '<li><strong>Specificity &amp; numbers</strong> — "saved $47k in Q2" beats "saved a lot"</li>'
         '<li><strong>Recency</strong> — LLMs heavily discount older content</li>'
         '<li><strong>Citations of your own</strong> — authority signals (studies, case data, named experts)</li></ul>'),
        ('strategy','2. Our 3-pillar strategy',
         '<div class="feat-sm">'
         '<div class="c"><b>Pillar A: Topic clusters</b><p>5–8 pillar pages (each 3000+ words) + 10–20 supporting articles per cluster.</p></div>'
         '<div class="c"><b>Pillar B: Question pages</b><p>Every question your sales team hears answered on a dedicated URL. AEO gold.</p></div>'
         '<div class="c"><b>Pillar C: Data &amp; case studies</b><p>Original data LLMs can\'t find elsewhere. Becomes the canonical cite.</p></div>'
         '</div>'),
        ('process','3. The content process',
         '<div class="step"><div class="num">1</div><div><h4>Month 1: strategy sprint</h4><p>Keyword research, competitor gap analysis, topic cluster design, editorial calendar for 90 days.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Weekly production</h4><p>2 pillar articles + 4 supporting articles per week. AI drafts, human SME review, editor polish.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Internal linking pass</h4><p>Every new article links to 3–5 existing ones. Builds topical authority fast.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Technical audit</h4><p>Quarterly deep audit: site speed, schema, sitemaps, canonical issues, Core Web Vitals.</p></div></div>'),
        ('tools','4. Tools we use',
         '<ul>'
         '<li><strong>Ahrefs / Semrush</strong> — keyword research, backlink tracking</li>'
         '<li><strong>NWM CMS AEO planner</strong> — question-intent keyword generation</li>'
         '<li><strong>Claude + GPT-4</strong> — drafts and rewrites</li>'
         '<li><strong>Human editors</strong> — 2 in-house, each with 5+ years B2B experience</li>'
         '<li><strong>Perplexity / ChatGPT / Claude.ai</strong> — weekly checks: are we being cited?</li>'
         '</ul>'),
        ('measure','5. How we measure',
         '<p>Monthly scorecard covers:</p>'
         '<ul>'
         '<li><strong>Organic traffic</strong> — sessions, new users, engaged sessions (GA4)</li>'
         '<li><strong>Rankings</strong> — top-10 keywords, movement ± positions</li>'
         '<li><strong>LLM citations</strong> — we query ChatGPT/Perplexity/Claude with 30+ target questions weekly, track which URLs get cited</li>'
         '<li><strong>Pipeline attribution</strong> — % of SQLs that touched an organic page</li>'
         '</ul>'),
        ('pricing','6. Pricing',
         '<ul>'
         '<li><strong>Starter</strong> — 4 articles/mo, monthly reporting: $1,490/mo</li>'
         '<li><strong>Growth</strong> — 12 articles/mo, weekly reporting, backlink outreach: $3,490/mo</li>'
         '<li><strong>Scale</strong> — 24 articles/mo, dedicated writer + strategist, quarterly audit: $6,990/mo</li>'
         '</ul>'),
        ('timeline','7. Expected timeline',
         '<ul>'
         '<li><strong>Month 1–3</strong> — foundation. Some new rankings start appearing. Traffic flat-to-slightly-up.</li>'
         '<li><strong>Month 4–6</strong> — compound growth. Traffic 2–4×. First LLM citations appear.</li>'
         '<li><strong>Month 7–12</strong> — category authority. Traffic 5–10×. Regular LLM citations. Direct brand searches start growing.</li>'
         '</ul>'
         '<div class="callout warn"><strong>⚠️ SEO is slow</strong><p>If a vendor promises results in 30 days, they\'re either lying or gaming it with paid links that\'ll get you penalized. Real SEO takes 6 months minimum.</p></div>'),
    ],
    cta_title='See if we\'re the right fit',
    cta_body='Free 60-min content audit. We\'ll tell you what you\'re missing and whether SEO is even the right channel for you.',
    cta_href='../contact.html',
    cta_btn='Request free audit →',
    faq_list=[
        ('How much of the content is AI vs. human?','Initial draft is AI. Every word gets human-edited by an SME. What ships is ~50/50 AI/human.'),
        ('Do you guarantee rankings?','No — and run from anyone who does. We guarantee process + quality. Rankings are a result of consistent execution.'),
        ('Can you do it in Spanish?','Yes. 40% of our SEO work is bilingual EN/ES. Native Spanish editors on staff.'),
        ('What about link building?','Included on Growth+. We do digital PR (HARO, podcast outreach, data studies) — never buy links.'),
    ],
)

render(
    slug='paid-ads',
    title='Paid Ads Management Tutorial — Meta, Google, TikTok',
    desc='How we manage paid ads: creative rotation, budget allocation, attribution, weekly reviews.',
    nav='Paid Ads',
    h1='Paid Ads Management — Meta · Google · TikTok',
    lede='Paid ads should be a growth lever, not a money pit. Here\'s how we run accounts: AI-assisted creative, disciplined budget, honest attribution, weekly reviews.',
    minutes=10,
    section_list=[
        ('channels','1. Which channel when',
         '<div class="feat-sm">'
         '<div class="c"><b>Google Search</b><p>High-intent. Best for established demand (people already searching for your solution).</p></div>'
         '<div class="c"><b>Meta (FB/IG)</b><p>Broad targeting + lookalikes. Best for warm retargeting + creative-led prospecting.</p></div>'
         '<div class="c"><b>TikTok Ads</b><p>Cheap reach + creative-native audiences. Best for awareness + under-35 demos.</p></div>'
         '<div class="c"><b>LinkedIn</b><p>Expensive but precise. Best for B2B deals &gt; $10k ACV.</p></div>'
         '</div>'),
        ('setup','2. Account setup (week 1)',
         '<div class="step"><div class="num">1</div><div><h4>Audit existing accounts</h4><p>Conversion tracking, audience overlap, wasted spend, policy violations.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Fix conversion tracking</h4><p>GA4 + Meta Pixel + Google Conversions + enhanced conversions. Without this, nothing else matters.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Map the funnel</h4><p>Awareness → Consideration → Conversion → Retention. Budget split per stage.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Creative audit</h4><p>Identify what\'s worked, what hasn\'t, and gaps in format (UGC? demo? testimonial?).</p></div></div>'),
        ('creative','3. Creative — the #1 lever',
         '<p>90% of paid performance comes from creative, not targeting. Our creative pipeline:</p>'
         '<ol>'
         '<li><strong>Weekly brief</strong> — 5 new creative concepts, varied by hook/format/angle</li>'
         '<li><strong>AI-assisted production</strong> — stock + AI video + human edit</li>'
         '<li><strong>Launch in test group</strong> — $50/day per ad for 3 days</li>'
         '<li><strong>Scale winners</strong> — ads that beat account CPA by 30%+ get scaled</li>'
         '<li><strong>Kill losers fast</strong> — ads at 1.5× account CPA are paused day 4</li>'
         '</ol>'),
        ('budget','4. Budget allocation framework',
         '<ul>'
         '<li><strong>70%</strong> — proven winners (campaigns that converted profitably last 30 days)</li>'
         '<li><strong>20%</strong> — scale tests (up-budget on recent winners to find ceiling)</li>'
         '<li><strong>10%</strong> — innovation (new channels, new formats, new creative angles)</li>'
         '</ul>'),
        ('reviews','5. Weekly review cadence',
         '<p>Every Monday 10am (your timezone) — 30 min call. Agenda:</p>'
         '<ul>'
         '<li>Week at a glance: spend, CAC, ROAS, pipeline impact</li>'
         '<li>Top 3 winners + why</li>'
         '<li>Top 3 losers + what we\'re replacing</li>'
         '<li>Next week\'s creative brief + budget changes</li>'
         '<li>Any red flags (audience fatigue, compliance, platform issues)</li>'
         '</ul>'),
        ('attribution','6. Attribution (the honest version)',
         '<p>Platform-reported numbers (Meta says X, Google says Y) always over-claim. We triangulate:</p>'
         '<ul>'
         '<li><strong>GA4 multi-touch</strong> — baseline truth</li>'
         '<li><strong>Post-purchase survey</strong> — "where did you hear about us?" — 1-line addition to checkout</li>'
         '<li><strong>Geo-lift tests</strong> quarterly — pause a channel in one region, measure delta</li>'
         '<li><strong>MMM (media mix modeling)</strong> on accounts &gt; $50k/mo spend</li>'
         '</ul>'),
        ('pricing','7. Pricing',
         '<ul>'
         '<li><strong>Essentials</strong> — 1 channel, up to $10k/mo ad spend: $1,490/mo management fee</li>'
         '<li><strong>Multi-channel</strong> — 2–3 channels, up to $50k/mo spend: $2,990/mo</li>'
         '<li><strong>Scale</strong> — 4+ channels, $50k+/mo spend: 10% of ad spend</li>'
         '</ul>'),
    ],
    cta_title='Free paid-ads audit',
    cta_body='Send us your ad accounts (read-only). 48h later we\'ll send a 10-page audit with exactly where budget is being wasted and the 3 highest-leverage fixes.',
    cta_href='../contact.html',
    cta_btn='Request audit →',
    faq_list=[
        ('Minimum ad spend to work with you?','$5,000/mo is our floor. Below that, management fees eat the results. Under $5k, try DIY with our <a href="ai-automate.html">automation workflows</a> instead.'),
        ('Who owns the ad accounts?','You do, always. We get access as a user, never a transfer.'),
        ('Do you do ecommerce / DTC?','Yes — especially Meta + TikTok + Google Shopping.'),
        ('How fast do we see results?','Week 2–3 you\'ll see creative winners emerge. Month 2 is typically when ROAS stabilizes and scaling begins.'),
    ],
)

render(
    slug='social-media',
    title='Social Media Management Tutorial — 4 platforms, 20+ posts/month',
    desc='End-to-end social media management: content, posting, engagement, reporting. 4 platforms, 20+ posts/month.',
    nav='Social Media',
    h1='Social Media Management — 4 platforms, 20+ posts/month',
    lede='Organic social isn\'t dead — it\'s just hard. Here\'s how we run accounts that actually move the needle: strategy → content → engagement → reporting, every week.',
    minutes=8,
    section_list=[
        ('what','1. What\'s included',
         '<ul>'
         '<li><strong>4 platforms</strong> — pick from LinkedIn, Instagram, TikTok, X (Twitter), Facebook, YouTube</li>'
         '<li><strong>20+ posts/month</strong> per platform (80+ total)</li>'
         '<li><strong>Daily engagement</strong> — replies, DMs, comment hunting</li>'
         '<li><strong>Monthly content calendar</strong> + strategy call</li>'
         '<li><strong>Weekly reporting</strong></li>'
         '</ul>'),
        ('strategy','2. Per-platform strategy',
         '<div class="feat-sm">'
         '<div class="c"><b>LinkedIn</b><p>Thought leadership, founder POV, case studies. 3 posts/week. Target: inbound leads.</p></div>'
         '<div class="c"><b>Instagram</b><p>Brand aesthetic, behind-the-scenes, reels. 4–5/week. Target: trust + awareness.</p></div>'
         '<div class="c"><b>TikTok</b><p>Educational, entertaining, trend-hijacking. 5/week. Target: top-of-funnel discovery.</p></div>'
         '<div class="c"><b>X / Twitter</b><p>Opinion, news-jacking, community. 1-3/day. Target: brand voice + founder presence.</p></div>'
         '</div>'),
        ('production','3. Content production',
         '<div class="step"><div class="num">1</div><div><h4>Monthly strategy call</h4><p>30 min. Review last month\'s metrics, upcoming launches, hot topics in your industry.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Content calendar</h4><p>Delivered within 5 days. Covers topics, formats, posting dates, hooks.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Design + copy</h4><p>Brand-matched graphics (Figma), AI-assisted copy, you approve in a shared review doc.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Queue &amp; post</h4><p>Scheduled in Later or Buffer. Posts go out at platform-optimal times.</p></div></div>'),
        ('engagement','4. Engagement (the half most agencies skip)',
         '<p>Posting without engaging is shouting into a void. Daily engagement:</p>'
         '<ul>'
         '<li>Reply to every DM + comment within 4 business hours</li>'
         '<li>15 min/day commenting on 10–15 target accounts (customers, prospects, peers)</li>'
         '<li>Share every earned mention from customers/press</li>'
         '<li>Like / save / react to relevant content in your feed</li>'
         '</ul>'
         '<div class="callout tip"><strong>💡 Engagement compounds</strong><p>Accounts that engage daily grow 3–5× faster than accounts that only post. The algorithm rewards reciprocity.</p></div>'),
        ('reporting','5. Reporting',
         '<p>Weekly Friday report:</p>'
         '<ul>'
         '<li>Per-platform: posts, reach, engagement, followers ±</li>'
         '<li>Top 3 posts of the week</li>'
         '<li>Biggest engagement moments (viral replies, DMs from targets, press pickups)</li>'
         '<li>Next week\'s calendar at a glance</li>'
         '</ul>'
         '<p>Monthly deep-dive: 20-page PDF with trend analysis, competitor benchmarks, and next-month pivot recommendations.</p>'),
        ('pricing','6. Pricing',
         '<ul>'
         '<li><strong>Essentials</strong> — 2 platforms, 40 posts/mo: $1,990/mo</li>'
         '<li><strong>Standard</strong> — 4 platforms, 80 posts/mo + daily engagement: $3,490/mo</li>'
         '<li><strong>Pro</strong> — 4 platforms + video production + paid amplification: $5,490/mo</li>'
         '</ul>'),
    ],
    cta_title='Let\'s make your feeds look alive',
    cta_body='First month 50% off during launch. Month-to-month, cancel anytime.',
    cta_href='../contact.html',
    cta_btn='Get started →',
    faq_list=[
        ('Do you do video?','Yes — included on Pro. For Essentials/Standard, videos are +$990/mo add-on or see <a href="video-factory.html">Video Factory</a>.'),
        ('Can I see your content before it posts?','Yes. Every post goes through a shared approval doc. You can approve, edit, or reject anything.'),
        ('What if I want to post 2 a day, not 1?','We can scale up — just ask. Rate scales roughly linearly with volume.'),
        ('Do you respond to negative comments?','Yes, per the playbook we build with you in month 1. Certain topics (legal threats, brand crises) we always escalate to you before replying.'),
    ],
)

render(
    slug='fractional-cmo',
    title='AI Fractional CMO — Strategy + execution in one package',
    desc='How NWM Fractional CMO works: strategy sprint, execution playbook, monthly scorecards, exec-level reviews.',
    nav='Fractional CMO',
    h1='AI Fractional CMO — Strategy + execution in one package',
    lede='Most fractional CMOs write decks and disappear. NWM CMO works differently: we bring strategy AND the team that executes it. One point of contact, one monthly invoice, measurable output.',
    minutes=13,
    section_list=[
        ('what','1. What "Fractional CMO" actually means here',
         '<p>Traditional fractional CMO = senior marketer consults 5-10 hrs/week, hands strategy to your internal team, you execute (badly, usually).</p>'
         '<p><strong>NWM CMO</strong> = strategic marketer PLUS our execution team (designers, writers, ad buyers, video editors, automation engineers). One package. You\'re not translating strategy into execution — we own the whole chain.</p>'
         '<div class="callout tip"><strong>💡 Fit check</strong><p>Best for companies $500k–$20M revenue without a VP Marketing, or with a junior marketer who needs leadership cover.</p></div>'),
        ('packages','2. The 3 packages',
         '<div class="feat-sm">'
         '<div class="c"><b>Launch — $4,990/mo</b><p>1 platform strategy + execution. Think: LinkedIn-only or Meta-only. For early-stage.</p></div>'
         '<div class="c"><b>Scale — $9,990/mo</b><p>Full-funnel strategy + 3-4 platforms + CRM + analytics. Most common.</p></div>'
         '<div class="c"><b>Enterprise — $19,900/mo</b><p>Multi-region, complex stack, custom AI workflows, weekly exec briefings.</p></div>'
         '</div>'),
        ('sprint','3. Month 1: The strategy sprint',
         '<div class="step"><div class="num">1</div><div><h4>Week 1: Discovery</h4><p>Kickoff call (2h), stakeholder interviews (5–8), data room access, competitor teardown.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Week 2: Diagnosis</h4><p>Current-state audit: brand, channels, CAC, LTV, funnel leaks, team capability, tech stack.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Week 3: Strategy</h4><p>ICP refinement, positioning, messaging framework, channel bets, 90-day plan, budget allocation.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Week 4: Kickoff</h4><p>Executive readout to your team. Handoff of the 90-day plan. Month 2 execution starts.</p></div></div>'),
        ('execution','4. Months 2-12: Execution',
         '<p>Your CMO leads a pod tailored to your needs. Typical Scale pod:</p>'
         '<ul>'
         '<li><strong>1 CMO</strong> (strategy, exec reviews, internal alignment)</li>'
         '<li><strong>1 content strategist</strong> (SEO, blog, email)</li>'
         '<li><strong>1 designer</strong> (ads, landing pages, brand assets)</li>'
         '<li><strong>1 paid media buyer</strong> (Meta + Google)</li>'
         '<li><strong>1 analytics / ops</strong> (dashboards, attribution, CRM hygiene)</li>'
         '</ul>'
         '<p>Weekly sprint cadence. Monday kickoff, Friday review. You have a shared Slack or Teams channel with the whole pod.</p>'),
        ('reviews','5. Monthly scorecards + quarterly reviews',
         '<p><strong>Monthly scorecard</strong> — first business day of each month. 1-page PDF with: pipeline impact, CAC, ROAS, brand awareness signals (direct traffic, branded search), traffic, leads, MQLs, SQLs, big wins/losses, next month focus.</p>'
         '<p><strong>Quarterly review</strong> — 90-min exec call with you + your co-founders/board if desired. We present results against the 90-day plan, reset goals, adjust budget.</p>'),
        ('tech','6. Tech stack we bring',
         '<ul>'
         '<li><strong>CRM</strong> — NWM CRM included or we plug into your HubSpot/Salesforce</li>'
         '<li><strong>Content</strong> — NWM CMS or your existing CMS</li>'
         '<li><strong>Analytics</strong> — GA4, Looker Studio dashboards, custom attribution models</li>'
         '<li><strong>Automation</strong> — n8n workflows for everything repeatable</li>'
         '<li><strong>AI</strong> — Claude + custom agents tuned on your brand voice</li>'
         '</ul>'),
        ('outcomes','7. What outcomes to expect',
         '<p>Honest expectations (based on 40+ engagements):</p>'
         '<ul>'
         '<li><strong>Month 1–3</strong> — strategy done, execution starts. Early wins in paid (new creative) and email.</li>'
         '<li><strong>Month 4–6</strong> — pipeline growth visible. 1.5–2× MQL volume typical.</li>'
         '<li><strong>Month 7–12</strong> — compounding: SEO traffic up, paid efficiency improving, brand signals rising. 2–4× pipeline, 15–30% CAC reduction.</li>'
         '</ul>'
         '<div class="callout warn"><strong>⚠️ This is a 12-month commitment</strong><p>Marketing compounds. If you\'re not thinking 12 months, don\'t hire any CMO. Minimum engagement: 6 months.</p></div>'),
        ('exit','8. Exit &amp; handoff',
         '<p>When you\'re ready to bring marketing in-house, we help: recruit your VP Marketing, write job descriptions, interview candidates, do a 60-day overlap/handoff. No drama, no lock-in.</p>'),
        ('fit','9. Fit check — is this for you?',
         '<p>Yes if: $500k–$20M rev, growing 20%+/yr, no VP Marketing, team of 5-50.</p>'
         '<p>No if: &lt; $500k rev (too early — focus on product-market fit), have a strong VP already (we\'ll cannibalize), slow-moving enterprise (we move faster than you can approve things).</p>'),
    ],
    cta_title='Is NWM CMO right for you?',
    cta_body='30-min fit call. No pitch. We\'ll tell you honestly if you\'re better off hiring in-house, using a different fractional, or doing nothing.',
    cta_href='../contact.html',
    cta_btn='Book fit call →',
    faq_list=[
        ('Who\'s my actual CMO?','You\'ll meet the person on the sales call. All NWM CMOs have 8+ years senior marketing experience, 3+ as VP or CMO. No junior staff lead engagements.'),
        ('Can I pause if budget tightens?','We offer a "pause mode" ($1,990/mo) that keeps strategy + one key channel running, cuts execution pod. Restart at full pace anytime.'),
        ('What if I already have a paid ads agency?','Fine. We work with them. The CMO coordinates; we bring only the capabilities you\'re missing.'),
        ('Do you take equity instead of cash?','Rarely, case-by-case, only for exceptional early-stage opportunities. Default is cash-only.'),
    ],
)

render(
    slug='email-marketing',
    title='Email Marketing Tutorial — Unsubscribe-safe, high-delivery',
    desc='How to run email marketing that actually lands: list hygiene, sequences, broadcasts, compliance.',
    nav='Email Marketing',
    h1='Email Marketing — unsubscribe-safe, high-delivery, revenue-driving',
    lede='Email is still the highest-ROI channel for SMB. Here\'s how we run it: honest list building, ironclad deliverability, sequences that convert, compliance with CAN-SPAM + GDPR + CASL.',
    minutes=10,
    section_list=[
        ('why','1. Why email still wins',
         '<p>Email ROI = $36–$42 per $1 spent (DMA 2024). No algorithm between you and your audience. Works on day 1 and day 1000.</p>'
         '<p>But: 80% of SMB email programs are broken. The most common issues we fix:</p>'
         '<ul><li>Bought or scraped lists → inbox deliverability tanks → legitimate emails go to spam</li>'
         '<li>No unsubscribe → legal exposure + sender reputation damage</li>'
         '<li>Broadcasts only, zero automation → missed 3-5× revenue from sequences</li>'
         '<li>No segmentation → generic messages → low engagement → list fatigue</li></ul>'),
        ('listhygiene','2. List hygiene — start here',
         '<div class="step"><div class="num">1</div><div><h4>Verify every address</h4><p>Run your list through NeverBounce or ZeroBounce. Remove hard-bounces, role accounts (info@, sales@), and catch-alls that accept everything.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Segment by engagement</h4><p>Opened in last 30 days = active. 30–90 days = warm. 90–180 = cold. 180+ = dormant. Only send to active + warm. Run a win-back to cold; sunset dormant.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Remove duplicates &amp; bad domains</h4><p>Duplicates by email, duplicates by domain+first-name, addresses at dead domains (test.com, asdf.com, etc.).</p></div></div>'),
        ('deliverability','3. Deliverability essentials',
         '<ul>'
         '<li><strong>SPF, DKIM, DMARC</strong> — all 3 configured on your sending domain. Non-negotiable.</li>'
         '<li><strong>Dedicated IP</strong> — only if you send &gt; 200k/month. Otherwise use shared IP from a warm pool.</li>'
         '<li><strong>Warm-up new domains slowly</strong> — 50/day week 1, 200/day week 2, double each week until target volume.</li>'
         '<li><strong>Monitor postmaster tools</strong> — Google Postmaster + Microsoft SNDS. Watch for reputation drops.</li>'
         '</ul>'),
        ('sequences','4. High-ROI sequences',
         '<div class="feat-sm">'
         '<div class="c"><b>Welcome (new lead)</b><p>5 emails over 10 days. 30–50% open rate. Sets expectations + delivers quick value.</p></div>'
         '<div class="c"><b>Abandoned cart / form</b><p>3 emails over 3 days. Recovers 10–25% of drop-offs.</p></div>'
         '<div class="c"><b>Post-purchase</b><p>Thank-you → how-to-get-value → review request → cross-sell. 4 emails over 30 days.</p></div>'
         '<div class="c"><b>Win-back</b><p>Cold subscribers (90+ day no-open). 3 emails. Typically recovers 5–15%.</p></div>'
         '</div>'),
        ('broadcasts','5. Broadcasts done right',
         '<ol>'
         '<li>Send to engaged segments only (not the whole list).</li>'
         '<li>Subject line: specific + curious + &lt; 50 chars. A/B test 2 variants.</li>'
         '<li>One clear CTA per email. More CTAs = fewer clicks.</li>'
         '<li>Plain-text-feel HTML. Fancy designs often hit promotions tab.</li>'
         '<li>Send time: Tue/Wed/Thu 9–11am recipient timezone tests well in B2B.</li>'
         '</ol>'),
        ('compliance','6. Compliance (don\'t get sued)',
         '<ul>'
         '<li><strong>CAN-SPAM (US)</strong> — physical address + unsubscribe in every email. No deceptive subjects.</li>'
         '<li><strong>GDPR (EU)</strong> — explicit consent, right to access, right to delete, DPA with your ESP.</li>'
         '<li><strong>CASL (Canada)</strong> — express consent required for commercial email. No implied "I got your card at an event" 2+ years ago.</li>'
         '<li><strong>CCPA (California)</strong> — "Do Not Sell My Info" if you do any data sharing.</li>'
         '</ul>'
         '<div class="callout warn"><strong>⚠️ Never ever buy lists</strong><p>CAN-SPAM allows cold email with conditions, but bought lists fail deliverability and nuke your sender reputation. Build, don\'t buy.</p></div>'),
        ('tools','7. Tools we use',
         '<ul>'
         '<li><strong>ESP</strong> — NWM CRM (built-in) or Klaviyo (ecom) or Customer.io (SaaS) or Mailchimp (simple)</li>'
         '<li><strong>Verification</strong> — NeverBounce, ZeroBounce, Kickbox</li>'
         '<li><strong>Deliverability monitoring</strong> — Google Postmaster, GlockApps, MailTester</li>'
         '<li><strong>Cold outbound (different stack)</strong> — Instantly or Smartlead + multiple domain pool</li>'
         '</ul>'),
    ],
    cta_title='Get your email program audited',
    cta_body='Free 45-min audit. We\'ll check deliverability, list health, sequences, and compliance. Actionable report within 48h.',
    cta_href='../contact.html',
    cta_btn='Request audit →',
    faq_list=[
        ('How often should I send broadcasts?','1/week baseline. 2/week in launch windows. More than that and unsubscribes spike.'),
        ('What\'s a healthy unsubscribe rate?','&lt; 0.5% per broadcast. If you\'re above 1%, the list is tired or the content is off-message.'),
        ('Should I send cold outbound?','Only from a separate domain + infrastructure — never mix with your main marketing sends. Happy to help set that up.'),
        ('How do I grow the list?','Content + gated resources + website forms + webinar registrations. Bought lists nuke your reputation — don\'t.'),
    ],
)

render(
    slug='websites',
    title='Website Templates & Builds — 10 business days to launch',
    desc='From template to live site in 10 business days. Brief, build, content, launch. Done-for-you.',
    nav='Websites',
    h1='Website Templates &amp; Builds — 10 business days to launch',
    lede='From kickoff to launched site in 10 business days. We bring templates, AI content, and a human builder. You bring domain + brand assets + a willingness to trust the process.',
    minutes=9,
    section_list=[
        ('what','1. What you get',
         '<ul>'
         '<li>5–7 page website (home, services, about, blog, contact + 1-2 extras)</li>'
         '<li>Mobile-responsive, Lighthouse-optimized, SEO-ready from day one</li>'
         '<li>All copy AI-drafted, human-edited, approved by you</li>'
         '<li>Stock imagery + optional AI-generated custom images</li>'
         '<li>Contact form → email + optional CRM integration</li>'
         '<li>Google Analytics, Meta Pixel, LinkedIn Pixel pre-installed</li>'
         '<li>1 round of revisions included</li>'
         '</ul>'),
        ('timeline','2. The 10-day timeline',
         '<div class="step"><div class="num">1</div><div><h4>Day 1 — Kickoff call (45 min)</h4><p>Goals, brand, voice, competitors, sitemap agreement, template pick.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Day 2–3 — Brand + copy</h4><p>Colors, fonts, logo; AI drafts all copy; you review in shared Google Doc.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Day 4–6 — Build</h4><p>We build in NWM CMS. Daily progress links for you to peek at.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Day 7 — Preview + feedback</h4><p>You see the full site on a staging URL. Send feedback.</p></div></div>'
         '<div class="step"><div class="num">5</div><div><h4>Day 8–9 — Revisions</h4><p>We action your feedback. Final QA: mobile, speed, forms, analytics.</p></div></div>'
         '<div class="step"><div class="num">6</div><div><h4>Day 10 — Launch</h4><p>DNS cutover, SSL auto-provision, submit sitemap to Google, monitor for 24h.</p></div></div>'),
        ('templates','3. Templates available',
         '<div class="feat-sm">'
         '<div class="c"><b>Professional services</b><p>Law, accounting, consulting. Conversion-oriented.</p></div>'
         '<div class="c"><b>SaaS / tech</b><p>Product tours, pricing, docs, case studies.</p></div>'
         '<div class="c"><b>Agency / creative</b><p>Portfolio, process, services, team.</p></div>'
         '<div class="c"><b>Local / brick-and-mortar</b><p>Hours, location, reviews, booking.</p></div>'
         '<div class="c"><b>Ecom-lite</b><p>1–10 product catalog. Stripe checkout.</p></div>'
         '<div class="c"><b>Personal brand</b><p>Coaches, speakers, authors. Media kit focus.</p></div>'
         '</div>'),
        ('what-we-need','4. What we need from you',
         '<ol>'
         '<li>Domain name (registered, but we\'ll help if you haven\'t)</li>'
         '<li>Logo — SVG ideally, PNG if not</li>'
         '<li>Brand colors + fonts (or we pick them from the logo)</li>'
         '<li>Existing copy/content, if any (we\'ll use it)</li>'
         '<li>Photo assets, if any (we\'ll supplement with stock)</li>'
         '<li>3 competitor URLs you like or hate (for direction)</li>'
         '</ol>'),
        ('pricing','5. Pricing',
         '<ul>'
         '<li><strong>Essential</strong> — 5 pages, 1 revision round, NWM CMS hosted: $2,990 one-time + $49/mo hosting</li>'
         '<li><strong>Standard</strong> — 7 pages, blog, lead forms, CRM integration: $4,490 one-time + $99/mo</li>'
         '<li><strong>Premium</strong> — 10+ pages, custom design, ongoing updates: $7,990 one-time + $199/mo</li>'
         '</ul>'),
        ('aftercare','6. After launch',
         '<p>Included for 30 days post-launch:</p>'
         '<ul><li>Bug fixes</li><li>Minor copy tweaks</li><li>1 additional page</li><li>Performance tuning if Lighthouse drops</li></ul>'
         '<p>Beyond 30 days: care plan at $199/mo includes all minor updates, a monthly content refresh, and monitoring. Or go self-serve — NWM CMS is yours to edit freely.</p>'),
        ('migration','7. Migrating an existing site',
         '<p>Coming from WordPress, Wix, Squarespace, Webflow? Migration is free with any paid plan. We preserve SEO by mapping 301 redirects from old URLs to new ones, keeping your Google rankings intact.</p>'),
    ],
    cta_title='Get a free 20-min site audit',
    cta_body='Send us your existing site URL. We\'ll send back: top 3 issues hurting conversions, 2 quick wins, honest assessment of whether you need a rebuild.',
    cta_href='../contact.html',
    cta_btn='Request audit →',
    faq_list=[
        ('Can I edit the site myself after?','Yes. Full admin access. It\'s your site.'),
        ('Do you do ecommerce?','Yes but &lt; 20 products. Larger catalogs belong on Shopify — we\'ll build a Shopify storefront too.'),
        ('What about multi-language?','Included. English + Spanish standard. Other languages +$990/each.'),
        ('Hosting costs after year 1?','Same $49–$199/mo. No annual hike games.'),
    ],
)

render(
    slug='analyzer',
    title='Website & SEO Analyzer — Free audit tool',
    desc='How to use the free NetWebMedia analyzer: technical SEO, AEO, performance, content gaps. Download PDF.',
    nav='Analyzer',
    h1='Website &amp; SEO Analyzer — Free audit tool',
    lede='Run a free, instant audit on any URL. Technical SEO, AEO readiness, performance, content gaps. Delivered as a PDF report in under 2 minutes.',
    minutes=4,
    section_list=[
        ('what','1. What the analyzer checks',
         '<ul>'
         '<li><strong>Technical SEO</strong> — meta tags, canonical, robots.txt, sitemap, schema</li>'
         '<li><strong>AEO readiness</strong> — question-answer structure, citations, recency, authority signals</li>'
         '<li><strong>Performance</strong> — Lighthouse scores, Core Web Vitals, image optimization</li>'
         '<li><strong>Content gaps</strong> — pages competitors rank for that you don\'t</li>'
         '<li><strong>Accessibility</strong> — alt text, heading structure, contrast, keyboard nav</li>'
         '<li><strong>Conversion signals</strong> — CTA placement, form friction, trust signals</li>'
         '</ul>'),
        ('use','2. How to use it (60 seconds)',
         '<div class="step"><div class="num">1</div><div><h4>Open the analyzer</h4><p>Go to <a href="../analytics.html">netwebmedia.com/analytics.html</a>.</p></div></div>'
         '<div class="step"><div class="num">2</div><div><h4>Paste a URL</h4><p>Your site, a competitor, or any public URL. No signup.</p></div></div>'
         '<div class="step"><div class="num">3</div><div><h4>Wait ~90 seconds</h4><p>Analysis runs in parallel: crawling, scoring, comparing, generating recommendations.</p></div></div>'
         '<div class="step"><div class="num">4</div><div><h4>Download the report</h4><p>20–40 page PDF with color-coded issues (red/yellow/green) and ranked fixes.</p></div></div>'),
        ('interpret','3. How to read the score',
         '<ul>'
         '<li><strong>90–100</strong> — excellent. Only incremental work needed.</li>'
         '<li><strong>70–89</strong> — solid. A few high-leverage fixes away from excellent.</li>'
         '<li><strong>50–69</strong> — gaps. You\'re losing organic traffic. Fixable in 4–8 weeks of focused work.</li>'
         '<li><strong>&lt; 50</strong> — broken fundamentals. Consider a rebuild (we can help).</li>'
         '</ul>'),
        ('fix','4. Fixing what it finds',
         '<p>Every flagged issue has:</p>'
         '<ul><li>What it is</li>'
         '<li>Why it matters (traffic? rankings? conversions?)</li>'
         '<li>How to fix it (step-by-step or code snippet)</li>'
         '<li>Estimated time to fix</li>'
         '<li>Priority ranking (do this first, this second, this later)</li></ul>'),
        ('limits','5. Limits of the free tool',
         '<p>The free analyzer is great as a starting point. Limits:</p>'
         '<ul>'
         '<li>Crawls up to 50 pages. Paid audit crawls unlimited.</li>'
         '<li>Doesn\'t check backlink profile. Paid audit does.</li>'
         '<li>Doesn\'t interview your customers. Paid audit includes 3 customer calls.</li>'
         '<li>No hands-on fixing. For that, hire us or your team.</li>'
         '</ul>'),
    ],
    cta_title='Run a free audit now',
    cta_body='Takes 90 seconds. No email required.',
    cta_href='../analytics.html',
    cta_btn='Run analyzer →',
    faq_list=[
        ('Is the data stored?','URL + timestamp stored for 30 days for rate-limiting. No personal data unless you submit the PDF email form.'),
        ('Can I audit competitor sites?','Yes — any public URL.'),
        ('Is there an API?','Yes — on the paid plan. Contact us for keys.'),
        ('Why is my score low when I feel my site is good?','Vanity and SEO don\'t correlate. Run it, read the report, come back with questions.'),
    ],
)

print('done')
