/* ============================================
   Alerta Comunidad - Backend API Server
   Express + in-memory store (swap for DB in prod)
   ============================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const REPORT_EXPIRY_HOURS = 4;

// In-memory store (replace with database for production)
let reports = [];

// MIME types for static file serving
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function cleanExpiredReports() {
  const cutoff = Date.now() - REPORT_EXPIRY_HOURS * 3600000;
  reports = reports.filter(r => r.timestamp > cutoff && !r.expired);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/reports' && req.method === 'GET') {
    cleanExpiredReports();

    // Optional: filter by bounding box
    const lat = parseFloat(url.searchParams.get('lat'));
    const lng = parseFloat(url.searchParams.get('lng'));
    const radius = parseFloat(url.searchParams.get('radius')) || 10;

    let filtered = reports;
    if (!isNaN(lat) && !isNaN(lng)) {
      filtered = reports.filter(r => {
        const dist = haversine(lat, lng, r.lat, r.lng);
        return dist <= radius;
      });
    }

    return sendJson(res, 200, filtered);
  }

  if (pathname === '/api/reports' && req.method === 'POST') {
    try {
      const body = await parseBody(req);

      // Validate required fields
      if (!body.type || !body.lat || !body.lng) {
        return sendJson(res, 400, { error: 'Missing required fields: type, lat, lng' });
      }

      // Sanitize
      const report = {
        id: body.id || (Date.now().toString(36) + Math.random().toString(36).substr(2, 9)),
        type: String(body.type).slice(0, 20),
        description: body.description ? String(body.description).slice(0, 280) : '',
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng),
        severity: String(body.severity || 'unknown').slice(0, 10),
        timestamp: Date.now(),
        confirmations: 0,
        denials: 0,
      };

      reports.push(report);
      console.log(`[${new Date().toISOString()}] New report: ${report.type} at ${report.lat},${report.lng}`);

      return sendJson(res, 201, report);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  // Confirm/deny a report
  const confirmMatch = pathname.match(/^\/api\/reports\/([^/]+)\/confirm$/);
  if (confirmMatch && req.method === 'POST') {
    const id = confirmMatch[1];
    const body = await parseBody(req);
    const report = reports.find(r => r.id === id);

    if (!report) {
      return sendJson(res, 404, { error: 'Report not found' });
    }

    if (body.confirmed) {
      report.confirmations = (report.confirmations || 0) + 1;
      report.lastConfirmed = Date.now();
    } else {
      report.denials = (report.denials || 0) + 1;
      if (report.denials >= 3) {
        report.expired = true;
      }
    }

    return sendJson(res, 200, report);
  }

  // Health check
  if (pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      reports: reports.length,
      uptime: process.uptime(),
    });
  }

  // Static file serving
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStatic(res, filePath);
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Clean expired reports every 5 minutes
setInterval(cleanExpiredReports, 5 * 60000);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🛡️  Alerta Comunidad Server           ║
  ║   Running on http://localhost:${PORT}      ║
  ║   Community Safety Alert Network         ║
  ╚══════════════════════════════════════════╝
  `);
});
