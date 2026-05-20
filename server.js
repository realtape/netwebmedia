const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const root = __dirname;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

// Mock API data for local preview
const MOCK_COURSES = {
  items: [
    { id:1, slug:"crm-mastery", name:"CRM Mastery", tagline:"Master customer relationship management from day one", icon:"🎯", color:"#6c5ce7", level:"Beginner", status:"published", lesson_count:12, active_students:234, avg_completion:71, description:"Complete CRM training for modern sales teams." },
    { id:2, slug:"digital-marketing-101", name:"Digital Marketing 101", tagline:"Build campaigns that convert visitors into paying clients", icon:"📣", color:"#FF671F", level:"Beginner", status:"published", lesson_count:8, active_students:187, avg_completion:58, description:"Full-funnel digital marketing fundamentals." },
    { id:3, slug:"ai-for-business", name:"AI for Business", tagline:"Leverage artificial intelligence to automate your growth", icon:"🤖", color:"#00b894", level:"Intermediate", status:"published", lesson_count:15, active_students:312, avg_completion:44, description:"Practical AI applications for SMB owners." },
    { id:4, slug:"seo-fundamentals", name:"SEO Fundamentals", tagline:"Rank higher and drive organic traffic at scale", icon:"🔍", color:"#fdcb6e", level:"Beginner", status:"published", lesson_count:10, active_students:156, avg_completion:62, description:"Technical and content SEO from scratch." },
    { id:5, slug:"sales-pipeline", name:"Sales Pipeline Pro", tagline:"Close more deals with a repeatable pipeline system", icon:"💼", color:"#a29bfe", level:"Advanced", status:"published", lesson_count:9, active_students:98, avg_completion:39, description:"High-performance B2B and B2C sales pipelines." },
    { id:6, slug:"social-media-growth", name:"Social Media Growth", tagline:"Grow your audience and turn followers into revenue", icon:"📱", color:"#e17055", level:"Intermediate", status:"published", lesson_count:11, active_students:271, avg_completion:55, description:"Organic and paid social strategies." },
  ]
};
const MOCK_PROGRESS = {
  enrollments: [
    { course_id:1, progress_percent:72, completed_lessons:9, total_lessons:12 },
    { course_id:3, progress_percent:20, completed_lessons:3, total_lessons:15 },
  ]
};
const MOCK_ME = { id:1, name:"Carlos Martinez", email:"carlos@netwebmedia.com", role:"admin", type:"admin" };

function mockApi(urlPath, response) {
  const clean = urlPath.split('?')[0];
  if (clean === '/api/auth/me') { return json(response, 200, MOCK_ME); }
  if (clean === '/api/courses/progress') { return json(response, 200, MOCK_PROGRESS); }
  if (clean === '/api/courses') { return json(response, 200, MOCK_COURSES); }
  return false;
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*' });
  res.end(JSON.stringify(obj));
  return true;
}

http
  .createServer((request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Headers':'*',
        'Access-Control-Allow-Methods':'GET, OPTIONS',
        'Access-Control-Allow-Private-Network':'true',
      });
      response.end(); return;
    }
    if (request.url.startsWith('/api/')) { if (mockApi(request.url, response)) return; }
    const urlPath = request.url === "/" ? "/index.html" : request.url;
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Private-Network": "true",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy":
          "accelerometer=(), camera=(), geolocation=(), gyroscope=(), " +
          "magnetometer=(), microphone=(), payment=(), usb=()",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: https://flagcdn.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; " +
          "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "cross-origin",
      });
      response.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`NetWebMedia preview server running at http://${host}:${port}`);
  });
