// Run: node _lessons/post-lessons.js
// Outputs a browser-injectable JS string to post all lessons via /api/courses/{id}/lessons
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

if (!files.length) { console.log('No JSON files found in _lessons/'); process.exit(1); }

const allData = [];
for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (data.course_id && data.lessons) allData.push(data);
    else console.warn('Skipping', f, '— missing course_id or lessons');
  } catch(e) { console.warn('Bad JSON in', f, e.message); }
}

console.log(`Loaded ${allData.length} courses, ${allData.reduce((s,d)=>s+d.lessons.length,0)} lessons total`);

// Write browser-injectable script
const browserScript = `
(function() {
  var token = localStorage.getItem('nwm_token');
  var allCourses = ${JSON.stringify(allData)};
  var results = [];
  var courseIdx = 0;
  var lessonIdx = 0;

  function postNext() {
    if (courseIdx >= allCourses.length) {
      window.__lessonPostResults = results;
      var ok = results.filter(r=>r.ok).length;
      var fail = results.filter(r=>!r.ok).length;
      console.log('DONE — ' + ok + ' posted, ' + fail + ' failed');
      console.log('Failed:', JSON.stringify(results.filter(r=>!r.ok)));
      return;
    }
    var course = allCourses[courseIdx];
    if (lessonIdx >= course.lessons.length) { courseIdx++; lessonIdx = 0; postNext(); return; }
    var lesson = course.lessons[lessonIdx];
    lessonIdx++;
    fetch('/api/courses/' + course.course_id + '/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify(lesson)
    }).then(r=>r.json()).then(function(d) {
      results.push({ course_id: course.course_id, slug: course.slug, lesson: lesson.title, ok: !d.error, id: d.id, err: d.error||null });
      postNext();
    }).catch(function(e) {
      results.push({ course_id: course.course_id, slug: course.slug, lesson: lesson.title, ok: false, err: e.message });
      postNext();
    });
  }

  console.log('Posting ' + allCourses.reduce(function(s,c){return s+c.lessons.length;},0) + ' lessons across ' + allCourses.length + ' courses...');
  postNext();
})();
`;

const outPath = path.join(__dirname, 'browser-inject.js');
fs.writeFileSync(outPath, browserScript, 'utf8');
console.log('Written to _lessons/browser-inject.js');
console.log('Run node _lessons/post-lessons.js then inject the content of browser-inject.js into the browser console');
