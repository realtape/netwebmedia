// Posts all lessons directly to the live API using node's built-in fetch (Node 18+)
// Run: node _lessons/post-direct.js
const fs = require('fs');
const path = require('path');

const BASE = 'https://netwebmedia.com';
const EMAIL = 'admin@netwebmedia.com';
const PASS = 'NetWebAdmin2026!';

const dir = path.join(__dirname);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'package.json');

async function main() {
  // 1. Login
  console.log('Logging in...');
  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS })
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('Login failed:', JSON.stringify(loginData));
    process.exit(1);
  }
  const token = loginData.token;
  console.log('Logged in OK, token obtained.');

  // 2. Load all lesson files
  const allData = [];
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (data.course_id && data.lessons) allData.push(data);
      else console.warn('Skipping', f, '— missing course_id or lessons');
    } catch(e) { console.warn('Bad JSON in', f, e.message); }
  }
  const totalLessons = allData.reduce((s, d) => s + d.lessons.length, 0);
  console.log(`Loaded ${allData.length} courses, ${totalLessons} lessons total\n`);

  // 3. Post lessons sequentially
  let posted = 0, failed = 0;
  for (const course of allData) {
    console.log(`\n--- Course ${course.course_id} (${course.slug}): ${course.lessons.length} lessons ---`);
    for (const lesson of course.lessons) {
      try {
        const res = await fetch(`${BASE}/api/courses/${course.course_id}/lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token
          },
          body: JSON.stringify(lesson)
        });
        const d = await res.json();
        if (d.error) {
          console.log(`  FAIL [${lesson.order_index}] "${lesson.title}": ${d.error}`);
          failed++;
        } else {
          console.log(`  OK   [${lesson.order_index}] "${lesson.title}" → id=${d.id}`);
          posted++;
        }
      } catch(e) {
        console.log(`  ERR  [${lesson.order_index}] "${lesson.title}": ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\n============================`);
  console.log(`DONE: ${posted} posted, ${failed} failed`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
