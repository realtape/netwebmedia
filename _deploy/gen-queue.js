// _deploy/gen-queue.js
// Generates a fresh blog-post queue (N days × 20 posts) and writes _deploy/queue.json
// Usage: node _deploy/gen-queue.js [days]   (default 7 days => 140 posts)

const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const DAYS = parseInt(process.argv[2] || '7', 10);
const PER_DAY = 20;
const TOTAL = DAYS * PER_DAY;

const AUTHORS = [
  'Ana González','David Kim','Valentina Ruiz','Marcus Chen','Sofia Martínez',
  'Isabella Torres','Carlos Rivera','Noah Williams','Elena Vázquez','Priya Patel'
];
const READ_TIMES = ['5 min read','6 min read','7 min read','8 min read','9 min read'];

// Topic pools — slug-friendly, each produces variants
const TOPICS = [
  { key:'ai',   tag:'AI Research',  themes:[
    'autonomous-agent','multi-modal-reasoning','context-window','open-source-llm',
    'reasoning-tokens','model-distillation','synthetic-data','safety-benchmarks',
    'enterprise-llm','agentic-pipelines'
  ]},
  { key:'code', tag:'AI Architecture', themes:[
    'mcp-integration','vector-database','rag-pipeline','prompt-caching',
    'llm-observability','guardrails','evaluation-framework','function-calling',
    'agent-orchestration','streaming-inference'
  ]},
  { key:'seo',  tag:'AEO & SEO', themes:[
    'answer-engine-optimization','perplexity-citations','chatgpt-search-ranking',
    'gemini-discover','bing-copilot','entity-graph','ai-overview-serp',
    'schema-structured-data','topical-authority','intent-coverage'
  ]},
  { key:'sales',tag:'Revenue Ops', themes:[
    'ai-sdr','pipeline-forecasting','lead-scoring','intent-signals',
    'outbound-sequencing','deal-coaching','revenue-attribution',
    'abm-playbook','renewal-prediction','churn-signals'
  ]},
  { key:'paid', tag:'Paid Media', themes:[
    'ppc-automation','smart-bidding','creative-testing','meta-advantage-plus',
    'tiktok-symphony','reddit-ads','pmax-insights','linkedin-conversion-api',
    'broad-match-intent','server-side-tracking'
  ]},
  { key:'creative', tag:'Creative AI', themes:[
    'brand-consistent-imagery','video-generation','voice-cloning',
    'ad-creative-variants','product-photography','3d-mockups',
    'storyboard-automation','ugc-synthesis','shorts-at-scale','hero-video-ai'
  ]},
  { key:'data', tag:'Analytics', themes:[
    'first-party-data','customer-data-platform','server-side-events',
    'ai-segmentation','mixed-media-modeling','attribution-model',
    'cohort-analysis','ltv-prediction','data-activation','reverse-etl'
  ]},
  { key:'voice', tag:'AI Agents', themes:[
    'voice-agent','phone-sdr','ai-receptionist','realtime-conversation',
    'multilingual-voice','emotion-detection','call-summary','ivr-replacement',
    'voice-commerce','voice-search-seo'
  ]},
  { key:'video',tag:'Video AI', themes:[
    'runway-gen4','pika-labs','sora-enterprise','luma-dream','synthesia-avatars',
    'captions-localization','b-roll-generation','shorts-virality','ai-editing',
    'youtube-algorithm-ai'
  ]},
  { key:'regulation', tag:'AI Policy', themes:[
    'eu-ai-act','state-ai-laws','fcc-ai-robocalls','ftc-ai-guidance',
    'ai-watermarking','deepfake-regulation','model-transparency',
    'data-privacy-2026','copyright-ai-training','disclosure-requirements'
  ]},
  { key:'mobile', tag:'Apps & Mobile', themes:[
    'apple-intelligence','android-gemini','on-device-ai','siri-shortcuts-ai',
    'app-clip-ai','notification-summarization','ai-widgets','mobile-agent',
    'privacy-preserving-llm','edge-inference'
  ]},
  { key:'chips', tag:'Infrastructure', themes:[
    'nvidia-blackwell','groq-lpu','cerebras-wafer','google-tpu-v6',
    'aws-trainium','amd-mi350','inference-costs','quantization',
    'kv-cache','speculative-decoding'
  ]},
  { key:'meta', tag:'Platforms', themes:[
    'meta-llama-5','whatsapp-ai-business','instagram-ai-creators',
    'threads-algorithm','youtube-creator-ai','tiktok-search-ads',
    'x-grok-integration','linkedin-ai-posts','reddit-ama-ai','discord-agents'
  ]}
];

function pick(arr, n) { return arr[n % arr.length]; }
function hashInt(s) { let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = (h*16777619) & 0xffffffff; } return h & 0x7fffffff; }
function titleCase(s) { return s.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }
function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Year cycle + angle cycle produce unique slug combinations so we can generate 140+ unique posts.
const ANGLES = [
  'playbook','benchmark','deep-dive','roi-breakdown','implementation-guide',
  'case-study','compared','what-changed','why-it-matters','enterprise-adoption',
  'for-marketers','for-agencies','for-ecommerce','for-b2b','2026-update',
  'pricing-shift','quality-review','workflow','stack','vs-legacy'
];

function mkTitle(topic, theme, angle) {
  const T = titleCase(theme);
  const A = titleCase(angle);
  const variants = [
    `${T}: The ${A} for Marketing Teams`,
    `How ${T} Is Reshaping ${topic.tag} in 2026`,
    `${T} — ${A}`,
    `The 2026 ${T} ${A}`,
    `${T}: A ${A} for US Brands`,
    `Inside ${T}: ${A} and ROI`,
    `${T} vs. the Old Playbook — a ${A}`
  ];
  return variants[(hashInt(theme+angle) % variants.length)];
}

function mkDescription(theme, topic) {
  const T = titleCase(theme);
  const pool = [
    `A clear, ROI-focused look at ${T.toLowerCase()} — how leading US brands are deploying it across ${topic.tag.toLowerCase()} stacks in 2026.`,
    `What ${T.toLowerCase()} actually changes for marketing operators, with budget benchmarks, vendor tradeoffs, and a 30-day implementation path.`,
    `NetWebMedia breaks down ${T.toLowerCase()}: what works, what's hype, and where to place bets this quarter.`,
    `An operator's guide to ${T.toLowerCase()} — pricing, integrations, measurement, and common failure modes.`
  ];
  return pool[hashInt(theme) % pool.length];
}

function para(seed) {
  // Generate a paragraph deterministically — mix of 3 sentence pools.
  const S1 = [
    `The shift toward agentic workflows has accelerated faster than most CMOs planned for.`,
    `Revenue teams that used to ship one campaign a week now ship thirty, with a fraction of the headcount.`,
    `The winners this year are brands that treat AI not as a feature, but as a layer underneath every marketing motion.`,
    `Every vendor claims AI — but only a handful meaningfully change the unit economics of a marketing team.`,
    `2026 is the year the "AI-native" label stops being marketing and starts being architecture.`
  ];
  const S2 = [
    `Operators who paired structured data with a good retrieval layer saw response quality jump almost overnight.`,
    `The teams that moved first on orchestration now run 3-5× the volume with half the freelance spend.`,
    `Cost-per-acquisition compressed 18-42% for early adopters across paid social, paid search, and lifecycle.`,
    `Measurement still lags the technology — but modern attribution catches up when you pipe events server-side.`,
    `Brand consistency, not speed, became the real moat once everyone could generate assets in minutes.`
  ];
  const S3 = [
    `The practical takeaway: invest in the pipes before the models, and the models before the prompts.`,
    `NetWebMedia's internal benchmark: a properly deployed agent stack pays for itself in about 45 days.`,
    `That's the difference between "using AI" and "running on AI" — and it's now visible on the P&L.`,
    `If you haven't audited your stack this quarter, you're measurably behind your closest three competitors.`,
    `The highest-ROI move isn't a new tool — it's stitching the ones you already own into a single agent loop.`
  ];
  const h = hashInt(seed);
  return `${S1[h % S1.length]} ${S2[(h>>3) % S2.length]} ${S3[(h>>6) % S3.length]}`;
}

function makePost(slug, topic, theme, angle, idx) {
  const title = mkTitle(topic, theme, angle);
  const description = mkDescription(theme, topic);
  const author = pick(AUTHORS, idx + hashInt(slug));
  const readTime = pick(READ_TIMES, hashInt(slug) >> 2);
  const tag = topic.tag;
  const sections = [
    { p: para(slug + '-intro') },
    { h2: `Why ${titleCase(theme)} Matters Right Now` },
    { p: para(slug + '-why-1') },
    { p: para(slug + '-why-2') },
    { h2: 'What Leading US Brands Are Actually Doing' },
    { list: [
      `Treating ${titleCase(theme).toLowerCase()} as infrastructure — not a feature toggle.`,
      `Measuring in dollars, not impressions — revenue attribution rebuilt server-side.`,
      `Shrinking vendor sprawl — consolidating to a 3-tool core.`,
      `Rewriting creative briefs so AI workflows can execute them end-to-end.`,
      `Putting an agent on every recurring marketing task longer than 20 minutes.`
    ]},
    { h2: 'A 30-Day Implementation Plan' },
    { olist: [
      `Week 1: Audit the existing stack. Flag every tool with <40% monthly active usage.`,
      `Week 2: Stand up the retrieval layer — brand docs, product catalog, historical campaigns.`,
      `Week 3: Ship one agent end-to-end in production with an owner and a success metric.`,
      `Week 4: Kill two tools. Rewrite the KPI dashboard. Lock the new workflow.`
    ]},
    { h2: 'What Usually Goes Wrong' },
    { p: para(slug + '-wrong-1') },
    { quote: `Most teams don't have an AI problem — they have a workflow problem that AI will expose at ten times the speed.` },
    { p: para(slug + '-wrong-2') },
    { h2: 'The NetWebMedia Take' },
    { p: para(slug + '-nwm') }
  ];
  return { slug, topic: topic.key, tag, author, readTime, title, description, sections };
}

const posts = [];
const seenSlugs = new Set();
let i = 0;
let safety = 0;
while (posts.length < TOTAL && safety < TOTAL * 5) {
  const topic = TOPICS[i % TOPICS.length];
  const theme = topic.themes[(Math.floor(i / TOPICS.length)) % topic.themes.length];
  const angle = ANGLES[(i * 7) % ANGLES.length];
  const slug = `${theme}-${angle}`.replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').slice(0, 70);
  if (!seenSlugs.has(slug)) {
    seenSlugs.add(slug);
    posts.push(makePost(slug, topic, theme, angle, i));
  }
  i++; safety++;
}

const outFile = path.join('_deploy', 'queue-generated.json');
fs.writeFileSync(outFile, JSON.stringify(posts, null, 2));
console.log(`Wrote ${posts.length} posts -> ${outFile} (${fs.statSync(outFile).size} bytes)`);
