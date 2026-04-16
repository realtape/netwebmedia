/* Build api-php/seed-data.json from CMS + CRM mock data.
   Run: node _deploy/build-seed.js  */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CMS_DATA_JS = path.join(ROOT, 'cms', 'js', 'data.js');
const CRM_DATA_JS = path.join(ROOT, 'app', 'js', 'data.js');
const OUT = path.join(ROOT, 'api-php', 'seed-data.json');

function loadData(file, globalVarName) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox[globalVarName];
}

const CMS = loadData(CMS_DATA_JS, 'CMS_DATA');
const CRM = loadData(CRM_DATA_JS, 'CRM_DATA');

const rows = [];

// --- CMS ---------------------------------------------------------------
(CMS.pages || []).forEach(p => {
  rows.push({
    type: 'page',
    slug: p.slug,
    title: p.title,
    status: p.status || 'active',
    data: p,
  });
});

(CMS.blogRecent || []).forEach(p => {
  rows.push({
    type: 'blog_post',
    slug: p.slug,
    title: p.title,
    status: 'published',
    data: p,
  });
});

(CMS.landingPages || []).forEach(lp => {
  rows.push({
    type: 'landing_page',
    slug: lp.slug,
    title: lp.title,
    status: lp.status || 'active',
    data: lp,
  });
});

(CMS.forms || []).forEach(f => {
  rows.push({
    type: 'form',
    slug: f.id,
    title: f.name,
    status: 'active',
    data: f,
  });
});

(CMS.templates || []).forEach(t => {
  rows.push({
    type: 'template',
    slug: t.id,
    title: t.name,
    status: 'active',
    data: t,
  });
});

(CMS.abTests || []).forEach(ab => {
  rows.push({
    type: 'ab_test',
    slug: ab.id,
    title: ab.name,
    status: ab.status || 'running',
    data: ab,
  });
});

(CMS.memberships || []).forEach(m => {
  rows.push({
    type: 'membership',
    slug: m.id,
    title: m.name,
    status: 'active',
    data: m,
  });
});

(CMS.workflows || []).forEach(w => {
  rows.push({
    type: 'workflow',
    slug: (w.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title: w.name,
    status: w.active ? 'active' : 'paused',
    data: w,
  });
});

(CMS.media || []).forEach(m => {
  rows.push({
    type: 'media',
    slug: m.name,
    title: m.name,
    status: 'active',
    data: m,
  });
});

(CMS.seoKeywords || []).forEach(k => {
  rows.push({
    type: 'seo_keyword',
    slug: (k.keyword || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title: k.keyword,
    status: 'tracking',
    data: k,
  });
});

// Stash the "singletons" (blogQueue, seoAudit, stats, templateCounts, trafficDaily, recentActivity)
// as individual settings rows so the CMS can read them back via GET /api/resources/setting.
rows.push({ type: 'setting', slug: 'cms.stats',           title: 'CMS Stats',            status: 'active', data: CMS.stats || {} });
rows.push({ type: 'setting', slug: 'cms.blog_queue',      title: 'Blog Publish Queue',   status: 'active', data: CMS.blogQueue || {} });
rows.push({ type: 'setting', slug: 'cms.seo_audit',       title: 'SEO Audit',            status: 'active', data: CMS.seoAudit || [] });
rows.push({ type: 'setting', slug: 'cms.template_counts', title: 'Template Counts',      status: 'active', data: CMS.templateCounts || {} });
rows.push({ type: 'setting', slug: 'cms.traffic_daily',   title: 'Traffic (Daily)',      status: 'active', data: CMS.trafficDaily || [] });
rows.push({ type: 'setting', slug: 'cms.recent_activity', title: 'Recent CMS Activity',  status: 'active', data: CMS.recentActivity || [] });

// --- CRM ---------------------------------------------------------------
(CRM.contacts || []).forEach(c => {
  rows.push({
    type: 'contact',
    slug: 'contact-' + c.id,
    title: c.name,
    status: c.status || 'lead',
    data: c,
  });
});

(CRM.deals || []).forEach(d => {
  rows.push({
    type: 'deal',
    slug: 'deal-' + d.id,
    title: d.title,
    status: (d.stage || 'new').toLowerCase().replace(/\s+/g, '_'),
    data: d,
  });
});

(CRM.conversations || []).forEach(c => {
  rows.push({
    type: 'conversation',
    slug: 'conv-' + c.id,
    title: c.subject,
    status: c.unread ? 'unread' : 'read',
    data: c,
  });
});

(CRM.calendarEvents || []).forEach(e => {
  rows.push({
    type: 'calendar_event',
    slug: 'event-' + e.id,
    title: e.title,
    status: 'scheduled',
    data: e,
  });
});

(CRM.teamMembers || []).forEach(m => {
  rows.push({
    type: 'team_member',
    slug: (m.email || m.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title: m.name,
    status: m.status || 'active',
    data: m,
  });
});

rows.push({ type: 'setting', slug: 'crm.stats',          title: 'CRM Stats',          status: 'active', data: CRM.stats || {} });
rows.push({ type: 'setting', slug: 'crm.pipeline_stages',title: 'CRM Pipeline Stages',status: 'active', data: CRM.pipelineStages || [] });
rows.push({ type: 'setting', slug: 'crm.revenue_data',   title: 'CRM Revenue (Monthly)',status: 'active', data: CRM.revenueData || [] });
rows.push({ type: 'setting', slug: 'crm.schedule_today', title: 'CRM Today Schedule', status: 'active', data: CRM.scheduleToday || [] });

// ---------------------------------------------------------------------
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));

const byType = rows.reduce((acc, r) => (acc[r.type] = (acc[r.type] || 0) + 1, acc), {});
console.log('Wrote', rows.length, 'rows →', OUT);
Object.keys(byType).sort().forEach(t => console.log('  ' + t.padEnd(20), byType[t]));
