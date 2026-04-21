// Replaces old abstract Unsplash photo IDs in blog posts with real people-at-work photos.
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const PEOPLE_POOL = [
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
];
const IMG_POOL = {
  ai: PEOPLE_POOL, code: PEOPLE_POOL, data: PEOPLE_POOL, seo: PEOPLE_POOL,
  video: PEOPLE_POOL, voice: PEOPLE_POOL, paid: PEOPLE_POOL, regulation: PEOPLE_POOL,
  mobile: PEOPLE_POOL, chips: PEOPLE_POOL, creative: PEOPLE_POOL, meta: PEOPLE_POOL,
  sales: PEOPLE_POOL,
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
  return `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`;
}

const BLOG_DIR = 'blog';
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let patched = 0;

for (const f of files) {
  const filePath = path.join(BLOG_DIR, f);
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already using verified CDN hashes from PEOPLE_POOL
  if (PEOPLE_POOL.some(id => html.includes('unsplash.com/photo-' + id))) continue;

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
