// Replace emoji + gradient blog covers with stock images from Unsplash.
// Uses a curated pool of topic-appropriate Unsplash photo IDs (stable URLs).
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

// Curated Unsplash photo IDs grouped by topic. These are stable, public-domain
// (Unsplash License) images. Any of them can ship as a stock cover.
const pool = {
  ai: [
    '1677442136019-21780ecad995', // robot / ai
    '1526374965328-7f61d4dc18c5', // matrix / code
    '1535378917042-10a22c95931a', // network
    '1620712943543-bcc4688e7485', // abstract ai
    '1655720828018-edd2daec9349', // robot hand
    '1485827404703-89b55fcc595e', // code / ai
    '1563089145-599997674d42', // ai brain
  ],
  code: [
    '1517694712202-14dd9538aa97', // code screen
    '1555066931-4365d14bab8c',    // code lines
    '1515879218367-8466d910aaa4', // terminal
    '1542831371-29b0f74f9713',    // laptop code
  ],
  data: [
    '1551288049-bebda4e38f71', // charts
    '1460925895917-afdab827c52f', // analytics dashboard
    '1543286386-713bdd548da4', // dashboard
    '1543286386-2e659306cd6c', // stats
  ],
  office: [
    '1497366216548-37526070297c', // modern office
    '1556761175-5973dc0f32e7', // meeting
    '1600880292089-90a7e086ee0c', // team
  ],
  seo: [
    '1432888498266-38ffec3eaf0a', // search magnifier
    '1533750349088-cd871a92f312', // seo metrics
    '1432821596592-e2c18b78144f', // growth
  ],
  video: [
    '1522869635100-9f4c5e86aa37', // camera
    '1598899134739-24c46f58b8c0', // video production
  ],
  voice: [
    '1590602847861-f357a9332bbc', // microphone
    '1598488035139-bdbb2231ce04', // headset
  ],
  paid: [
    '1460925895917-afdab827c52f', // analytics
    '1518186285589-2f7649de83e0', // money metrics
  ],
  regulation: [
    '1589829545856-d10d557cf95f', // scales of justice
    '1505664194779-8beaceb93744', // eu flag
  ],
  mobile: [
    '1512941937669-90a1b58e7e9c', // iphone
    '1511707171634-5f897ff02aa9', // phone design
  ],
  chips: [
    '1591799264318-7e6ef8ddb7ea', // chip macro
    '1518770660439-4636190af475', // circuit board
  ],
  creative: [
    '1572044162444-ad60f128bdea', // creative palette
    '1558655146-9f40138edfeb', // design
  ],
  meta: [
    '1611162617474-5b21e879e113', // meta/facebook
    '1563986768609-322da13575f3', // meta phone
  ],
  sales: [
    '1556761175-5973dc0f32e7', // sales meeting
    '1552664730-d307ca884978', // handshake
  ],
  books: [
    '1507842217343-583bb7270b66', // knowledge
    '1532012197267-da84d127e765', // library
  ],
};

// Map each blog slug to a topic.
const slugTopic = {
  'openai-reasoning-models-b2b': 'ai',
  'claude-computer-use-agentic-marketing': 'ai',
  'gemini-multimodal-seo-playbook': 'seo',
  'llama-open-weights-advantage': 'ai',
  'sora-video-ad-production-shakeup': 'video',
  'voice-ai-call-center': 'voice',
  'ai-coding-assistants-gold-rush': 'code',
  'answer-engine-wars': 'seo',
  'apple-intelligence-on-device': 'mobile',
  'meta-advantage-plus-black-box': 'meta',
  'enterprise-rag-2026': 'data',
  'eu-ai-act-us-impact': 'regulation',
  'nvidia-inference-cost-crater': 'chips',
  'small-language-models-quiet-revolution': 'ai',
  'ai-sdrs-booking-meetings': 'sales',
  'aeo-replaces-seo-2026': 'seo',
  'full-stack-marketing-agent-architecture': 'code',
  'google-ai-overviews-citation-game': 'seo',
  'claude-agent-sdk-developer-platform': 'code',
  'ai-creative-testing-cheap-fast-brutal': 'creative',
};

function hashSlug(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function imageFor(slug) {
  const topic = slugTopic[slug] || 'ai';
  const arr = pool[topic];
  const photoId = arr[hashSlug(slug) % arr.length];
  return `https://images.unsplash.com/photo-${photoId}?w=1200&q=80&auto=format&fit=crop`;
}

// --- Patch blog.html listing ---
let blog = fs.readFileSync('blog.html', 'utf8');
// Match either original gradient markup OR previously-patched image markup.
const cardRegex = /<div class="blog-card-img"[^>]*>[^<]*<\/div>\s*<div class="blog-card-body">[\s\S]*?<a href="blog\/([^"]+)\.html"/g;
let cardCount = 0;
blog = blog.replace(cardRegex, (match, slug) => {
  cardCount++;
  const url = imageFor(slug);
  return match.replace(
    /<div class="blog-card-img"[^>]*>[^<]*<\/div>/,
    `<div class="blog-card-img" style="background-image:url('${url}');background-size:cover;background-position:center;" role="img" aria-label="Cover image"></div>`
  );
});
fs.writeFileSync('blog.html', blog);
console.log('blog.html cards updated:', cardCount);

// --- Patch individual blog posts ---
const files = fs.readdirSync('blog').filter(f => f.endsWith('.html'));
let postCount = 0;
for (const f of files) {
  const full = path.join('blog', f);
  let html = fs.readFileSync(full, 'utf8');
  const slug = f.replace(/\.html$/, '');
  const url = imageFor(slug);
  const re = /<div class="article-cover"[^>]*>[^<]*<\/div>/;
  if (re.test(html)) {
    html = html.replace(
      re,
      `<div class="article-cover" style="background-image:url('${url}');background-size:cover;background-position:center;" role="img" aria-label="Article cover"></div>`
    );
    fs.writeFileSync(full, html);
    postCount++;
  } else {
    console.log('no match:', f);
  }
}
console.log('blog posts updated:', postCount);
