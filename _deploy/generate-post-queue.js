#!/usr/bin/env node
// _deploy/generate-post-queue.js
// Auto-generates blog post JSON files using the Claude API.
//
// Usage:
//   node _deploy/generate-post-queue.js                    # generate 70 posts
//   node _deploy/generate-post-queue.js --count 300        # generate 300 posts
//   node _deploy/generate-post-queue.js --start-date 2026-05-01 --count 70
//
// Requires: ANTHROPIC_API_KEY env var

const fs   = require('fs');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

const QUEUE_DIR     = path.join('_deploy', 'posts-queue');
const PUBLISHED_DIR = path.join(QUEUE_DIR, '_published');
const API_URL       = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-haiku-4-5-20251001';
const BATCH_SIZE    = 5; // posts per API call

// ─── CLI args ────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const countArg    = args.indexOf('--count');
const dateArg     = args.indexOf('--start-date');
const TARGET      = countArg   !== -1 ? parseInt(args[countArg + 1],   10) : 70;
const START_DATE  = dateArg    !== -1 ? new Date(args[dateArg + 1])        : new Date();

// ─── Topic pool ──────────────────────────────────────────────────────────────
// Broad enough to cover 300+ unique posts without repetition.

const TOPIC_POOL = [
  // AI & automation
  'AI tools for small business marketing automation',
  'using AI for customer retention and re-engagement',
  'AI-powered lead generation for service businesses',
  'AI content strategy for local businesses in 2026',
  'machine learning for marketing attribution',
  'AI for sales pipeline management',
  'predictive analytics for SMB marketing',
  'AI copywriting tools: what works and what fails',
  'automating social media with AI tools',
  'AI for competitive intelligence in local markets',
  'natural language search and what it means for local SEO',
  'AI personalization in email marketing',
  'chatbot ROI for local service businesses',
  'AI image generation for ad creative',
  'voice search optimization for local businesses',

  // AIO / AEO / SEO
  'answer engine optimization tactics for 2026',
  'getting cited in Google AI Overviews for local queries',
  'Perplexity visibility strategy for service businesses',
  'ChatGPT Search for local business discovery',
  'structured data and schema markup for AI search',
  'E-E-A-T signals and how to build them in 2026',
  'topical authority building for niche websites',
  'internal linking strategy for AI-era content',
  'local keyword research in the AI era',
  'zero-click SEO: how to win when users skip the results',
  'content velocity vs content quality in 2026 SEO',
  'featured snippet optimization for local queries',
  'Google Business Profile advanced optimization',
  'core web vitals and conversion rate correlation',
  'mobile-first indexing for local service sites',

  // NetWebMedia services
  'website conversion rate optimization for SMBs',
  'CRM setup and automation for small service businesses',
  'email marketing ROI for local businesses',
  'landing page design principles for local services',
  'paid search strategy for service businesses on tight budgets',
  'retargeting ads for local businesses',
  'Google Ads vs Meta Ads for local service businesses',
  'marketing analytics dashboards for SMB owners',
  'content marketing ROI measurement',
  'digital marketing KPIs every small business should track',
  'marketing automation for businesses without a marketing team',
  'website redesign ROI: when does it make sense',
  'building a marketing funnel for a service business',
  'client onboarding automation for service businesses',
  'referral marketing automation with CRM tools',

  // Industry niches
  'digital marketing for dental practices',
  'SEO for veterinary clinics',
  'online marketing for physical therapy clinics',
  'gym and fitness studio marketing with AI',
  'optometry practice digital marketing',
  'chiropractic marketing and local SEO',
  'pediatric clinic marketing automation',
  'mental health practice digital presence',
  'pharmacy local SEO and online marketing',
  'dermatology clinic social media and SEO',

  'property management digital marketing',
  'commercial real estate content marketing',
  'vacation rental AI marketing',
  'mortgage broker SEO and lead generation',
  'real estate photography SEO',

  'franchise digital marketing and local SEO',
  'multi-location business SEO strategy',
  'e-commerce local SEO for brick-and-mortar stores',
  'subscription box marketing with AI tools',
  'B2B service business content marketing',

  'coffee shop and café digital marketing',
  'food truck marketing and local SEO',
  'bakery and specialty food business online marketing',
  'personal chef and catering digital marketing',
  'food delivery optimization for restaurants',

  'hotel and boutique accommodation digital marketing',
  'travel agency AI marketing in 2026',
  'adventure tourism and eco-tourism SEO',
  'event venue local SEO and marketing',
  'destination wedding venue marketing',

  'landscaping and lawn care marketing automation',
  'pest control digital marketing and local SEO',
  'cleaning service CRM and automation',
  'moving company SEO and lead generation',
  'roofing company digital marketing',
  'pool service marketing automation',
  'garage door and locksmith local SEO',
  'security system installer marketing',
  'solar installation company digital marketing',
  'window and door company local SEO',

  'accounting firm content marketing and AEO',
  'bookkeeping service digital marketing',
  'tax preparation SEO and local search',
  'business consulting firm content strategy',
  'HR consulting digital marketing',
  'IT managed services local SEO',
  'cybersecurity firm marketing and thought leadership',
  'web design agency marketing strategy',
  'marketing agency new client acquisition',
  'staffing agency digital marketing',

  'driving school local SEO and marketing',
  'music lesson studio digital marketing',
  'dance studio marketing automation',
  'art studio and pottery class marketing',
  'language school content marketing and SEO',
  'coding bootcamp digital marketing',
  'online course creator marketing with AI',
  'tutoring marketplace vs independent tutor SEO',
  'college prep service marketing',
  'early childhood education center marketing',

  'bridal shop digital marketing',
  'jewelry store local SEO and marketing',
  'antique store and resale shop digital marketing',
  'optical boutique marketing and SEO',
  'shoe store local digital marketing',
  'luxury retail digital marketing strategy',
  'sustainable fashion brand marketing',
  'sports equipment store SEO',
  'furniture store local marketing',
  'toy store local SEO and holiday marketing',

  'car wash and detailing marketing automation',
  'motorcycle dealership digital marketing',
  'RV dealership SEO and content marketing',
  'tire shop local SEO and Google Ads',
  'auto body shop reputation management',
  'truck repair shop digital marketing',
  'electric vehicle service center marketing',
  'car rental local SEO',
  'limo and transportation service marketing',
  'rideshare integration marketing for local fleets',

  'winery social media and DTC marketing',
  'craft brewery local SEO and events',
  'distillery digital marketing and tourism',
  'farm-to-table restaurant marketing',
  'organic farm CSA marketing with email',
  'olive oil producer DTC digital marketing',
  'specialty coffee roaster online marketing',
  'honey and apiary product marketing',
  'artisan cheese maker digital marketing',
  'mushroom farm and specialty produce marketing',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function existingSlugs() {
  const slugs = new Set();
  for (const dir of [QUEUE_DIR, PUBLISHED_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const slug = f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.json$/, '');
      slugs.add(slug);
    }
  }
  return slugs;
}

function dateLabel(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── API call ────────────────────────────────────────────────────────────────

async function generateBatch(topics, publishDate, usedSlugs) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const dateStr   = isoDate(publishDate);
  const labelStr  = dateLabel(publishDate);

  const systemPrompt = `You are a senior content strategist at NetWebMedia, a digital growth agency for small and medium businesses. You write practical, opinionated blog posts that help business owners understand AI-powered marketing, local SEO, and digital growth.

Voice: direct, specific, first-person plural ("we"), uses real numbers and named examples, slightly opinionated, no fluff.

Return ONLY a valid JSON array of exactly ${topics.length} blog post objects. No markdown, no explanation, just the JSON array.

Each object must have exactly these fields:
- slug: URL-friendly string, lowercase, hyphens, no dates, 3-7 words
- topic: one of: "ai", "seo", "data", "code", "video", "voice", "paid", "creative", "sales"
- tag: 1-3 word display tag (e.g. "Local SEO", "AI Tools", "CRM", "Email Marketing")
- author: "Sofia Martínez"
- readTime: e.g. "6 min read"
- title: compelling, specific title (8-12 words)
- description: 1-2 sentence meta description, benefit-focused, under 160 chars
- sections: array of section objects. Each section object has exactly ONE of these keys:
  - {"p": "paragraph text"} — body paragraph
  - {"h2": "heading text"} — section heading
  - {"list": ["item 1", "item 2", "item 3"]} — bullet list
  - {"quote": "pull quote text"} — pull quote
  Structure: intro p, then 3-4 h2 sections each with 1-2 p, at least one list, one quote. Total 8-12 section objects.
- published: "${dateStr}"
- dateLabel: "${labelStr}"

Rules:
- Slugs must be unique and not in this list: ${JSON.stringify([...usedSlugs])}
- Content must be practical and specific — no vague generalities
- Include real percentages, timeframes, or examples in at least 2 paragraphs per post
- Each post must stand alone as genuinely useful content`;

  const userPrompt = `Generate ${topics.length} blog posts on these topics:\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  return JSON.parse(clean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(PUBLISHED_DIR)) fs.mkdirSync(PUBLISHED_DIR, { recursive: true });

  const used    = existingSlugs();
  const topics  = shuffle(TOPIC_POOL);
  let written   = 0;
  let topicIdx  = 0;

  // Figure out what date to start from
  // Use latest date already in queue, or START_DATE, whichever is later
  let currentDate = new Date(START_DATE);
  const queueFiles = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json') && /^\d{4}-\d{2}-\d{2}/.test(f));
  if (queueFiles.length > 0) {
    const latestFile = queueFiles.sort().pop();
    const latestDate = new Date(latestFile.slice(0, 10));
    if (latestDate >= currentDate) {
      currentDate = addDays(latestDate, 1);
    }
  }

  console.log(`Generating ${TARGET} posts starting from ${isoDate(currentDate)}...`);

  while (written < TARGET) {
    const remaining = TARGET - written;
    const batchSize = Math.min(BATCH_SIZE, remaining, topics.length - topicIdx);
    if (batchSize === 0) break;

    const batch = topics.slice(topicIdx, topicIdx + batchSize);
    topicIdx += batchSize;
    if (topicIdx >= topics.length) topicIdx = 0; // cycle if needed

    console.log(`  Batch ${Math.floor(written / BATCH_SIZE) + 1}: ${batch.length} posts for ${isoDate(currentDate)}...`);

    let posts;
    try {
      posts = await generateBatch(batch, currentDate, used);
    } catch (e) {
      console.error(`  Error in batch: ${e.message}`);
      // Wait and retry once
      await new Promise(r => setTimeout(r, 5000));
      try { posts = await generateBatch(batch, currentDate, used); }
      catch (e2) { console.error(`  Retry failed: ${e2.message}`); continue; }
    }

    for (const post of posts) {
      if (!post.slug || used.has(post.slug)) {
        console.warn(`  Skipping duplicate or invalid slug: ${post.slug}`);
        continue;
      }
      const filename = `${isoDate(currentDate)}-${post.slug}.json`;
      const filepath = path.join(QUEUE_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(post, null, 2) + '\n');
      used.add(post.slug);
      written++;
      console.log(`  ✓ ${filename}`);
    }

    // Advance date every 10 posts (10/day cadence)
    if (written % 10 === 0) {
      currentDate = addDays(currentDate, 1);
    }

    // Brief pause between API calls to be polite
    if (written < TARGET) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone. Generated ${written} posts.`);
  console.log(`Queue now has ${fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json')).length} pending posts.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
