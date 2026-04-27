"""Patch crm-vanilla/js/marketing.js to wire real APIs (run from repo root)."""
import sys, os

src = 'crm-vanilla/js/marketing.js'

with open(src, 'r', encoding='utf-8') as f:
    txt = f.read()

original = txt
changed = []

# 1. Replace EMAIL_CAMPAIGNS hardcoded array
old1 = """  var EMAIL_CAMPAIGNS = [
    { name: "Spring Promo Launch", status: "active", sent: 4250, opens: 1870, clicks: 425, date: "Apr 8, 2026" },
    { name: "Newsletter - April", status: "completed", sent: 3800, opens: 1520, clicks: 342, date: "Apr 1, 2026" },
    { name: "Product Update Announce", status: "active", sent: 2100, opens: 987, clicks: 198, date: "Apr 10, 2026" },
    { name: "Customer Win-Back", status: "draft", sent: 0, opens: 0, clicks: 0, date: "Apr 12, 2026" },
    { name: "Webinar Invitation", status: "completed", sent: 5600, opens: 2688, clicks: 784, date: "Mar 25, 2026" },
    { name: "Case Study Blast", status: "draft", sent: 0, opens: 0, clicks: 0, date: "Apr 14, 2026" }
  ];"""
new1 = """  var EMAIL_CAMPAIGNS = [];   // loaded via API
  var emailCampaignsLoaded = false;"""
if old1 in txt:
    txt = txt.replace(old1, new1)
    changed.append('EMAIL_CAMPAIGNS')

# 2. Replace SMS_CAMPAIGNS hardcoded array
old2 = """  var SMS_CAMPAIGNS = [
    { name: "Flash Sale Alert", status: "completed", sent: 1200, replies: 89, optOuts: 3, date: "Apr 5, 2026" },
    { name: "Appointment Reminders", status: "active", sent: 340, replies: 156, optOuts: 0, date: "Apr 12, 2026" },
    { name: "Review Request", status: "active", sent: 780, replies: 234, optOuts: 2, date: "Apr 9, 2026" }
  ];"""
new2 = """  var TEMPLATES = [];          // loaded via API
  var templatesLoaded = false;"""
if old2 in txt:
    txt = txt.replace(old2, new2)
    changed.append('SMS_CAMPAIGNS->TEMPLATES')

# 3. Add API loaders before Boot comment
old3 = """  /* ── Boot ───────────────────────────────────────────────────────────── */"""
new3 = """  /* ── API loaders ───────────────────────────────────────────────────── */
  function loadEmailCampaigns() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/?r=campaigns', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var d = JSON.parse(xhr.responseText);
          EMAIL_CAMPAIGNS = Array.isArray(d.campaigns) ? d.campaigns : (Array.isArray(d) ? d : []);
        } catch (e) { EMAIL_CAMPAIGNS = []; }
      } else { EMAIL_CAMPAIGNS = []; }
      emailCampaignsLoaded = true;
      if (activeTab === 0) renderContent();
    };
    xhr.send();
  }

  function loadTemplates() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'api/?r=templates', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var d = JSON.parse(xhr.responseText);
          TEMPLATES = Array.isArray(d.templates) ? d.templates : (Array.isArray(d) ? d : []);
        } catch (e) { TEMPLATES = []; }
      } else { TEMPLATES = []; }
      templatesLoaded = true;
      if (activeTab === 2) renderContent();
    };
    xhr.send();
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */"""
if old3 in txt:
    txt = txt.replace(old3, new3)
    changed.append('API loaders added')

# 4. Wire loaders in DOMContentLoaded
old4 = """    renderTabs();
    renderContent();
    buildSocialModal();"""
new4 = """    renderTabs();
    renderContent();
    buildSocialModal();
    loadEmailCampaigns();
    loadSocialProviders();
    loadTemplates();"""
if old4 in txt:
    txt = txt.replace(old4, new4)
    changed.append('DOMContentLoaded wired')

# 5. Replace renderSmsTable with Coming Soon
old5_start = "  /* ── SMS campaigns table ────────────────────────────────────────────── */"
old5_end = "  /* ── Templates table ────────────────────────────────────────────────── */"
if old5_start in txt and old5_end in txt:
    idx_start = txt.index(old5_start)
    idx_end = txt.index(old5_end)
    old5 = txt[idx_start:idx_end]
    new5 = """  /* ── SMS campaigns — Coming Soon ────────────────────────────────────── */
  function renderSmsTable() {
    return '<div style="margin-top:24px;background:linear-gradient(135deg,var(--navy,#010F3B),#0a1e5e);border-radius:12px;padding:36px;text-align:center">' +
      '<div style="font-size:32px;margin-bottom:12px">&#128241;</div>' +
      '<h3 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">SMS Campaigns — Coming Soon</h3>' +
      '<p style="color:rgba(255,255,255,.65);font-size:14px;margin:0 0 20px;max-width:420px;margin-inline:auto">' +
        'Two-way SMS marketing is under active development. Email campaigns are fully live now.' +
      '</p>' +
      '<button class="btn btn-outline" onclick="(function(){var tabs=document.querySelectorAll(\'tab-btn\');if(tabs[0])tabs[0].click();})()">Go to Email Campaigns</button>' +
      '</div>';
  }

  """
    txt = txt[:idx_start] + new5 + txt[idx_end:]
    changed.append('renderSmsTable -> Coming Soon')

# 6. Replace renderTemplates with API-backed version
old6_start = "  /* ── Templates table ────────────────────────────────────────────────── */"
old6_end = "  /* ── Social Media tab ───────────────────────────────────────────────── */"
if old6_start in txt and old6_end in txt:
    idx_start = txt.index(old6_start)
    idx_end = txt.index(old6_end)
    old6 = txt[idx_start:idx_end]
    new6 = """  /* ── Templates table — API-backed ───────────────────────────────────── */
  function renderTemplates() {
    if (!templatesLoaded) {
      return '<div style="padding:40px;text-align:center;color:var(--text-dim)">Loading templates…</div>';
    }
    if (!TEMPLATES.length) {
      return '<div style="padding:40px;text-align:center">' +
        '<p style="color:var(--text-dim);margin:0 0 12px">No templates yet.</p>' +
        '<button class="btn btn-primary" onclick="alert(\'Template builder coming soon.\')">+ New Template</button>' +
        '</div>';
    }
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Template Name</th><th>Type</th><th>Category</th><th>Last Modified</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < TEMPLATES.length; i++) {
      var t = TEMPLATES[i];
      var modified = t.updated_at ? t.updated_at.slice(0, 10) : (t.lastModified || '-');
      html += '<tr>';
      html += '<td><strong>' + escHtml(t.name || t.subject || '-') + '</strong></td>';
      html += '<td>' + escHtml(t.type || t.channel || 'Email') + '</td>';
      html += '<td>' + escHtml(t.category || '-') + '</td>';
      html += '<td>' + modified + '</td>';
      html += '<td><button class="action-link">Edit</button> <button class="action-link">Use</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  """
    txt = txt[:idx_start] + new6 + txt[idx_end:]
    changed.append('renderTemplates -> API-backed')

if txt == original:
    print('WARNING: no changes made')
    sys.exit(1)

with open(src, 'w', encoding='utf-8') as f:
    f.write(txt)

print('OK: marketing.js patched')
print('Changes:', ', '.join(changed))
