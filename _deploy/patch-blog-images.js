// Replaces old abstract Unsplash photo IDs in blog posts with real people-at-work photos.
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const IMG_POOL = {
  ai:         ['Ds5FesTkKhk','QckxruozjRg','3SxHV8OJEnQ','gMsnXqILjp4','YyJNda7nsPo'],
  code:       ['1ozhKlzsEzg','SxaGgDQl2rU','M35xxKGb_tA','hXwm85W3uvc','OpOsPgGiFwc'],
  data:       ['3SxHV8OJEnQ','Ds5FesTkKhk','zZ7J5qri6qY','MsCIMdM8WH8','QckxruozjRg'],
  seo:        ['gMsnXqILjp4','YyJNda7nsPo','_RPfBzHpHEs','xuSRrlDsJtQ','OpOsPgGiFwc'],
  video:      ['zZ7J5qri6qY','hXwm85W3uvc','M35xxKGb_tA','gMsnXqILjp4','Ds5FesTkKhk'],
  voice:      ['xuSRrlDsJtQ','_RPfBzHpHEs','YyJNda7nsPo','QckxruozjRg','SxaGgDQl2rU'],
  paid:       ['OpOsPgGiFwc','MsCIMdM8WH8','3SxHV8OJEnQ','gMsnXqILjp4','zZ7J5qri6qY'],
  regulation: ['SxaGgDQl2rU','xuSRrlDsJtQ','hXwm85W3uvc','Ds5FesTkKhk','YyJNda7nsPo'],
  mobile:     ['_RPfBzHpHEs','QckxruozjRg','M35xxKGb_tA','OpOsPgGiFwc','1ozhKlzsEzg'],
  chips:      ['MsCIMdM8WH8','3SxHV8OJEnQ','zZ7J5qri6qY','SxaGgDQl2rU','gMsnXqILjp4'],
  creative:   ['YyJNda7nsPo','hXwm85W3uvc','xuSRrlDsJtQ','Ds5FesTkKhk','_RPfBzHpHEs'],
  meta:       ['1ozhKlzsEzg','OpOsPgGiFwc','QckxruozjRg','MsCIMdM8WH8','zZ7J5qri6qY'],
  sales:      ['gMsnXqILjp4','_RPfBzHpHEs','hXwm85W3uvc','3SxHV8OJEnQ','xuSRrlDsJtQ'],
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

  // Skip if already using new slug-based IDs (no /photo- pattern)
  if (!html.includes('unsplash.com/photo-')) continue;

  const slug = f.replace(/\.html$/, '');

  // Extract tag to determine topic
  const tagMatch = html.match(/<div class="tag">([^<]+)<\/div>/);
  const tag = tagMatch ? tagMatch[1].toLowerCase().trim() : '';
  const topic = TAG_TO_TOPIC[tag] || 'ai';

  const newImg = imageFor(slug, topic);

  // Replace all old photo- URLs (article hero + og:image + twitter:image)
  html = html.replace(/https:\/\/images\.unsplash\.com\/photo-[^?'"]+\?[^'"]+/g, newImg);

  fs.writeFileSync(filePath, html);
  patched++;
  console.log(`~ ${slug} (${tag} → ${topic})`);
}

console.log(`\nPatched images in ${patched} files.`);
