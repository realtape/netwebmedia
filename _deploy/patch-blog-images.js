// Replaces old abstract Unsplash photo IDs in blog posts with real people-at-work photos.
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const MIXED_POOL = [
  '1758762641372-e3b52bf061d4',
  '1522071820081-009f0129c71c',
  '1542744173-8e7e53415bb0',
  '1758691737568-a1572060ce5a',
  '1748256373165-e4d125c5124f',
  '1758691736424-4b4273948341',
  '1702047063975-0841a0621b5a',
  '1758876022088-2d46af5635c2',
  '1690264695514-3af95dfa51be',
  '1690264697065-33256aa3729b',
  '1713947501966-34897f21162e',
  '1762330467475-a565d04e1808',
  '1762330465857-07e4c81c0dfa',
  '1757310998648-f8aaa5572e8e',
  '1762328862557-e0a36587cd3c',
  '1551288049-bebda4e38f71',
  '1526628953301-3e589a6a8b74',
  '1560472354-b33ff0c44a43',
  '1666875753105-c63a6f3bdc86',
  '1460925895917-afdab827c52f',
  '1517694712202-14dd9538aa97',
  '1526374965328-7f61d4dc18c5',
  '1432888498266-38ffec3eaf0a',
];
const IMG_POOL = {
  ai: MIXED_POOL, code: MIXED_POOL, data: MIXED_POOL, seo: MIXED_POOL,
  video: MIXED_POOL, voice: MIXED_POOL, paid: MIXED_POOL, regulation: MIXED_POOL,
  mobile: MIXED_POOL, chips: MIXED_POOL, creative: MIXED_POOL, meta: MIXED_POOL,
  sales: MIXED_POOL,
};

const TAG_TO_TOPIC = {
  'seo': 'seo', 'aeo': 'seo', 'seo & aeo': 'seo', 'seo strategy': 'seo', 'seo &amp; aeo': 'seo',
  'paid media': 'paid', 'paid ads': 'paid',
  'analytics': 'data', 'data': 'data',
  'ai tools': 'ai', 'ai strategy': 'ai', 'ai creative': 'creative',
  'content strategy': 'creative', 'creative': 'creative', 'brand strategy': 'creative',
  'conversational ai': 'voice', 'voice': 'voice',
  'marketing ops': 'code', 'automation': 'code',
  'competitive strategy': 'data', 'sales ai': 'sales',
  'social media': 'meta', 'video': 'video', 'mobile': 'mobile',
};

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h; }

function imageFor(slug, topic) {
  const pool = IMG_POOL[topic] || IMG_POOL.ai;
  const id = pool[hash(slug) % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
}

const BLOG_DIR = 'blog';
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let patched = 0;

for (const f of files) {
  const filePath = path.join(BLOG_DIR, f);
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already using verified CDN hashes from MIXED_POOL
  if (MIXED_POOL.some(id => html.includes('unsplash.com/photo-' + id))) continue;

  const slug = f.replace(/\.html$/, '');

  // Extract tag to determine topic
  const tagMatch = html.match(/<div class="tag">([^<]+)<\/div>/);
  const tag = tagMatch ? tagMatch[1].toLowerCase().trim() : '';
  const topic = TAG_TO_TOPIC[tag] || 'ai';

  const newImg = imageFor(slug, topic);

  // Replace all Unsplash URLs regardless of format (photo- numeric, slug, etc.)
  html = html.replace(/https:\/\/images\.unsplash\.com\/[^?'"]+\?[^'"]+/g, newImg);

  fs.writeFileSync(filePath, html);
  patched++;
  console.log(`~ ${slug} (${tag} → ${topic})`);
}

console.log(`\nPatched images in ${patched} files.`);
