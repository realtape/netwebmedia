/* CMS Mock Data */
var CMS_DATA = (function () {

  var stats = {
    publishedPages: 12,
    publishedPosts: 87,
    queuedPosts: 280,
    activeLandingPages: 14,
    formSubmissions30d: 1842,
    monthlyVisitors: 48230,
    conversionRate: 4.8,
    avgTimeOnPage: "2:41"
  };

  var pages = [
    { slug: "index",      title: "Home",                       url: "/",                    status: "published", views30d: 18240, conv30d: 4.2, lastEdit: "2026-04-15", author: "Isabella Torres", template: "Home" },
    { slug: "services",   title: "Services",                   url: "/services.html",       status: "published", views30d: 9430,  conv30d: 5.8, lastEdit: "2026-04-16", author: "David Kim", template: "Services Overview" },
    { slug: "about",      title: "About",                      url: "/about.html",          status: "published", views30d: 3120,  conv30d: 1.9, lastEdit: "2026-04-14", author: "Sofia Martínez", template: "About" },
    { slug: "results",    title: "Results / Case Studies",     url: "/results.html",        status: "published", views30d: 2890,  conv30d: 7.3, lastEdit: "2026-04-10", author: "Ana González", template: "Case Studies" },
    { slug: "blog",       title: "Blog",                       url: "/blog.html",           status: "published", views30d: 11240, conv30d: 2.1, lastEdit: "2026-04-16", author: "automation", template: "Blog Hub" },
    { slug: "contact",    title: "Contact",                    url: "/contact.html",        status: "published", views30d: 4230,  conv30d: 9.4, lastEdit: "2026-04-12", author: "Marcus Chen", template: "Contact" },
    { slug: "diagnostic", title: "Free Website Analyzer",      url: "/diagnostic.html",     status: "published", views30d: 6140,  conv30d: 12.8,lastEdit: "2026-04-16", author: "Valentina Ruiz", template: "Interactive Tool" },
    { slug: "analytics",  title: "Analytics Tool",             url: "/analytics.html",      status: "published", views30d: 2180,  conv30d: 8.1, lastEdit: "2026-04-08", author: "Noah Williams", template: "Interactive Tool" },
    { slug: "pricing",    title: "Pricing (draft)",            url: "/pricing.html",        status: "draft",     views30d: 0,     conv30d: 0,   lastEdit: "2026-04-15", author: "David Kim", template: "Pricing" },
    { slug: "careers",    title: "Careers",                    url: "/careers.html",        status: "scheduled", views30d: 0,     conv30d: 0,   lastEdit: "2026-04-16", author: "Isabella Torres", template: "Careers" },
    { slug: "privacy",    title: "Privacy Policy",             url: "/privacy.html",        status: "published", views30d: 620,   conv30d: 0.1, lastEdit: "2026-02-20", author: "legal", template: "Legal" },
    { slug: "terms",      title: "Terms of Service",           url: "/terms.html",          status: "published", views30d: 480,   conv30d: 0.1, lastEdit: "2026-02-20", author: "legal", template: "Legal" }
  ];

  var blogRecent = [
    { slug: "gpt-5-enterprise-pricing-shift",         title: "GPT-5 Enterprise Pricing Shift",                tag: "AI Research",     published: "2026-04-16", views: 1420, author: "Ana González",    readTime: "7 min" },
    { slug: "claude-4-sonnet-long-context-playbook",  title: "Claude 4 Sonnet: Long-Context Playbook",         tag: "AI Tools",        published: "2026-04-16", views: 1180, author: "David Kim",       readTime: "8 min" },
    { slug: "anthropic-mcp-model-context-protocol",   title: "Anthropic MCP: Model Context Protocol Playbook", tag: "AI Architecture", published: "2026-04-16", views: 980,  author: "Marcus Chen",     readTime: "9 min" },
    { slug: "tiktok-symphony-ai-creative",            title: "TikTok Symphony for AI Creative",                tag: "Paid Media",      published: "2026-04-15", views: 2340, author: "Valentina Ruiz",  readTime: "6 min" },
    { slug: "shopify-ai-store-builder",               title: "Shopify AI Store Builder",                       tag: "E-commerce",      published: "2026-04-15", views: 1860, author: "Sofia Martínez",  readTime: "7 min" },
    { slug: "answer-engine-wars",                     title: "The Answer Engine Wars",                         tag: "AEO & SEO",       published: "2026-04-14", views: 4210, author: "Isabella Torres", readTime: "9 min" }
  ];

  var blogQueue = {
    totalInQueue: 280,
    daysOfRunway: 14,
    nextPublish: "2026-04-17 09:00 ET",
    cadence: "20 / day at 9 AM America/New_York",
    nextBatchSample: [
      "gpt-5-enterprise-pricing-shift",
      "claude-4-sonnet-long-context-playbook",
      "gemini-live-voice-agents-launch",
      "anthropic-mcp-model-context-protocol",
      "openai-operator-computer-agent-marketing"
    ]
  };

  var landingPages = [
    { slug: "ai-audit-lp",           title: "Free AI Marketing Audit",                   status: "active",  visitors: 8430, submissions: 612, cr: 7.3, funnel: "Awareness → Audit Request" },
    { slug: "ai-seo-deep-dive",      title: "AI SEO Deep Dive — AEO Checklist",           status: "active",  visitors: 6210, submissions: 398, cr: 6.4, funnel: "Awareness → Checklist Download" },
    { slug: "agentforce-demo",       title: "Agentforce Demo Request",                    status: "active",  visitors: 2840, submissions: 184, cr: 6.5, funnel: "Consideration → Demo" },
    { slug: "webinar-q2",            title: "Q2 AI Marketing Webinar Reg",                status: "active",  visitors: 3420, submissions: 724, cr: 21.2, funnel: "Event Reg" },
    { slug: "pricing-calculator",    title: "AI Stack ROI Calculator",                    status: "active",  visitors: 1920, submissions: 241, cr: 12.6, funnel: "Consideration → ROI" },
    { slug: "case-study-gated",      title: "Download: 10x SaaS Case Study",              status: "paused",  visitors: 880,  submissions: 96,  cr: 10.9, funnel: "Awareness → Case Study" },
    { slug: "vip-consult",           title: "VIP Consultation Book-a-Call",               status: "active",  visitors: 1240, submissions: 188, cr: 15.2, funnel: "Decision → Booking" },
    { slug: "ghost-funnel-test",     title: "Split Test: Headline A vs B",                 status: "running", visitors: 2180, submissions: 162, cr: 7.4, funnel: "Awareness → Audit Request" }
  ];

  var forms = [
    { id: "contact-main",        name: "Contact — Main",             submissions30d: 382, convRate: 9.1, lastEdit: "2026-04-12", connectedTo: "Hubspot + CRM", fields: 5 },
    { id: "audit-request",       name: "Free Audit Request",          submissions30d: 612, convRate: 7.3, lastEdit: "2026-04-14", connectedTo: "CRM Pipeline", fields: 7 },
    { id: "newsletter-footer",   name: "Newsletter — Footer",         submissions30d: 428, convRate: 3.1, lastEdit: "2026-03-20", connectedTo: "Email Nurture", fields: 2 },
    { id: "webinar-reg-q2",      name: "Webinar Registration Q2",     submissions30d: 724, convRate: 21.2,lastEdit: "2026-04-10", connectedTo: "Calendar + Email", fields: 4 },
    { id: "demo-book",           name: "Demo Booking",                submissions30d: 184, convRate: 6.5, lastEdit: "2026-04-05", connectedTo: "Calendar + CRM", fields: 6 },
    { id: "roi-calc-save",       name: "ROI Calculator Save Results",  submissions30d: 241, convRate: 12.6,lastEdit: "2026-04-02", connectedTo: "Email Nurture", fields: 3 },
    { id: "case-study-gate",     name: "Case Study Download Gate",     submissions30d: 96,  convRate: 10.9,lastEdit: "2026-03-28", connectedTo: "Email Nurture", fields: 3 }
  ];

  var templates = [
    { id: "landing-saas-01",       name: "SaaS Hero + Feature Grid",   category: "Landing Pages", tier: "pro",       preview: "#6c5ce7", uses: 128 },
    { id: "landing-agency-02",     name: "Agency Dark Cinematic",      category: "Landing Pages", tier: "pro",       preview: "#2d3436", uses: 94 },
    { id: "landing-ecom-03",       name: "E-commerce Product Launch",  category: "Landing Pages", tier: "standard",  preview: "#fd79a8", uses: 212 },
    { id: "blog-editorial",        name: "Editorial Magazine Blog",    category: "Blog",          tier: "pro",       preview: "#0984e3", uses: 76 },
    { id: "blog-minimalist",       name: "Minimalist Long-form Blog",   category: "Blog",          tier: "standard",  preview: "#636e72", uses: 184 },
    { id: "email-welcome",         name: "Welcome Sequence Email",     category: "Email",         tier: "standard",  preview: "#00b894", uses: 298 },
    { id: "email-newsletter",      name: "Weekly Newsletter",          category: "Email",         tier: "standard",  preview: "#00cec9", uses: 421 },
    { id: "form-multistep",        name: "Multi-step Qualification",   category: "Forms",         tier: "pro",       preview: "#e17055", uses: 142 },
    { id: "site-portfolio",        name: "Creator Portfolio",          category: "Sites",         tier: "pro",       preview: "#a29bfe", uses: 88 },
    { id: "site-startup",          name: "Startup Marketing Site",      category: "Sites",         tier: "pro",       preview: "#fdcb6e", uses: 164 },
    { id: "funnel-webinar",        name: "Webinar Funnel — 3 step",    category: "Funnels",       tier: "pro",       preview: "#74b9ff", uses: 96 },
    { id: "funnel-tripwire",       name: "Tripwire Offer Funnel",      category: "Funnels",       tier: "pro",       preview: "#fd79a8", uses: 73 },
    { id: "course-membership",     name: "Course Membership Portal",   category: "Memberships",   tier: "pro",       preview: "#6c5ce7", uses: 51 },
    { id: "membership-gated",      name: "Gated Content Community",    category: "Memberships",   tier: "pro",       preview: "#00b894", uses: 38 }
  ];

  var templateCounts = {
    "Landing Pages": 62, "Blog": 24, "Sites": 48, "Email": 36,
    "Forms": 18, "Funnels": 22, "Memberships": 12
    /* 62 + 24 + 48 + 36 + 18 + 22 + 12 = 222 → "200+" */
  };

  var seoKeywords = [
    { keyword: "ai marketing agency",        position: 3,  prev: 5,  volume: 9800, difficulty: 52, intent: "commercial", page: "/", traffic: 2840 },
    { keyword: "answer engine optimization", position: 1,  prev: 2,  volume: 3200, difficulty: 44, intent: "informational", page: "/blog/aeo-replaces-seo-2026.html", traffic: 1680 },
    { keyword: "aeo vs seo 2026",            position: 2,  prev: 4,  volume: 1820, difficulty: 38, intent: "informational", page: "/blog/answer-engine-wars.html", traffic: 910 },
    { keyword: "best ai seo tools",          position: 6,  prev: 9,  volume: 4100, difficulty: 61, intent: "commercial", page: "/services.html", traffic: 520 },
    { keyword: "ai website audit free",      position: 4,  prev: 7,  volume: 2400, difficulty: 34, intent: "commercial", page: "/diagnostic.html", traffic: 740 },
    { keyword: "claude vs gpt marketing",    position: 8,  prev: 12, volume: 1640, difficulty: 45, intent: "informational", page: "/blog/claude-4-sonnet-long-context-playbook.html", traffic: 280 },
    { keyword: "hubspot ghl alternative",    position: 11, prev: 14, volume: 880,  difficulty: 48, intent: "commercial", page: "/services.html", traffic: 140 },
    { keyword: "ai sdr booking meetings",    position: 5,  prev: 5,  volume: 720,  difficulty: 29, intent: "commercial", page: "/blog/ai-sdrs-booking-meetings.html", traffic: 240 },
    { keyword: "perplexity enterprise use",  position: 2,  prev: 3,  volume: 960,  difficulty: 36, intent: "informational", page: "/blog/perplexity-enterprise-ai-search.html", traffic: 580 }
  ];

  var seoAudit = [
    { category: "Technical SEO",    score: 92, issues: 3,  impact: "low",    items: ["3 pages missing canonical", "2 images > 500KB", "Fix sitemap.xml priority tags"] },
    { category: "On-Page",          score: 88, issues: 7,  impact: "medium", items: ["Title tags > 60 chars (4)", "Missing H1 (2)", "Meta description too short (1)"] },
    { category: "Content Quality",  score: 95, issues: 2,  impact: "low",    items: ["Thin content on /careers (placeholder)", "Add FAQ schema to pricing"] },
    { category: "Schema & AEO",     score: 81, issues: 11, impact: "high",   items: ["Add Article schema to 6 blog posts", "Add FAQPage to 3 service pages", "Missing BreadcrumbList sitewide"] },
    { category: "Core Web Vitals",  score: 94, issues: 1,  impact: "low",    items: ["/blog.html LCP = 2.4s (target < 2.5s)"] },
    { category: "Backlinks",        score: 72, issues: 8,  impact: "medium", items: ["Domain rating 54 (was 52)", "8 broken inbound links", "Disavow 3 spam domains"] }
  ];

  var abTests = [
    { id: "hero-copy-01",        name: "Homepage Hero — Copy A/B",        page: "/",                    status: "running",   visitorsA: 2840, visitorsB: 2780, crA: 4.2, crB: 5.1, confidence: 87, winner: "B" },
    { id: "cta-button-02",       name: "Services CTA Button Text",         page: "/services.html",       status: "winner",    visitorsA: 3210, visitorsB: 3190, crA: 5.8, crB: 8.1, confidence: 98, winner: "B" },
    { id: "pricing-layout-03",   name: "Pricing Table Layout — 3 vs 4 col",page: "/pricing.html",        status: "running",   visitorsA: 620,  visitorsB: 640,  crA: 3.1, crB: 3.4, confidence: 62, winner: "-" },
    { id: "lead-form-04",        name: "Contact Form Length — 5 vs 7 fields",page: "/contact.html",      status: "winner",    visitorsA: 1840, visitorsB: 1820, crA: 9.4, crB: 11.2,confidence: 95, winner: "A (5 fields)" },
    { id: "blog-card-05",        name: "Blog Card Image — Photo vs Illustration",page: "/blog.html",    status: "running",   visitorsA: 5240, visitorsB: 5180, crA: 2.1, crB: 2.4, confidence: 76, winner: "-" },
    { id: "analyzer-headline-06",name: "Analyzer Headline A/B",            page: "/diagnostic.html",     status: "completed", visitorsA: 3120, visitorsB: 3080, crA: 12.8,crB: 11.9,confidence: 91, winner: "A" }
  ];

  var memberships = [
    { id: "agency-insiders", name: "Agency Insiders (Pro)",      members: 142, mrr: 8520, tier: "Pro",       content: 38 },
    { id: "aeo-masterclass", name: "AEO Masterclass",            members: 86,  mrr: 6020, tier: "Premium",   content: 24 },
    { id: "founders-circle", name: "Founders Circle",            members: 24,  mrr: 7200, tier: "Enterprise",content: 19 },
    { id: "free-resources",  name: "Free Resource Hub",          members: 1240,mrr: 0,    tier: "Free",      content: 62 }
  ];

  var workflows = [
    { name: "New Lead → Nurture", trigger: "Form submission: Audit Request", steps: 8, active: true, runs30d: 612, conversions: 148 },
    { name: "Trial Ending Save",  trigger: "Subscription event: trial-ending", steps: 6, active: true, runs30d: 94, conversions: 38 },
    { name: "Blog Auto-publish",  trigger: "Cron: 9 AM America/New_York",     steps: 3, active: true, runs30d: 30, conversions: 0 },
    { name: "Abandoned Cart",     trigger: "E-com event: cart-abandoned",      steps: 4, active: true, runs30d: 241, conversions: 42 },
    { name: "Webinar Reg → Reminder",trigger: "Form submission: Webinar Reg", steps: 5, active: true, runs30d: 724, conversions: 382 },
    { name: "Churn Risk Outreach",trigger: "Health score drops below 60",      steps: 7, active: false,runs30d: 0,   conversions: 0 }
  ];

  var media = [
    { name: "hero-home-v3.webp",       type: "image", size: "238 KB", dim: "1920×1080", uses: 1, uploaded: "2026-04-15" },
    { name: "nwm-logo-horizontal.svg", type: "image", size: "12 KB",  dim: "vector",    uses: 38, uploaded: "2025-11-02" },
    { name: "case-study-saas-q1.mp4",  type: "video", size: "18.2 MB",dim: "1920×1080", uses: 3, uploaded: "2026-04-08" },
    { name: "aeo-checklist.pdf",       type: "doc",   size: "420 KB", dim: "12 pages",  uses: 14,uploaded: "2026-04-05" },
    { name: "team-photo-2026.webp",    type: "image", size: "182 KB", dim: "1600×900",  uses: 1, uploaded: "2026-03-22" },
    { name: "webinar-q2-poster.webp",  type: "image", size: "98 KB",  dim: "1200×628",  uses: 2, uploaded: "2026-04-10" },
    { name: "robot-3d-hero.svg",       type: "image", size: "24 KB",  dim: "vector",    uses: 1, uploaded: "2026-04-16" }
  ];

  var recentActivity = [
    { time: "12 min ago",  user: "automation", action: "Published 20 blog posts (9 AM ET cron)",      type: "blog" },
    { time: "1h ago",      user: "David Kim",  action: "Edited Pricing (draft)",                      type: "page" },
    { time: "3h ago",      user: "Valentina",  action: "New form submission: Free Audit Request",     type: "form" },
    { time: "4h ago",      user: "A/B engine", action: "Winner declared: Services CTA Button (B +39%)",type: "ab" },
    { time: "Yesterday",   user: "Isabella",   action: "Applied template 'SaaS Hero + Feature Grid'",  type: "template" },
    { time: "Yesterday",   user: "Marcus",     action: "Fixed 11 schema issues on blog posts",         type: "seo" },
    { time: "2 days ago",  user: "Sofia",      action: "Launched Landing Page 'Agentforce Demo'",      type: "landing" }
  ];

  var trafficDaily = [
    { day: "Apr 9",  visits: 1620 },
    { day: "Apr 10", visits: 1840 },
    { day: "Apr 11", visits: 2010 },
    { day: "Apr 12", visits: 1890 },
    { day: "Apr 13", visits: 2420 },
    { day: "Apr 14", visits: 2780 },
    { day: "Apr 15", visits: 3120 },
    { day: "Apr 16", visits: 3480 }
  ];

  return {
    stats: stats,
    pages: pages,
    blogRecent: blogRecent,
    blogQueue: blogQueue,
    landingPages: landingPages,
    forms: forms,
    templates: templates,
    templateCounts: templateCounts,
    seoKeywords: seoKeywords,
    seoAudit: seoAudit,
    abTests: abTests,
    memberships: memberships,
    workflows: workflows,
    media: media,
    recentActivity: recentActivity,
    trafficDaily: trafficDaily
  };
})();
