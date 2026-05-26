// Retries the one failed lesson: ai-automate course 3, lesson 4
const fs = require('fs');
const path = require('path');

const BASE = 'https://netwebmedia.com';
const EMAIL = 'admin@netwebmedia.com';
const PASS = 'NetWebAdmin2026!';

async function main() {
  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS })
  });
  const { token } = await loginRes.json();
  console.log('Token obtained');

  const courseData = JSON.parse(fs.readFileSync(path.join(__dirname, 'ai-automate.json'), 'utf8'));
  const lesson = courseData.lessons.find(l => l.order_index === 4);
  console.log('Posting:', lesson.title);

  const res = await fetch(`${BASE}/api/courses/${courseData.course_id}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
    body: JSON.stringify(lesson)
  });
  const d = await res.json();
  console.log('Result:', JSON.stringify(d).substring(0, 200));
}

main().catch(e => console.error('Fatal:', e));
