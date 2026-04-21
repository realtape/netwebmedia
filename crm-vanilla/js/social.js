/* Social Planner Page Logic — v3
   Connected Accounts panel + real API data + YouTube + connect modal */
(function () {
  "use strict";

  /* ── Platform registry ─────────────────────────────────────────────── */
  var PLATFORM_NAMES   = { fb: "Facebook", ig: "Instagram", li: "LinkedIn", yt: "YouTube", tk: "TikTok" };
  var PLATFORM_IDS     = { fb: "facebook", ig: "instagram", li: "linkedin", yt: "youtube",  tk: "tiktok"  };
  var PLATFORM_CLASSES = { fb: "platform-fb", ig: "platform-ig", li: "platform-li", yt: "platform-yt", tk: "platform-tk" };

  // Credential fields shown in the Connect modal
  var PLATFORM_FIELDS = {
    fb: [
      { key: "fb_page_id",    label: "Page ID",             placeholder: "123456789010",                       secret: false },
      { key: "fb_page_token", label: "Page Access Token",   placeholder: "EAAxxxxxxxxx\u2026",                 secret: true  }
    ],
    ig: [
      { key: "ig_user_id",      label: "Instagram User ID", placeholder: "17841400008460056",                  secret: false },
      { key: "ig_access_token", label: "Access Token",      placeholder: "EAAxxxxxxxxx\u2026",                 secret: true  }
    ],
    li: [
      { key: "li_access_token", label: "OAuth Access Token",placeholder: "AQVxxxxxxxxx\u2026",                 secret: true  },
      { key: "li_urn",          label: "Company URN",       placeholder: "urn:li:organization:12345",          secret: false }
    ],
    yt: [
      { key: "yt_channel_id",     label: "Channel ID",          placeholder: "UCxxxxxxxxxx\u2026",             secret: false },
      { key: "yt_client_id",      label: "OAuth Client ID",     placeholder: "xxxx.apps.googleusercontent.com",secret: false },
      { key: "yt_client_secret",  label: "OAuth Client Secret", placeholder: "GOCSPX-xxxxx\u2026",            secret: true  },
      { key: "yt_access_token",   label: "Access Token",        placeholder: "ya29.xxxxxxxx\u2026",            secret: true  },
      { key: "yt_refresh_token",  label: "Refresh Token",       placeholder: "1//xxxxxxxxx\u2026",             secret: true  }
    ],
    tk: [
      { key: "tt_access_token", label: "Access Token",      placeholder: "att.xxxxxxxxxx\u2026",               secret: true  }
    ]
  };

  var PLATFORM_INSTRUCTIONS = {
    fb: "<b>Meta for Developers</b> &rarr; create an App &rarr; Facebook Login &rarr; generate a long-lived <b>Page Access Token</b> for your Business Page.",
    ig: "Requires an <b>Instagram Business</b> account linked to a Facebook Page. Use the <b>Meta Graph API Explorer</b> (scopes: <code>instagram_basic</code> + <code>instagram_content_publish</code>) to generate a long-lived token.",
    li: "<b>LinkedIn Developer Portal</b> &rarr; create an app &rarr; request <code>r_organization_social</code> + <code>w_organization_social</code> scopes &rarr; find your Company URN via <code>GET /v2/organizationalEntityAcls</code>.",
    yt: "<b>Google Cloud Console</b> &rarr; enable <b>YouTube Data API v3</b> &rarr; create <b>OAuth 2.0 credentials</b> (Web App) &rarr; run the consent flow to get an access token and refresh token.",
    tk: "<b>developers.tiktok.com</b> &rarr; create an app &rarr; request Content Posting API access &rarr; complete sandbox approval &rarr; run the OAuth flow."
  };

  /* ── Demo fallback ──────────────────────────────────────────────────── */
  var DEMO_POSTS = [
    { day: 0, platform: "fb", time: "9:00 AM",  title: "New blog post: 5 SEO Tips" },
    { day: 0, platform: "ig", time: "12:00 PM", title: "Behind the scenes at the office" },
    { day: 0, platform: "li", time: "2:00 PM",  title: "Case study: 300% lead increase" },
    { day: 1, platform: "fb", time: "10:00 AM", title: "Client testimonial video" },
    { day: 1, platform: "tk", time: "3:00 PM",  title: "Quick tip: Email subject lines" },
    { day: 1, platform: "ig", time: "6:00 PM",  title: "Team spotlight" },
    { day: 2, platform: "li", time: "8:00 AM",  title: "Industry report highlights" },
    { day: 2, platform: "yt", time: "12:00 PM", title: "Agency explainer video" },
    { day: 2, platform: "fb", time: "1:00 PM",  title: "Webinar announcement" },
    { day: 3, platform: "ig", time: "11:00 AM", title: "Product feature carousel" },
    { day: 3, platform: "tk", time: "4:00 PM",  title: "Day in the life of a marketer" },
    { day: 3, platform: "li", time: "5:00 PM",  title: "Hiring: Sales Manager" },
    { day: 4, platform: "fb", time: "9:00 AM",  title: "Friday motivation quote" },
    { day: 4, platform: "yt", time: "11:00 AM", title: "Client results breakdown" },
    { day: 4, platform: "ig", time: "12:00 PM", title: "Weekend vibes reel" },
    { day: 5, platform: "fb", time: "10:00 AM", title: "Weekend reading list" },
    { day: 5, platform: "ig", time: "2:00 PM",  title: "User-generated content" },
    { day: 6, platform: "ig", time: "11:00 AM", title: "Week ahead preview" },
    { day: 6, platform: "li", time: "7:00 PM",  title: "Monday motivation prep" }
  ];

  /* ── State ──────────────────────────────────────────────────────────── */
  var activeFilter  = "all";
  var providers     = [];   // from GET /api/social/providers
  var apiPosts      = null; // null = not loaded (shows demo); [] = loaded empty
  var connectingKey = null;
  var DAY_NAMES, L;

  /* ── Boot ───────────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    var isEs = window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === "es";
    L = isEs ? {
      newPost: "Nueva Publicaci\u00f3n", allPlatforms: "Todas las Plataformas", noPosts: "Sin publicaciones",
      connected: "Conectado", disconnected: "No conectado", connect: "Conectar", update: "Actualizar",
      connectedAccounts: "Cuentas Conectadas", save: "Guardar credenciales", cancel: "Cancelar",
      connectTitle: "Conectar", saving: "Guardando\u2026", saved: "\u00a1Guardado!"
    } : {
      newPost: "New Post", allPlatforms: "All Platforms", noPosts: "No posts",
      connected: "Connected", disconnected: "Not connected", connect: "Connect", update: "Update",
      connectedAccounts: "Connected Accounts", save: "Save Credentials", cancel: "Cancel",
      connectTitle: "Connect", saving: "Saving\u2026", saved: "Saved!"
    };
    DAY_NAMES = isEs
      ? ["Lun","Mar","Mi\u00e9","Jue","Vie","S\u00e1b","Dom"]
      : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    var pageTitle = (CRM_APP.t ? CRM_APP.t("nav.social") : null) || (isEs ? "Social" : "Social Planner");
    CRM_APP.buildHeader(
      pageTitle,
      '<button class="btn btn-primary" onclick="window._socialNewPost()">' + CRM_APP.ICONS.plus + " " + L.newPost + "</button>"
    );

    buildModal();
    loadProviders();
    loadPosts();
  });

  /* ── Data loaders ───────────────────────────────────────────────────── */
  function loadProviders() {
    fetch("/api/social/providers")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { providers = d.items || []; renderAccounts(); })
      .catch(function ()  { providers = [];            renderAccounts(); });
  }

  function loadPosts() {
    fetch("/api/social/posts")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { apiPosts = mapApiPosts(d.items || []); renderCalendar(); })
      .catch(function ()  { apiPosts = null;                       renderCalendar(); });
  }

  function mapApiPosts(rows) {
    var monday = getMonday(new Date());
    var result = [];
    rows.forEach(function (p) {
      if (!p.scheduled_at) return;
      var d    = new Date(p.scheduled_at.replace(" ", "T"));
      var diff = Math.floor((d - monday) / 86400000);
      if (diff < 0 || diff > 6) return;
      var provs = [];
      try { provs = JSON.parse(p.providers) || []; } catch (e) { provs = []; }
      result.push({
        day:      diff,
        platform: apiProvToKey(provs[0] || "facebook"),
        time:     fmtTime(d),
        title:    (p.caption || "").slice(0, 52),
        status:   p.status,
        id:       p.id
      });
    });
    return result;
  }

  function apiProvToKey(prov) {
    return { facebook:"fb", instagram:"ig", linkedin:"li", youtube:"yt", tiktok:"tk" }[prov] || "fb";
  }

  /* ── Render: Connected Accounts panel ──────────────────────────────── */
  function renderAccounts() {
    var body = document.getElementById("socialBody");
    if (!body) return;
    var section = document.getElementById("socialAccountsSection");
    if (!section) {
      section = document.createElement("div");
      section.id = "socialAccountsSection";
      body.insertBefore(section, body.firstChild);
    }

    var connCount = providers.filter(function (p) { return p.connected; }).length;
    var total     = providers.length || 5;

    var html = '<div class="social-accounts-wrap">';
    html += '<div class="social-accounts-header">';
    html += '<span class="social-accounts-title">' + L.connectedAccounts + '</span>';
    html += '<span class="social-accounts-badge">' + connCount + '\u202f/\u202f' + total + ' connected</span>';
    html += '</div>';
    html += '<div class="social-accounts-grid">';

    ["ig","fb","yt","li","tk"].forEach(function (key) {
      var apiId     = PLATFORM_IDS[key];
      var prov      = providers.find(function (p) { return p.id === apiId; }) || { connected: false, note: "" };
      var connected = !!prov.connected;
      var abbr      = PLATFORM_NAMES[key].slice(0, 2).toUpperCase();

      html += '<div class="social-connect-card">';
      html += '<div class="social-connect-card-top">';
      html += '<div class="social-post-platform ' + PLATFORM_CLASSES[key] + ' scc-icon">' + abbr + '</div>';
      html += '<div class="social-connect-info">';
      html += '<div class="social-connect-name">' + PLATFORM_NAMES[key] + '</div>';
      html += '<div class="social-connect-status ' + (connected ? "status-connected" : "status-disconnected") + '">';
      html += '<span class="status-dot"></span>' + (connected ? L.connected : L.disconnected);
      html += '</div></div>';
      html += '<button class="btn btn-sm ' + (connected ? "btn-outline" : "btn-primary") + '" onclick="window._socialConnect(\'' + key + '\')">';
      html += connected ? L.update : L.connect;
      html += '</button>';
      html += '</div>';
      if (prov.note) html += '<div class="social-connect-note">' + escHtml(prov.note) + '</div>';
      html += '</div>';
    });

    html += '</div></div>';
    section.innerHTML = html;
  }

  /* ── Render: Calendar ───────────────────────────────────────────────── */
  function renderCalendar() {
    var body = document.getElementById("socialBody");
    if (!body) return;
    var cal = document.getElementById("socialCalSection");
    if (!cal) {
      cal = document.createElement("div");
      cal.id = "socialCalSection";
      body.appendChild(cal);
    }

    var posts  = apiPosts !== null ? apiPosts : DEMO_POSTS;
    var today  = new Date();
    var monday = getMonday(today);
    var html   = "";

    // Filter bar
    html += '<div class="filter-group" style="margin:20px 0 16px">';
    ["all","ig","fb","yt","li","tk"].forEach(function (v) {
      var lbl = v === "all" ? L.allPlatforms : PLATFORM_NAMES[v];
      html += filterBtn(v, lbl);
    });
    html += '</div>';

    // Week grid
    html += '<div class="social-calendar">';
    for (var d = 0; d < 7; d++) {
      var date    = new Date(monday);
      date.setDate(monday.getDate() + d);
      var isToday = date.toDateString() === today.toDateString();

      html += '<div class="social-day' + (isToday ? " social-day-today" : "") + '">';
      html += '<div class="social-day-header"><span>' + DAY_NAMES[d] + "</span>" + date.getDate() + "</div>";
      html += '<div class="social-day-body">';

      var dayPosts = posts.filter(function (p) {
        return p.day === d && (activeFilter === "all" || p.platform === activeFilter);
      });

      dayPosts.forEach(function (post) {
        var abbr = PLATFORM_NAMES[post.platform].slice(0, 2).toUpperCase();
        html += '<div class="social-post">';
        html += '<div class="social-post-platform ' + PLATFORM_CLASSES[post.platform] + '">' + abbr + '</div>';
        html += '<div style="flex:1;min-width:0">';
        html += '<div class="social-post-title">' + escHtml(post.title) + '</div>';
        html += '<div class="social-post-time">' + post.time + '</div>';
        html += '</div></div>';
      });

      if (!dayPosts.length) {
        html += '<div style="padding:8px;font-size:11px;color:var(--text-muted);text-align:center">' + L.noPosts + '</div>';
      }

      html += '</div></div>';
    }
    html += '</div>';

    if (apiPosts === null) {
      html += '<p style="margin-top:10px;font-size:11px;color:var(--text-muted);text-align:center">Demo data &mdash; connect accounts to see live scheduled posts</p>';
    }

    cal.innerHTML = html;

    cal.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = this.getAttribute("data-filter");
        renderCalendar();
      });
    });
  }

  function filterBtn(value, label) {
    var active = value === activeFilter ? " active" : "";
    return '<button class="filter-btn' + active + '" data-filter="' + value + '">' + label + "</button>";
  }

  /* ── Connect modal ──────────────────────────────────────────────────── */
  function buildModal() {
    if (document.getElementById("socialConnectOverlay")) return;
    var wrap = document.createElement("div");
    wrap.id        = "socialConnectOverlay";
    wrap.className = "upgrade-overlay";
    wrap.style.display = "none";
    wrap.innerHTML =
      '<div class="upgrade-modal" style="max-width:520px" onclick="event.stopPropagation()">' +
      '<button class="upgrade-close" onclick="window._socialCloseModal()">&#215;</button>' +
      '<div id="socialModalBody"></div>' +
      '</div>';
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) window._socialCloseModal();
    });
    document.body.appendChild(wrap);
  }

  window._socialConnect = function (key) {
    connectingKey = key;
    var name   = PLATFORM_NAMES[key];
    var fields = PLATFORM_FIELDS[key] || [];
    var abbr   = name.slice(0, 2).toUpperCase();

    var html = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">';
    html += '<div class="social-post-platform ' + PLATFORM_CLASSES[key] + '" style="width:44px;height:44px;font-size:13px;font-weight:700;flex-shrink:0">' + abbr + '</div>';
    html += '<div><h2 style="font-size:18px;font-weight:700;margin:0">' + L.connectTitle + ' ' + name + '</h2>';
    html += '<p style="font-size:12px;color:var(--text-dim);margin:4px 0 0">Enter your API credentials below</p></div></div>';

    var instr = PLATFORM_INSTRUCTIONS[key];
    if (instr) html += '<div class="social-modal-instructions">' + instr + '</div>';

    html += '<form id="socialCredForm" onsubmit="window._socialSaveCreds(event)">';
    fields.forEach(function (f) {
      html += '<div style="margin-bottom:14px">';
      html += '<label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-dim)">' + f.label + '</label>';
      html += '<input class="form-input" type="' + (f.secret ? "password" : "text") + '" name="' + f.key + '" placeholder="' + f.placeholder + '" autocomplete="off" style="width:100%">';
      html += '</div>';
    });
    html += '<div style="display:flex;gap:10px;margin-top:22px">';
    html += '<button type="submit" class="btn btn-primary" id="socialSaveBtn">' + L.save + '</button>';
    html += '<button type="button" class="btn btn-outline" onclick="window._socialCloseModal()">' + L.cancel + '</button>';
    html += '</div></form>';

    document.getElementById("socialModalBody").innerHTML = html;
    document.getElementById("socialConnectOverlay").style.display = "flex";
  };

  window._socialSaveCreds = function (e) {
    e.preventDefault();
    if (!connectingKey) return;
    var inputs = document.getElementById("socialCredForm").querySelectorAll("input");
    var fields = {}, hasValue = false;
    inputs.forEach(function (inp) {
      var v = inp.value.trim();
      if (v) { fields[inp.name] = v; hasValue = true; }
    });
    if (!hasValue) return;

    var btn = document.getElementById("socialSaveBtn");
    btn.disabled    = true;
    btn.textContent = L.saving;

    fetch("/api/social/credentials", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ provider: PLATFORM_IDS[connectingKey], fields: fields })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () {
        btn.textContent = L.saved;
        setTimeout(function () { window._socialCloseModal(); loadProviders(); }, 900);
      })
      .catch(function (err) {
        btn.disabled    = false;
        btn.textContent = L.save;
        alert("Error saving credentials (" + err + "). Make sure you are logged in as admin.");
      });
  };

  window._socialCloseModal = function () {
    var ov = document.getElementById("socialConnectOverlay");
    if (ov) ov.style.display = "none";
    connectingKey = null;
  };

  window._socialNewPost = function () {
    alert("New Post composer \u2014 coming soon!");
  };

  /* ── Utilities ──────────────────────────────────────────────────────── */
  function getMonday(d) {
    var c = new Date(d), dow = c.getDay();
    c.setDate(c.getDate() + (dow === 0 ? -6 : 1 - dow));
    c.setHours(0, 0, 0, 0);
    return c;
  }

  function fmtTime(d) {
    var h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + ":" + (m < 10 ? "0" + m : m) + " " + ap;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

})();
