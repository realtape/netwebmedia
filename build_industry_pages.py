import os

NAV = """<nav class="navbar has-lang-bar" id="navbar">
  <div class="container">
    <div class="navbar-inner">
      <a href="https://netwebmedia.com" class="nav-logo">
        <span class="logo-wordmark"><span class="logo-net">net</span><span class="logo-web">web</span><span class="logo-media">media</span></span>
      </a>
      <div class="nav-links">
        <a href="https://netwebmedia.com/about.html">About</a>
        <div class="nav-item">
          <a href="https://netwebmedia.com/services.html">Services</a>
          <div class="nav-dropdown">
            <a href="https://netwebmedia.com/services.html#fractional-cmo">&#9733; Fractional CMO</a>
            <a href="https://netwebmedia.com/services.html#ai-automations">AI Automations</a>
            <a href="https://netwebmedia.com/services.html#ai-agents">AI Agents</a>
            <a href="https://netwebmedia.com/services.html#paid-ads">Paid Ads</a>
            <a href="https://netwebmedia.com/services.html#ai-seo">AI SEO &amp; Content</a>
            <a href="https://netwebmedia.com/services.html#social">Social Media</a>
            <a href="https://netwebmedia.com/email-marketing.html">Email Marketing</a>
          </div>
        </div>
        <div class="nav-item">
          <a href="https://netwebmedia.com/industries/">Industries</a>
          <div class="nav-dropdown">
            <a href="https://hospitality.netwebmedia.com">&#127970; Hospitality</a>
            <a href="https://healthcare.netwebmedia.com">&#129657; Healthcare</a>
            <a href="https://beauty.netwebmedia.com">&#10024; Beauty &amp; Wellness</a>
            <a href="https://pro.netwebmedia.com">&#128188; Professional Services</a>
            <a href="https://realestate.netwebmedia.com">&#127968; Real Estate</a>
            <a href="https://restaurants.netwebmedia.com">&#127829; Restaurants &amp; F&amp;B</a>
            <a href="https://fitness.netwebmedia.com">&#127947; Fitness &amp; Gyms</a>
            <a href="https://ecommerce.netwebmedia.com">&#128722; E-commerce</a>
            <a href="https://home.netwebmedia.com">&#128295; Home Services</a>
            <a href="https://tech.netwebmedia.com">&#128187; Tech &amp; SaaS</a>
          </div>
        </div>
        <a href="https://netwebmedia.com/partners.html">Partners</a>
        <a href="https://netwebmedia.com/blog.html">Blog</a>
        <a href="https://netwebmedia.com/faq.html">Q&amp;A</a>
        <a href="https://netwebmedia.com/contact.html">Contact</a>
      </div>
      <div class="nav-ctas">
        <a href="https://netwebmedia.com/contact.html" class="btn-nav-solid">Get a Free Audit</a>
      </div>
      <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>"""

VERTICALS = [
  {
    "slug": "hospitality",
    "folder": "hospitality",
    "emoji": "🏨",
    "title": "AI Marketing for Hotels &amp; Hospitality",
    "meta_desc": "Fill more rooms, cut OTA dependency, and dominate local search. AI-powered fractional CMO for hotels, boutique chains, and hospitality groups.",
    "hero_headline": "Fill More Rooms.<br><span class='hl'>Stop Paying Booking.com.</span>",
    "hero_sub": "Your guests are searching on Google, asking Claude &amp; ChatGPT, and scrolling Instagram — but your property isn't showing up. We fix that. Full AI marketing from $249/mo.",
    "pain_label": "The hospitality marketing problem",
    "pains": [
      ("OTA fees killing your margins", "Booking.com and Expedia take 15–25% per reservation. We drive direct bookings so you keep the money."),
      ("Invisible to AI search", "When someone asks Claude 'best boutique hotel in [city]', you need to be the answer. We build that citation authority."),
      ("No time to run marketing", "You're running a property, not a marketing agency. We handle strategy, content, ads, and reporting — you focus on guests."),
    ],
    "results": ["+38% direct bookings", "-22% OTA dependency", "4.8&#9733; review average"],
    "lite_features": ["Local SEO + Google My Business optimization", "Monthly content calendar (blog + social)", "AEO strategy — get cited by Claude &amp; ChatGPT", "NWM CRM for guest follow-up", "Monthly strategy call"],
    "growth_features": ["Everything in CMO Lite", "Google + Meta paid ads (retargeting + lookalike)", "Review generation automation", "Email marketing to past guests", "AI SDR for group &amp; event inquiries"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — property tours, chef features, events", "Custom AI booking assistant (voice + chat)", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "hotels &amp; hospitality groups",
  },
  {
    "slug": "healthcare",
    "folder": "healthcare",
    "emoji": "🩺",
    "title": "AI Marketing for Healthcare Clinics",
    "meta_desc": "More appointments, fewer no-shows. AI-powered marketing for dental, veterinary, and medical aesthetics clinics — from $249/mo.",
    "hero_headline": "More Appointments.<br><span class='hl'>Less Empty Chairs.</span>",
    "hero_sub": "Patients are asking AI assistants which clinic to trust. Your competitors are showing up — you're not. We build the digital presence that fills your schedule.",
    "pain_label": "The healthcare marketing problem",
    "pains": [
      ("Empty slots draining revenue", "An unfilled appointment is pure lost income. We run the campaigns and automations that keep your calendar full."),
      ("Losing patients to AI search", "Claude and ChatGPT are now the first stop for healthcare recommendations. We optimize your clinic to be the trusted answer."),
      ("No-shows and low retention", "We build automated recall sequences and loyalty touchpoints that keep patients coming back — and referring others."),
    ],
    "results": ["+52% new patient inquiries", "-31% no-show rate", "Top 3 in local AI search"],
    "lite_features": ["Local SEO + Google My Business management", "Monthly health &amp; wellness content", "AEO optimization — be recommended by AI assistants", "NWM CRM for patient follow-up sequences", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Google Ads (search + display) &amp; Meta retargeting", "Automated appointment reminder &amp; recall sequences", "Review generation on Google &amp; Healthgrades", "AI SDR for new patient lead qualification"],
    "scale_features": ["Everything in CMO Growth", "Video factory — 16 patient education Reels/mo", "Custom AI patient intake assistant", "White-glove onboarding + dedicated account strategist", "Priority support + daily Slack access"],
    "cta_industry": "dental, veterinary &amp; aesthetics clinics",
  },
  {
    "slug": "beauty",
    "folder": "beauty",
    "emoji": "✨",
    "title": "AI Marketing for Beauty &amp; Wellness",
    "meta_desc": "Pack your chair every day. AI marketing for salons, spas, and barbershops — grow bookings, build loyalty, and dominate local search from $249/mo.",
    "hero_headline": "Pack Your Chair.<br><span class='hl'>Every Single Day.</span>",
    "hero_sub": "Word of mouth only gets you so far. We build the online machine that turns Instagram followers into booked clients — and booked clients into loyal regulars.",
    "pain_label": "The beauty &amp; wellness marketing problem",
    "pains": [
      ("Slow weeks killing cash flow", "Unpredictable bookings mean unpredictable income. We build always-on campaigns that fill your calendar even on slow Tuesdays."),
      ("Instagram reach that doesn't convert", "Likes don't pay rent. We turn your social presence into a direct booking engine with paid retargeting and AI-driven follow-up."),
      ("Clients who book once and disappear", "We build automated loyalty sequences — birthday offers, rebooking reminders, referral rewards — that turn one-timers into regulars."),
    ],
    "results": ["+44% repeat bookings", "+280% reach-to-book rate", "4.9&#9733; average Google rating"],
    "lite_features": ["Local SEO + Google My Business for salons", "Monthly content: tips, transformations, promos", "AEO — be recommended when AI suggests salons near you", "NWM CRM with rebooking reminder automations", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Meta (Instagram + Facebook) paid ads", "Automated rebooking + loyalty sequences", "Influencer &amp; UGC content coordination", "AI SDR for new client lead qualification"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — transformations, tutorials, behind-the-scenes", "Custom AI booking assistant for your site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "salons, spas &amp; barbershops",
  },
  {
    "slug": "pro",
    "folder": "professional-services",
    "emoji": "💼",
    "title": "AI Marketing for Professional Services",
    "meta_desc": "Stop losing clients to firms half your size. AI-powered fractional CMO for law firms, accounting practices, and consulting agencies — from $249/mo.",
    "hero_headline": "Stop Losing Clients<br><span class='hl'>to Firms Half Your Size.</span>",
    "hero_sub": "Younger competitors with better SEO and AI visibility are winning clients you should own. We build the authority and lead generation machine that puts you back on top.",
    "pain_label": "The professional services marketing problem",
    "pains": [
      ("Referrals alone won't grow you", "The best firms don't wait for referrals — they build a pipeline. We create the content engine and paid strategy that generates inbound leads."),
      ("AI doesn't know your expertise", "When a prospect asks Claude 'best lawyer/accountant for [problem]', you need to be the answer. We build that authority systematically."),
      ("No time for marketing", "You're billing hours, not writing blog posts. We handle all execution — strategy, content, ads, reporting — so you don't have to."),
    ],
    "results": ["+67% inbound inquiries", "Top 3 AI citation for target practice areas", "3.2x ROI on ad spend"],
    "lite_features": ["SEO + thought leadership content strategy", "Monthly articles targeting your practice area keywords", "AEO — be recommended by Claude &amp; ChatGPT", "NWM CRM for prospect follow-up", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Google Search Ads for high-intent keywords", "LinkedIn content + lead gen campaigns", "Email nurture sequences for prospects", "AI SDR for initial inquiry qualification"],
    "scale_features": ["Everything in CMO Growth", "Video factory — 16 expert insight Reels/mo", "Custom AI intake assistant for your firm", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "law firms, accounting &amp; consulting practices",
  },
  {
    "slug": "realestate",
    "folder": "real-estate",
    "emoji": "🏠",
    "title": "AI Marketing for Real Estate Teams",
    "meta_desc": "Be the agent AI recommends. AI marketing for real estate teams and brokerages — more listings, faster lead response from $249/mo.",
    "hero_headline": "Be the Agent<br><span class='hl'>AI Recommends.</span>",
    "hero_sub": "Buyers and sellers are asking AI assistants which agent to trust. We build the digital authority, lead pipeline, and follow-up systems that make you the obvious choice.",
    "pain_label": "The real estate marketing problem",
    "pains": [
      ("Leads go cold before you respond", "Speed-to-lead wins deals. Our AI SDR responds to every inquiry in under 2 minutes, qualifies them, and books your showing — 24/7."),
      ("Invisible in AI-assisted search", "When someone asks Claude 'top real estate agent in [city]', your team needs to come up. We build that authority systematically."),
      ("Manual listing promotion is a full-time job", "We automate listing promotion across Google, Meta, and email so every property gets maximum exposure without the manual work."),
    ],
    "results": ["+73% lead response rate", "2-min avg AI SDR response", "+41% listing inquiries"],
    "lite_features": ["Local SEO + Google My Business for your team", "Listing content automation + neighborhood guides", "AEO — appear when AI recommends local agents", "NWM CRM with lead nurture sequences", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Google + Meta listing promotion ads", "Automated lead follow-up + showing scheduler", "Email campaigns to past clients for referrals", "AI SDR — qualifies &amp; books leads 24/7"],
    "scale_features": ["Everything in CMO Growth", "16 property tour &amp; market update Reels/mo", "Custom AI assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "real estate teams &amp; brokerages",
  },
  {
    "slug": "restaurants",
    "folder": "restaurants",
    "emoji": "🍽️",
    "title": "AI Marketing for Restaurants &amp; F&amp;B",
    "meta_desc": "Full tables, not just on weekends. AI marketing for restaurants, bars, and food &amp; beverage businesses — from $249/mo.",
    "hero_headline": "Full Tables.<br><span class='hl'>Not Just on Weekends.</span>",
    "hero_sub": "Your food is great. But if locals aren't finding you on Google and AI isn't recommending you, you're leaving covers on the table every night.",
    "pain_label": "The restaurant marketing problem",
    "pains": [
      ("Slow midweek nights costing you money", "Fixed costs don't stop on Tuesdays. We run targeted promotions and email campaigns that drive traffic on your slowest nights."),
      ("Losing to chains with bigger budgets", "Big chains have agencies. Now you do too — for a fraction of the cost. We out-smart them with better local targeting and AI search presence."),
      ("No system for reviews and loyalty", "Reviews drive reservations. We build automated systems that turn happy diners into 5-star reviews and loyal regulars."),
    ],
    "results": ["+48% midweek covers", "+180% Google review velocity", "4.8&#9733; average across platforms"],
    "lite_features": ["Google My Business optimization + local SEO", "Monthly content: menu features, events, kitchen stories", "AEO — be recommended when AI suggests restaurants", "NWM CRM for loyalty &amp; email campaigns", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Meta + Google Ads (local awareness + retargeting)", "Automated review request sequences", "Event &amp; private dining promotion campaigns", "AI SDR for reservation &amp; event inquiries"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — dishes, chef stories, ambiance tours", "Custom AI reservation assistant for your site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "restaurants, bars &amp; F&amp;B businesses",
  },
  {
    "slug": "fitness",
    "folder": "fitness",
    "emoji": "🏋️",
    "title": "AI Marketing for Fitness &amp; Gyms",
    "meta_desc": "Keep members, grow revenue year-round. AI marketing for gyms, studios, and fitness businesses — cut churn, fill classes from $249/mo.",
    "hero_headline": "Keep Members.<br><span class='hl'>Grow Revenue Year-Round.</span>",
    "hero_sub": "January fills your gym. February empties it. We build the marketing engine that drives steady member growth, reduces churn, and makes you the top fitness destination locally.",
    "pain_label": "The fitness marketing problem",
    "pains": [
      ("January spike, February crash", "Seasonal churn is predictable — so is the fix. We build retention campaigns and year-round acquisition funnels that smooth out the revenue curve."),
      ("Can't out-spend big-box gyms on ads", "You compete on community and results. We help you tell that story at scale — with content, ads, and AI search presence that big-box can't match locally."),
      ("Members leave without warning", "Our NWM CRM tracks engagement signals and triggers win-back campaigns before members cancel. We're already working before they ask to leave."),
    ],
    "results": ["-28% churn rate", "+55% new member trials", "Top local gym in AI search"],
    "lite_features": ["Local SEO + Google My Business for your gym", "Monthly content: workouts, transformations, schedules", "AEO — be recommended when AI suggests gyms near you", "NWM CRM with churn-prevention automations", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Meta + Google Ads for new member acquisition", "Automated trial-to-member conversion sequences", "Challenge &amp; event promotion campaigns", "AI SDR to qualify &amp; book free trial visits 24/7"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — workouts, member stories, class previews", "Custom AI assistant for class booking &amp; FAQs", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "gyms, studios &amp; fitness businesses",
  },
  {
    "slug": "ecommerce",
    "folder": "ecommerce",
    "emoji": "🛒",
    "title": "AI Marketing for E-commerce",
    "meta_desc": "Turn one-time buyers into loyal customers. AI marketing for e-commerce brands — lower CAC, higher LTV, and omnichannel growth from $249/mo.",
    "hero_headline": "Turn One-Time Buyers<br><span class='hl'>Into Loyal Customers.</span>",
    "hero_sub": "You're spending on ads to acquire customers who buy once and disappear. We build the retention engine — email, SMS, retargeting, and AI personalization — that makes every customer worth 3x more.",
    "pain_label": "The e-commerce marketing problem",
    "pains": [
      ("CAC keeps rising, LTV stays flat", "If you're only optimizing acquisition, you're on a treadmill. We build retention funnels that maximize the value of every customer you've already paid for."),
      ("Abandoned carts leaking revenue", "70% of carts are abandoned. Our automated sequences — email, SMS, retargeting — recover 15–25% of that lost revenue on autopilot."),
      ("Invisible outside your ad spend", "When ad spend stops, traffic stops. We build organic SEO, AEO, and content authority so your brand generates traffic you don't pay for."),
    ],
    "results": ["+34% repeat purchase rate", "22% cart recovery rate", "3.8x ROAS on paid campaigns"],
    "lite_features": ["E-commerce SEO + product content strategy", "Monthly blog &amp; buying guide content", "AEO — appear in AI product recommendations", "NWM CRM for email &amp; SMS retention flows", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Google Shopping + Meta catalog ads", "Abandoned cart &amp; browse abandonment sequences", "Post-purchase upsell &amp; loyalty email flows", "AI SDR for high-value customer outreach"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — product showcases, UGC, unboxings", "Custom AI shopping assistant for your store", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "e-commerce brands &amp; online retailers",
  },
  {
    "slug": "home",
    "folder": "home-services",
    "emoji": "🔧",
    "title": "AI Marketing for Home Services",
    "meta_desc": "Book more jobs, chase fewer leads. AI marketing for contractors, plumbers, electricians, and home service businesses — from $249/mo.",
    "hero_headline": "Book More Jobs.<br><span class='hl'>Chase Fewer Leads.</span>",
    "hero_sub": "HomeAdvisor and Angi take your money and sell your leads to 5 competitors. We build your own lead engine — Google, AI search, and automated follow-up — so you own the relationship.",
    "pain_label": "The home services marketing problem",
    "pains": [
      ("Feast-or-famine booking cycles", "One week slammed, the next empty. We build consistent inbound pipelines through SEO, paid ads, and AI-powered lead nurture that levels out your calendar."),
      ("Paying platforms for your own leads", "Lead aggregators mark up leads and sell them to your competition. We build your direct channel so every lead you get is yours alone."),
      ("Losing jobs because you responded too slow", "Speed wins in home services. Our AI SDR responds to every inquiry in under 2 minutes, qualifies the job, and books the estimate — while you're on another job."),
    ],
    "results": ["+61% inbound leads", "2-min AI SDR response", "-40% reliance on lead aggregators"],
    "lite_features": ["Local SEO + Google My Business optimization", "Monthly content: project showcases, tips, testimonials", "AEO — appear when AI recommends local contractors", "NWM CRM for estimate follow-up automations", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Google Local Service Ads + Meta retargeting", "Automated estimate follow-up &amp; review requests", "Seasonal promotion campaigns", "AI SDR — responds to leads 24/7, books estimates"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — project before/afters, team spotlights", "Custom AI quote assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "contractors, plumbers, electricians &amp; home service pros",
  },
  {
    "slug": "tech",
    "folder": "tech-saas",
    "emoji": "💻",
    "title": "AI Marketing for Tech &amp; SaaS",
    "meta_desc": "Shorten your sales cycle with AI. Fractional CMO for tech startups and SaaS companies — pipeline generation, AEO, and product-led growth from $249/mo.",
    "hero_headline": "Shorten Your Sales Cycle<br><span class='hl'>With AI-Powered Marketing.</span>",
    "hero_sub": "Your product is great but your pipeline is lumpy. We build the demand gen engine — content, AEO, paid, and AI outbound — that fills the funnel and accelerates deals.",
    "pain_label": "The tech &amp; SaaS marketing problem",
    "pains": [
      ("CAC too high, pipeline too thin", "Random acts of content and one-off campaigns don't compound. We build a systematic demand gen engine that improves month over month."),
      ("Invisible in AI-generated vendor research", "B2B buyers use Claude and ChatGPT for vendor research before they ever visit your site. If AI doesn't know your product, you're not in the deal."),
      ("Long sales cycles draining resources", "We build content and automation that educate prospects and handle objections before your sales team touches them — compressing the cycle."),
    ],
    "results": ["-35% sales cycle length", "Top 3 AI citation for target use cases", "2.9x pipeline from content"],
    "lite_features": ["SEO + thought leadership content strategy", "Monthly technical blog posts &amp; comparison content", "AEO — be cited by Claude &amp; ChatGPT for your category", "NWM CRM for lead nurture sequences", "Monthly strategy note"],
    "growth_features": ["Everything in CMO Lite", "Google Search + LinkedIn paid campaigns", "Email nurture sequences for trial &amp; demo leads", "Competitor comparison &amp; battle card content", "AI SDR for demo scheduling &amp; qualification"],
    "scale_features": ["Everything in CMO Growth", "16 Reels/mo — product demos, customer stories, explainers", "Custom AI sales assistant for your site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta_industry": "tech startups &amp; SaaS companies",
  },
]

def build_page(v):
    pain_cards = ""
    for title, desc in v["pains"]:
        pain_cards += f"""
        <div class="pain-card">
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>"""

    lite_lis = "\n".join(f"            <li>{f}</li>" for f in v["lite_features"])
    growth_lis = "\n".join(f"            <li>{f}</li>" for f in v["growth_features"])
    scale_lis = "\n".join(f"            <li>{f}</li>" for f in v["scale_features"])
    r1, r2, r3 = v["results"]
    label = v["title"].split(" for ")[1] if " for " in v["title"] else "Industry"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{v["title"]} | NetWebMedia</title>
  <meta name="description" content="{v["meta_desc"]}">
  <link rel="canonical" href="https://{v["slug"]}.netwebmedia.com">
  <meta property="og:title" content="{v["title"]} | NetWebMedia">
  <meta property="og:description" content="{v["meta_desc"]}">
  <meta property="og:url" content="https://{v["slug"]}.netwebmedia.com">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="https://netwebmedia.com/assets/nwm-logo.svg">
  <link rel="stylesheet" href="https://netwebmedia.com/css/styles.css">
  <style>
    .ind-hero{{padding:120px 20px 60px;text-align:center;max-width:900px;margin:0 auto}}
    .ind-hero .eyebrow{{display:inline-block;background:var(--nwm-orange);color:#fff;padding:6px 16px;border-radius:var(--radius-pill);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}}
    .ind-hero h1{{font-size:clamp(36px,6vw,64px);line-height:1.05;font-weight:800;margin-bottom:24px;font-family:var(--font-display)}}
    .ind-hero h1 .hl{{background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent}}
    .ind-hero .sub{{font-size:clamp(17px,2.5vw,21px);color:var(--text-secondary);max-width:680px;margin:0 auto 40px;line-height:1.6}}
    .hero-ctas{{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}}
    .btn-primary{{background:var(--gradient-btn);color:#fff;padding:16px 32px;border-radius:var(--radius-pill);font-weight:700;font-size:16px;text-decoration:none;display:inline-block;transition:var(--transition)}}
    .btn-primary:hover{{transform:translateY(-2px);box-shadow:var(--shadow-glow)}}
    .btn-ghost-white{{background:transparent;border:2px solid rgba(255,255,255,.3);color:#fff;padding:14px 30px;border-radius:var(--radius-pill);font-weight:600;font-size:16px;text-decoration:none;display:inline-block;transition:var(--transition)}}
    .btn-ghost-white:hover{{border-color:var(--nwm-orange);color:var(--nwm-orange)}}
    .results-bar{{background:rgba(255,103,31,.08);border:1px solid rgba(255,103,31,.2);border-radius:var(--radius-md);max-width:800px;margin:0 auto 80px;padding:32px 20px;display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px}}
    .result-stat{{text-align:center}}
    .result-stat .n{{font-size:36px;font-weight:900;background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1}}
    .result-stat .l{{font-size:12px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:.08em}}
    .section{{max-width:1100px;margin:0 auto;padding:80px 20px}}
    .section-label{{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:12px}}
    .section-title{{font-size:clamp(28px,4vw,42px);font-weight:800;font-family:var(--font-display);margin-bottom:48px;line-height:1.15}}
    .pain-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}}
    .pain-card{{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:28px;transition:var(--transition)}}
    .pain-card:hover{{border-color:var(--border-accent);transform:translateY(-3px)}}
    .pain-card h3{{font-size:18px;font-weight:700;margin-bottom:10px;color:#fff}}
    .pain-card p{{font-size:15px;color:var(--text-secondary);line-height:1.6}}
    .pricing-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}}
    .price-card{{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:36px;position:relative;transition:var(--transition)}}
    .price-card.featured{{border-color:var(--nwm-orange);background:rgba(255,103,31,.06)}}
    .price-card:hover{{transform:translateY(-4px);box-shadow:var(--shadow-card)}}
    .price-badge{{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--gradient-btn);color:#fff;padding:5px 18px;border-radius:var(--radius-pill);font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}}
    .price-tier{{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:8px}}
    .price-name{{font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;font-family:var(--font-display)}}
    .price-desc{{font-size:13px;color:var(--text-muted);margin-bottom:20px}}
    .price-amount{{font-size:52px;font-weight:900;color:#fff;line-height:1;margin-bottom:4px;font-family:var(--font-display)}}
    .price-amount span{{font-size:20px;font-weight:400;color:var(--text-muted)}}
    .price-setup{{font-size:13px;color:var(--text-muted);margin-bottom:24px}}
    .price-features{{list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:10px}}
    .price-features li{{font-size:14px;color:var(--text-secondary);padding-left:20px;position:relative;line-height:1.5}}
    .price-features li::before{{content:"\\2713";position:absolute;left:0;color:var(--nwm-orange);font-weight:700}}
    .price-cta{{display:block;text-align:center;padding:14px;border-radius:var(--radius-pill);font-weight:700;font-size:15px;text-decoration:none;transition:var(--transition)}}
    .price-cta.solid{{background:var(--gradient-btn);color:#fff}}
    .price-cta.outline{{border:2px solid var(--nwm-orange);color:var(--nwm-orange)}}
    .price-cta:hover{{transform:translateY(-1px);opacity:.9}}
    .divider{{border:none;border-top:1px solid var(--border-glass);margin:0}}
    .final-cta-wrap{{text-align:center;padding:100px 20px;max-width:700px;margin:0 auto}}
    .final-cta-wrap h2{{font-size:clamp(28px,4vw,44px);font-weight:800;font-family:var(--font-display);margin-bottom:20px}}
    .final-cta-wrap p{{font-size:18px;color:var(--text-secondary);margin-bottom:36px}}
    footer{{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:13px;border-top:1px solid var(--border-glass)}}
    footer a{{color:var(--text-muted);text-decoration:none}}
    footer a:hover{{color:var(--nwm-orange)}}
  </style>
</head>
<body>

{NAV}

<main>
  <div class="ind-hero">
    <div class="eyebrow">{v["emoji"]} {label}</div>
    <h1>{v["hero_headline"]}</h1>
    <p class="sub">{v["hero_sub"]}</p>
    <div class="hero-ctas">
      <a href="https://netwebmedia.com/contact.html" class="btn-primary">Get a Free Audit &rarr;</a>
      <a href="https://netwebmedia.com/services.html" class="btn-ghost-white">See All Services</a>
    </div>
  </div>

  <div class="results-bar">
    <div class="result-stat"><div class="n">{r1}</div><div class="l">Client avg result</div></div>
    <div class="result-stat"><div class="n">{r2}</div><div class="l">Client avg result</div></div>
    <div class="result-stat"><div class="n">{r3}</div><div class="l">Client avg result</div></div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label">{v["pain_label"]}</div>
    <div class="section-title">Why most {v["cta_industry"]}<br>struggle with marketing</div>
    <div class="pain-grid">{pain_cards}
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label" style="text-align:center">Fractional CMO Retainer &mdash; Most Popular</div>
    <div class="section-title" style="text-align:center">Your entire marketing function,<br>fully managed by AI + humans.</div>
    <p style="text-align:center;color:var(--text-muted);font-size:15px;margin-top:-32px;margin-bottom:48px">90-day minimum &middot; month-to-month thereafter &middot; All plans include NWM CRM (46 modules)</p>
    <div class="pricing-grid">

      <div class="price-card">
        <div class="price-tier">CMO Lite</div>
        <div class="price-name">CMO Lite</div>
        <div class="price-desc">AEO + SEO + content strategy</div>
        <div class="price-amount">$249<span>/mo</span></div>
        <div class="price-setup">No setup fee</div>
        <ul class="price-features">
{lite_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline">Get started &rarr;</a>
      </div>

      <div class="price-card featured">
        <div class="price-badge">Most Popular</div>
        <div class="price-tier">CMO Growth</div>
        <div class="price-name">CMO Growth</div>
        <div class="price-desc">AEO + SEO + paid ads + social</div>
        <div class="price-amount">$999<span>/mo</span></div>
        <div class="price-setup">Setup $499</div>
        <ul class="price-features">
{growth_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta solid">Get started &rarr;</a>
      </div>

      <div class="price-card">
        <div class="price-tier">CMO Scale</div>
        <div class="price-name">CMO Scale</div>
        <div class="price-desc">Full-stack marketing department</div>
        <div class="price-amount">$2,499<span>/mo</span></div>
        <div class="price-setup">Setup $999</div>
        <ul class="price-features">
{scale_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline">Contact sales &rarr;</a>
      </div>

    </div>
    <p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:24px">+ ad spend at cost &middot; 12% mgmt fee on ad spend (min $300/mo) &middot; <a href="https://netwebmedia.com/contact.html" style="color:var(--nwm-orange)">Questions? hello@netwebmedia.com</a></p>
  </div>

  <hr class="divider">

  <div class="final-cta-wrap">
    <h2>Ready to grow your {v["cta_industry"]}?</h2>
    <p>Get a free 30-minute audit. We&rsquo;ll show you exactly where you&rsquo;re losing visibility and revenue &mdash; and what to do about it.</p>
    <a href="https://netwebmedia.com/contact.html" class="btn-primary" style="font-size:18px;padding:18px 40px">Book Your Free Audit &rarr;</a>
  </div>
</main>

<footer>
  <p>&copy; 2026 <a href="https://netwebmedia.com">NetWebMedia</a> &middot; <a href="https://netwebmedia.com/privacy.html">Privacy</a> &middot; <a href="https://netwebmedia.com/terms.html">Terms</a> &middot; hello@netwebmedia.com</p>
</footer>

<script src="https://netwebmedia.com/js/main.js"></script>
</body>
</html>"""

base = r'C:\Users\Usuario\Desktop\NetWebMedia\industries'
for v in VERTICALS:
    path = os.path.join(base, v["folder"], "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(build_page(v))
    print(f"built: {v['folder']}/index.html")

print("\nDone — 10 pages built.")
