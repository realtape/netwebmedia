/* Marketing Page Logic + Social Media tab */
(function () {
  "use strict";

  var EMAIL_CAMPAIGNS = [];   // loaded via API
  var emailCampaignsLoaded = false;

  var TEMPLATES = [];          // loaded via API
  var templatesLoaded = false;

  var TABS = ["Email Campaigns", "SMS Campaigns", "Templates", "Social Media"];
  var activeTab = 0;

  /* ── Social Media state ───────────────────────────────────────────── */
  var socialProviders  = [];
  var socialPosts      = null;   // null = demo, [] = loaded empty
  var socialFilter     = "all";
  var connectingKey    = null;

  var SM_NAMES   = { fb: "Facebook", ig: "Instagram", li: "LinkedIn", yt: "YouTube", tk: "TikTok" };
  var SM_IDS     = { fb: "facebook", ig: "instagram", li: "linkedin", yt: "youtube",  tk: "tiktok"  };
  var SM_CLASSES = { fb: "platform-fb", ig: "platform-ig", li: "platform-li", yt: "platform-yt", tk: "platform-tk" };

  var SM_FIELDS = {
    fb: [
      { key: "fb_page_id",     label: "Page ID",            placeholder: "123456789010",                        secret: false },
      { key: "fb_page_token",  label: "Page Access Token",  placeholder: "EAAxxxxxxxxx\u2026",                  secret: true  }
    ],
    ig: [
      { key: "ig_user_id",     label: "Instagram User ID",  placeholder: "17841400008460056",                   secret: false },
      { key: "ig_access_token",label: "Access Token",       placeholder: "EAAxxxxxxxxx\u2026",                  secret: true  }
    ],
    li: [
      { key: "li_access_token",label: "OAuth Access Token", placeholder: "AQVxxxxxxxxx\u2026",                  secret: true  },
      { key: "li_urn",         label: "Company URN",        placeholder: "urn:li:organization:12345",           secret: false }
    ],
    yt: [
      { key: "yt_channel_id",    label: "Channel ID",          placeholder: "UCxxxxxxxxxx\u2026",               secret: false },
      { key: "yt_client_id",     label: "OAuth Client ID",     placeholder: "xxxx.apps.googleusercontent.com",  secret: false },
      { key: "yt_client_secret", label: "OAuth Client Secret", placeholder: "GOCSPX-xxxxx\u2026",              secret: true  },
      { key: "yt_access_token",  label: "Access Token",        placeholder: "ya29.xxxxxxxx\u2026",              secret: true  },
      { key: "yt_refresh_token", label: "Refresh Token",       placeholder: "1//xxxxxxxxx\u2026",               secret: true  }
    ],
    tk: [
      { key: "tt_access_token", label: "Access Token",      placeholder: "att.xxxxxxxxxx\u2026",                secret: true  }
    ]
  };

  var SM_INSTRUCTIONS = {
    fb: "<b>Meta for Developers</b> &rarr; create an App &rarr; Facebook Login &rarr; generate a long-lived <b>Page Access Token</b> for your Business Page.",
    ig: "Requires an <b>Instagram Business</b> account linked to a Facebook Page. Use the <b>Meta Graph API Explorer</b> (scopes: <code>instagram_basic</code> + <code>instagram_content_publish</code>) to generate a long-lived token.",
    li: "<b>LinkedIn Developer Portal</b> &rarr; create an app &rarr; request <code>r_organization_social</code> + <code>w_organization_social</code> scopes &rarr; find your Company URN via <code>GET /v2/organizationalEntityAcls</code>.",
    yt: "<b>Google Cloud Console</b> &rarr; enable <b>YouTube Data API v3</b> &rarr; create <b>OAuth 2.0 credentials</b> &rarr; run the consent flow to get access &amp; refresh tokens.",
    tk: "<b>developers.tiktok.com</b> &rarr; create an app &rarr; request Content Posting API access &rarr; complete sandbox approval &rarr; run the OAuth flow."
  };

  var DEMO_POSTS = [
    { day: 0, platform: "fb", time: "9:00 AM",   title: "New blog post: 5 SEO Tips" },
    { day: 0, platform: "ig", time: "12:00 PM",  title: "Behind the scenes at the office" },
    { day: 0, platform: "li", time: "2:00 PM",   title: "Case study: 300% lead increase" },
    { day: 1, platform: "fb", time: "10:00 AM",  title: "Client testimonial video" },
    { day: 1, platform: "tk", time: "3:00 PM",   title: "Quick tip: Email subject lines" },
    { day: 2, platform: "yt", time: "12:00 PM",  title: "Agency explainer video" },
    { day: 2, platform: "li", time: "8:00 AM",   title: "Industry report highlights" },
    { day: 3, platform: "ig", time: "11:00 AM",  title: "Product feature carousel" },
    { day: 4, platform: "fb", time: "9:00 AM",   title: "Friday motivation quote" },
    { day: 4, platform: "yt", time: "11:00 AM",  title: "Client results breakdown" },
    { day: 5, platform: "ig", time: "2:00 PM",   title: "User-generated content" },
    { day: 6, platform: "li", time: "7:00 PM",   title: "Monday motivation prep" }
  ];

  /* ── API loaders ───────────────────────────────────────────────────── */
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
          var all = Array.isArray(d.templates) ? d.templates : (Array.isArray(d) ? d : []);
          // Scope to user's niche: show niche-matched + global (null/empty niche) templates
          var userNiche = window.CRM_APP ? CRM_APP.getUserNiche() : null;
          if (userNiche) {
            TEMPLATES = all.filter(function(t) {
              return !t.niche || t.niche === userNiche;
            });
          } else {
            TEMPLATES = all;
          }
        } catch (e) { TEMPLATES = []; }
      } else { TEMPLATES = []; }
      templatesLoaded = true;
      if (activeTab === 2) renderContent();
    };
    xhr.send();
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Marketing",
      '<button class="btn btn-primary" id="mktNewBtn">' + CRM_APP.ICONS.plus + ' New Campaign</button>');
    renderTabs();
    renderContent();
    buildSocialModal();
    loadEmailCampaigns();
    loadSocialProviders();
    loadTemplates();

    document.addEventListener("click", function (e) {
      if (e.target && (e.target.id === "mktNewBtn" || e.target.closest("#mktNewBtn"))) {
        if (activeTab === 3) openNewPostModal();
      }
    });
  });

  /* ── Tabs ───────────────────────────────────────────────────────────── */
  function renderTabs() {
    var bar = document.getElementById("tabBar");
    if (!bar) return;
    var html = "";
    for (var i = 0; i < TABS.length; i++) {
      html += '<button class="tab-btn' + (i === activeTab ? " active" : "") + '" data-tab="' + i + '">' + TABS[i] + '</button>';
    }
    bar.innerHTML = html;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activeTab = parseInt(btn.getAttribute("data-tab"), 10);
      // Update header button label
      var nb = document.getElementById("mktNewBtn");
      if (nb) {
        if (activeTab === 3) {
          nb.innerHTML = CRM_APP.ICONS.plus + " New Post";
        } else {
          nb.innerHTML = CRM_APP.ICONS.plus + " New Campaign";
        }
      }
      renderTabs();
      renderContent();
    });
  }

  /* ── Content router ─────────────────────────────────────────────────── */
  function renderContent() {
    var body = document.getElementById("marketingBody");
    if (!body) return;

    if (activeTab === 3) {
      renderSocialTab(body);
      return;
    }

    var totalSent = 0, totalOpens = 0, totalClicks = 0, activeCampaigns = 0;
    for (var i = 0; i < EMAIL_CAMPAIGNS.length; i++) {
      var c = EMAIL_CAMPAIGNS[i];
      totalSent   += c.sent;
      totalOpens  += c.opens;
      totalClicks += c.clicks;
      if (c.status === "active") activeCampaigns++;
    }
    var avgOpen  = totalSent > 0 ? ((totalOpens  / totalSent) * 100).toFixed(1) + "%" : "0%";
    var avgClick = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) + "%" : "0%";

    var html = '<div class="summary-cards">';
    html += summaryCard("Total Sent",        totalSent.toLocaleString(), "");
    html += summaryCard("Avg Open Rate",     avgOpen,                    "green");
    html += summaryCard("Avg Click Rate",    avgClick,                   "");
    html += summaryCard("Active Campaigns",  activeCampaigns.toString(), "");
    html += '</div>';

    if (activeTab === 0)      html += renderEmailTable();
    else if (activeTab === 1) html += renderSmsTable();
    else                      html += renderTemplates();

    body.innerHTML = html;
  }

  function summaryCard(label, value, colorClass) {
    return '<div class="summary-card"><div class="card-label">' + label + '</div><div class="card-value ' + colorClass + '">' + value + '</div></div>';
  }

  /* ── Email campaigns table ──────────────────────────────────────────── */
  function renderEmailTable() {
    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Campaign</th><th>Status</th><th>Sent</th><th>Opens</th><th>Clicks</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < EMAIL_CAMPAIGNS.length; i++) {
      var c = EMAIL_CAMPAIGNS[i];
      var openRate  = c.sent > 0 ? ((c.opens  / c.sent) * 100).toFixed(1) + "%" : "-";
      var clickRate = c.sent > 0 ? ((c.clicks / c.sent) * 100).toFixed(1) + "%" : "-";
      html += '<tr>';
      html += '<td><strong>' + c.name + '</strong></td>';
      html += '<td>' + CRM_APP.statusBadge(c.status) + '</td>';
      html += '<td>' + (c.sent > 0 ? c.sent.toLocaleString() : "-") + '</td>';
      html += '<td>' + (c.sent > 0 ? c.opens.toLocaleString() + ' <span style="color:var(--text-dim);font-size:11px">(' + openRate  + ')</span>' : "-") + '</td>';
      html += '<td>' + (c.sent > 0 ? c.clicks.toLocaleString() + ' <span style="color:var(--text-dim);font-size:11px">(' + clickRate + ')</span>' : "-") + '</td>';
      html += '<td>' + c.date + '</td>';
      html += '<td><button class="action-link">Edit</button> <button class="action-link">Clone</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  /* ── SMS campaigns — Coming Soon ────────────────────────────────────── */
  function renderSmsTable() {
    return '<div style="margin-top:24px;background:linear-gradient(135deg,var(--navy,#010F3B),#0a1e5e);border-radius:12px;padding:36px;text-align:center">' +
      '<div style="font-size:32px;margin-bottom:12px">&#128241;</div>' +
      '<h3 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">SMS Campaigns — Coming Soon</h3>' +
      '<p style="color:rgba(255,255,255,.65);font-size:14px;margin:0 0 20px;max-width:420px;margin-inline:auto">' +
        'Two-way SMS marketing is under active development. Email campaigns are fully live now.' +
      '</p>' +
      '<button class="btn btn-outline" onclick="(function(){var tabs=document.querySelectorAll('tab-btn');if(tabs[0])tabs[0].click();})()">Go to Email Campaigns</button>' +
      '</div>';
  }

    /* ── Templates table — API-backed ───────────────────────────────────── */
  function renderTemplates() {
    if (!templatesLoaded) {
      return '<div style="padding:40px;text-align:center;color:var(--text-dim)">Loading templates…</div>';
    }
    if (!TEMPLATES.length) {
      return '<div style="padding:40px;text-align:center">' +
        '<p style="color:var(--text-dim);margin:0 0 12px">No templates yet.</p>' +
        '<button class="btn btn-primary" onclick="alert('Template builder coming soon.')">+ New Template</button>' +
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

    /* ── Social Media tab ───────────────────────────────────────────────── */
  function renderSocialTab(body) {
    var connCount = socialProviders.filter(function (p) { return p.connected; }).length;
    var total     = socialProviders.length || 5;

    // Stats row
    var html = '<div class="summary-cards">';
    html += summaryCard("Connected Accounts", connCount + " / " + total, "");
    html += summaryCard("Posts This Week", (socialPosts || DEMO_POSTS).length.toString(), "");
    html += summaryCard("Platforms", "5", "");
    html += summaryCard("Status", connCount > 0 ? "Active" : "Setup Needed", connCount > 0 ? "green" : "");
    html += '</div>';

    // Connected accounts panel
    html += '<div class="social-accounts-wrap" style="margin-bottom:24px">';
    html += '<div class="social-accounts-header">';
    html += '<span class="social-accounts-title">Connected Accounts</span>';
    html += '<span class="social-accounts-badge">' + connCount + '\u202f/\u202f' + total + ' connected</span>';
    html += '</div><div class="social-accounts-grid">';

    ["ig", "fb", "yt", "li", "tk"].forEach(function (key) {
      var apiId     = SM_IDS[key];
      var prov      = socialProviders.find(function (p) { return p.id === apiId; }) || { connected: false };
      var connected = !!prov.connected;
      var abbr      = SM_NAMES[key].slice(0, 2).toUpperCase();

      html += '<div class="social-connect-card">';
      html += '<div class="social-connect-card-top">';
      html += '<div class="social-post-platform ' + SM_CLASSES[key] + ' scc-icon">' + abbr + '</div>';
      html += '<div class="social-connect-info">';
      html += '<div class="social-connect-name">' + SM_NAMES[key] + '</div>';
      html += '<div class="social-connect-status ' + (connected ? "status-connected" : "status-disconnected") + '">';
      html += '<span class="status-dot"></span>' + (connected ? "Connected" : "Not connected");
      html += '</div></div>';
      html += '<button class="btn btn-sm ' + (connected ? "btn-outline" : "btn-primary") + '" data-sm-connect="' + key + '">';
      html += connected ? "Update" : "Connect";
      html += '</button></div></div>';
    });

    html += '</div></div>';

    // Platform filter bar
    html += '<div class="filter-group" style="margin:0 0 16px">';
    var filterLabels = { all: "All Platforms", ig: "Instagram", fb: "Facebook", yt: "YouTube", li: "LinkedIn", tk: "TikTok" };
    ["all", "ig", "fb", "yt", "li", "tk"].forEach(function (v) {
      html += '<button class="filter-btn' + (socialFilter === v ? " active" : "") + '" data-sm-filter="' + v + '">' + filterLabels[v] + '</button>';
    });
    html += '</div>';

    // Weekly calendar
    html += renderSocialCalendar();

    if (socialPosts === null) {
      html += '<p style="margin-top:10px;font-size:11px;color:var(--text-muted);text-align:center">Demo data — connect your accounts to see live scheduled posts</p>';
    }

    body.innerHTML = html;

    // Wire connect buttons
    body.querySelectorAll("[data-sm-connect]").forEach(function (btn) {
      btn.addEventListener("click", function () { openSocialConnect(this.getAttribute("data-sm-connect")); });
    });

    // Wire filter buttons
    body.querySelectorAll("[data-sm-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        socialFilter = this.getAttribute("data-sm-filter");
        renderContent();
      });
    });
  }

  function renderSocialCalendar() {
    var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var posts     = socialPosts !== null ? socialPosts : DEMO_POSTS;
    var today     = new Date();
    var monday    = getMonday(today);
    var html      = '<div class="social-calendar">';

    for (var d = 0; d < 7; d++) {
      var date    = new Date(monday);
      date.setDate(monday.getDate() + d);
      var isToday = date.toDateString() === today.toDateString();

      html += '<div class="social-day' + (isToday ? " social-day-today" : "") + '">';
      html += '<div class="social-day-header"><span>' + DAY_NAMES[d] + "</span>" + date.getDate() + "</div>";
      html += '<div class="social-day-body">';

      var dayPosts = posts.filter(function (p) {
        return p.day === d && (socialFilter === "all" || p.platform === socialFilter);
      });

      dayPosts.forEach(function (post) {
        var abbr = SM_NAMES[post.platform].slice(0, 2).toUpperCase();
        html += '<div class="social-post">';
        html += '<div class="social-post-platform ' + SM_CLASSES[post.platform] + '">' + abbr + '</div>';
        html += '<div style="flex:1;min-width:0"><div class="social-post-title">' + escHtml(post.title) + '</div>';
        html += '<div class="social-post-time">' + post.time + '</div></div></div>';
      });

      if (!dayPosts.length) {
        html += '<div style="padding:8px;font-size:11px;color:var(--text-muted);text-align:center">No posts</div>';
      }

      html += '</div></div>';
    }
    return html + '</div>';
  }

  /* ── Social connect modal ───────────────────────────────────────────── */
  function buildSocialModal() {
    if (document.getElementById("smConnectOverlay")) return;
    var wrap = document.createElement("div");
    wrap.id        = "smConnectOverlay";
    wrap.className = "upgrade-overlay";
    wrap.style.display = "none";
    wrap.innerHTML =
      '<div class="upgrade-modal" style="max-width:520px" onclick="event.stopPropagation()">' +
      '<button class="upgrade-close" onclick="document.getElementById(\'smConnectOverlay\').style.display=\'none\'">&#215;</button>' +
      '<div id="smModalBody"></div>' +
      '</div>';
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) wrap.style.display = "none";
    });
    document.body.appendChild(wrap);
  }

  function openSocialConnect(key) {
    connectingKey = key;
    var name   = SM_NAMES[key];
    var fields = SM_FIELDS[key] || [];
    var abbr   = name.slice(0, 2).toUpperCase();

    var html = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">';
    html += '<div class="social-post-platform ' + SM_CLASSES[key] + '" style="width:44px;height:44px;font-size:13px;font-weight:700;flex-shrink:0">' + abbr + '</div>';
    html += '<div><h2 style="font-size:18px;font-weight:700;margin:0">Connect ' + name + '</h2>';
    html += '<p style="font-size:12px;color:var(--text-dim);margin:4px 0 0">Enter your API credentials below</p></div></div>';

    var instr = SM_INSTRUCTIONS[key];
    if (instr) html += '<div class="social-modal-instructions">' + instr + '</div>';

    html += '<form id="smCredForm">';
    fields.forEach(function (f) {
      html += '<div style="margin-bottom:14px">';
      html += '<label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-dim)">' + f.label + '</label>';
      html += '<input class="form-input" type="' + (f.secret ? "password" : "text") + '" name="' + f.key + '" placeholder="' + f.placeholder + '" autocomplete="off" style="width:100%">';
      html += '</div>';
    });
    html += '<div style="display:flex;gap:10px;margin-top:22px">';
    html += '<button type="submit" class="btn btn-primary" id="smSaveBtn">Save Credentials</button>';
    html += '<button type="button" class="btn btn-outline" onclick="document.getElementById(\'smConnectOverlay\').style.display=\'none\'">Cancel</button>';
    html += '</div></form>';

    document.getElementById("smModalBody").innerHTML = html;
    document.getElementById("smConnectOverlay").style.display = "flex";

    document.getElementById("smCredForm").onsubmit = function (e) {
      e.preventDefault();
      var inputs = this.querySelectorAll("input");
      var creds = {}, hasValue = false;
      inputs.forEach(function (inp) {
        var v = inp.value.trim();
        if (v) { creds[inp.name] = v; hasValue = true; }
      });
      if (!hasValue) return;

      var btn = document.getElementById("smSaveBtn");
      btn.disabled    = true;
      btn.textContent = "Saving\u2026";

      fetch("/api/social/credentials", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ provider: SM_IDS[connectingKey], fields: creds })
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function () {
          btn.textContent = "Saved!";
          setTimeout(function () {
            document.getElementById("smConnectOverlay").style.display = "none";
            loadSocialProviders();
          }, 900);
        })
        .catch(function (err) {
          btn.disabled    = false;
          btn.textContent = "Save Credentials";
          alert("Error saving credentials (" + err + "). Make sure you are logged in as admin.");
        });
    };
  }

  function loadSocialProviders() {
    fetch("/api/social/providers")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { socialProviders = d.items || []; if (activeTab === 3) renderContent(); })
      .catch(function ()  { socialProviders = [];            if (activeTab === 3) renderContent(); });
  }

  /* ── New Post modal ─────────────────────────────────────────────────── */
  function openNewPostModal() {
    var existing = document.getElementById("smPostModal");
    if (existing) existing.remove();

    var platformChecks = Object.keys(SM_NAMES).map(function (k) {
      return '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">' +
        '<input type="checkbox" name="platform" value="' + k + '"> ' + SM_NAMES[k] + '</label>';
    }).join("");

    var inp = 'width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:14px;background:var(--bg-input);color:var(--text)';

    var m = document.createElement("div");
    m.id = "smPostModal";
    m.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px";
    m.innerHTML =
      '<div style="background:var(--bg-card);border-radius:10px;max-width:560px;width:100%;max-height:90vh;overflow:auto;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
      '<h2 style="margin:0 0 20px;color:var(--text);font-size:18px">New Social Post</h2>' +
      '<div style="margin-bottom:14px"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:8px;color:var(--text-dim)">Platforms</label>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap" id="smPlatformPicker">' + platformChecks + '</div></div>' +
      '<div style="margin-bottom:14px"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-dim)">Caption / Content</label>' +
      '<textarea id="smCaption" style="' + inp + ';min-height:120px" placeholder="Write your post content here\u2026"></textarea></div>' +
      '<div style="margin-bottom:20px"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-dim)">Schedule Date &amp; Time</label>' +
      '<input id="smDate" type="datetime-local" style="' + inp + '"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button id="smPostCancel" style="background:var(--border);color:var(--text);border:0;padding:10px 20px;border-radius:6px;cursor:pointer">Cancel</button>' +
      '<button id="smPostSave" style="background:var(--accent);color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600">Schedule Post</button>' +
      '</div></div>';

    document.body.appendChild(m);
    m.querySelector("#smPostCancel").onclick = function () { m.remove(); };
    m.onclick = function (e) { if (e.target === m) m.remove(); };

    m.querySelector("#smPostSave").onclick = function () {
      var caption   = m.querySelector("#smCaption").value.trim();
      var dateVal   = m.querySelector("#smDate").value;
      var platforms = Array.from(m.querySelectorAll('input[name="platform"]:checked')).map(function (i) { return SM_IDS[i.value]; });

      if (!caption)         return alert("Content is required.");
      if (!platforms.length) return alert("Select at least one platform.");

      fetch("/api/social/posts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ caption: caption, scheduled_at: dateVal || null, providers: JSON.stringify(platforms) })
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function ()  { m.remove(); socialPosts = null; renderContent(); })
        .catch(function () {
          /* API not live — add as demo post so user sees feedback immediately */
          var dow  = dateVal ? (new Date(dateVal).getDay() + 6) % 7 : new Date().getDay();
          var fmtT = dateVal ? (function () {
            var d = new Date(dateVal), h = d.getHours(), mn = d.getMinutes(), ap = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
            return h + ":" + (mn < 10 ? "0" + mn : mn) + " " + ap;
          })() : "12:00 PM";
          platforms.forEach(function (pid) {
            var key = Object.keys(SM_IDS).find(function (k) { return SM_IDS[k] === pid; }) || "fb";
            DEMO_POSTS.push({ day: dow, platform: key, time: fmtT, title: caption.slice(0, 52) });
          });
          m.remove();
          renderContent();
        });
    };
  }

  /* ── Utilities ──────────────────────────────────────────────────────── */
  function getMonday(d) {
    var c = new Date(d), dow = c.getDay();
    c.setDate(c.getDate() + (dow === 0 ? -6 : 1 - dow));
    c.setHours(0, 0, 0, 0);
    return c;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

})();
