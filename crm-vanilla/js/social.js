/* Social — v4  Connected Accounts + Live Feed + Planner */
(function () {
  "use strict";

  /* ── Platform registry ──────────────────────────────────────────────── */
  var PLATFORM_NAMES   = { fb: "Facebook", ig: "Instagram", li: "LinkedIn", yt: "YouTube", tk: "TikTok" };
  var PLATFORM_IDS     = { fb: "facebook", ig: "instagram", li: "linkedin", yt: "youtube", tk: "tiktok" };
  var PLATFORM_CLASSES = { fb: "platform-fb", ig: "platform-ig", li: "platform-li", yt: "platform-yt", tk: "platform-tk" };
  var API_TO_KEY       = { facebook: "fb", instagram: "ig", linkedin: "li", youtube: "yt", tiktok: "tk" };

  var PLATFORM_FIELDS = {
    fb: [
      { key: "fb_page_id",    label: "Page ID",           placeholder: "123456789010",                secret: false },
      { key: "fb_page_token", label: "Page Access Token", placeholder: "EAAxxxxxxxxx\u2026",           secret: true  }
    ],
    ig: [
      { key: "ig_user_id",      label: "Instagram User ID", placeholder: "17841400008460056",          secret: false },
      { key: "ig_access_token", label: "Access Token",      placeholder: "EAAxxxxxxxxx\u2026",          secret: true  }
    ],
    li: [
      { key: "li_access_token", label: "OAuth Access Token", placeholder: "AQVxxxxxxxxx\u2026",        secret: true  },
      { key: "li_urn",          label: "Company URN",        placeholder: "urn:li:organization:12345", secret: false }
    ],
    yt: [
      { key: "yt_channel_id",     label: "Channel ID",          placeholder: "UCxxxxxxxxxx\u2026",             secret: false },
      { key: "yt_client_id",      label: "OAuth Client ID",     placeholder: "xxxx.apps.googleusercontent.com",secret: false },
      { key: "yt_client_secret",  label: "OAuth Client Secret", placeholder: "GOCSPX-xxxxx\u2026",            secret: true  },
      { key: "yt_access_token",   label: "Access Token",        placeholder: "ya29.xxxxxxxx\u2026",            secret: true  },
      { key: "yt_refresh_token",  label: "Refresh Token",       placeholder: "1//xxxxxxxxx\u2026",             secret: true  }
    ],
    tk: [
      { key: "tt_access_token", label: "Access Token", placeholder: "att.xxxxxxxxxx\u2026", secret: true }
    ]
  };

  var PLATFORM_INSTRUCTIONS = {
    fb: "<b>Meta for Developers</b> &rarr; create an App &rarr; Facebook Login &rarr; generate a long-lived <b>Page Access Token</b> for your Business Page.",
    ig: "Requires an <b>Instagram Business</b> account linked to a Facebook Page. Use the <b>Meta Graph API Explorer</b> (scopes: <code>instagram_basic</code> + <code>instagram_content_publish</code>) to generate a long-lived token.",
    li: "<b>LinkedIn Developer Portal</b> &rarr; create an app &rarr; request <code>r_organization_social</code> + <code>w_organization_social</code> scopes &rarr; find your Company URN via <code>GET /v2/organizationalEntityAcls</code>.",
    yt: "<b>Google Cloud Console</b> &rarr; enable <b>YouTube Data API v3</b> &rarr; create <b>OAuth 2.0 credentials</b> (Web App) &rarr; run the consent flow to get an access token and refresh token.",
    tk: "<b>developers.tiktok.com</b> &rarr; create an app &rarr; request Content Posting API access &rarr; complete sandbox approval &rarr; run the OAuth flow."
  };

  /* ── Demo fallback (planner only) ───────────────────────────────────── */
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
  var activeTab     = "feed";   // "feed" | "planner"
  var providers     = [];       // from GET /api/social/providers
  var apiPosts      = null;     // planner posts (null = not loaded)
  var feedPosts     = null;     // live feed posts (null = not loaded)
  var feedMeta      = {};       // provider -> {last_sync_at, post_count}
  var feedFilter    = "all";
  var syncingSet    = {};       // provider -> bool
  var connectingKey = null;
  var DAY_NAMES, L;

  /* ── Boot ───────────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    var isEs = window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === "es";
    L = isEs ? {
      newPost: "Nueva Publicaci\u00f3n", allPlatforms: "Todas", noPosts: "Sin publicaciones",
      connected: "Conectado", disconnected: "No conectado", connect: "Conectar", update: "Actualizar",
      disconnect: "Desconectar",
      connectedAccounts: "Cuentas Conectadas", save: "Guardar credenciales", cancel: "Cancelar",
      connectTitle: "Conectar", saving: "Guardando\u2026", saved: "\u00a1Guardado!",
      tabFeed: "Feed en Vivo", tabPlanner: "Planificador",
      syncAll: "Sincronizar Todo", syncing: "Sincronizando\u2026",
      lastSync: "Sincronizado", noFeedPosts: "No hay publicaciones. Conecta una cuenta y sincroniza.",
      viewPost: "Ver publicaci\u00f3n",
      likes: "Me gusta", comments: "Comentarios", shares: "Compartidos", views: "Vistas"
    } : {
      newPost: "New Post", allPlatforms: "All", noPosts: "No posts",
      connected: "Connected", disconnected: "Not connected", connect: "Connect", update: "Update",
      disconnect: "Disconnect",
      connectedAccounts: "Connected Accounts", save: "Save Credentials", cancel: "Cancel",
      connectTitle: "Connect", saving: "Saving\u2026", saved: "Saved!",
      tabFeed: "Live Feed", tabPlanner: "Planner",
      syncAll: "Sync All", syncing: "Syncing\u2026",
      lastSync: "Synced", noFeedPosts: "No posts yet. Connect an account and sync to see live content.",
      viewPost: "View post",
      likes: "Likes", comments: "Comments", shares: "Shares", views: "Views"
    };
    DAY_NAMES = isEs
      ? ["Lun","Mar","Mi\u00e9","Jue","Vie","S\u00e1b","Dom"]
      : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    var pageTitle = (CRM_APP.t ? CRM_APP.t("nav.social") : null) || (isEs ? "Social" : "Social");
    CRM_APP.buildHeader(
      pageTitle,
      '<button class="btn btn-primary" onclick="window._socialNewPost()">' + CRM_APP.ICONS.plus + " " + L.newPost + "</button>"
    );

    buildModal();
    loadProviders();
  });

  /* ── Data loaders ───────────────────────────────────────────────────── */
  function loadProviders() {
    fetch("/api/social/providers")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        providers = d.items || [];
        renderAccounts();
        renderTabs();
        if (activeTab === "feed") loadFeed();
        else loadPosts();
      })
      .catch(function () {
        providers = [];
        renderAccounts();
        renderTabs();
        if (activeTab === "feed") loadFeed();
        else loadPosts();
      });
  }

  function loadPosts() {
    fetch("/api/social/posts")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { apiPosts = mapApiPosts(d.items || []); renderCalendar(); })
      .catch(function ()  { apiPosts = null; renderCalendar(); });
  }

  function loadFeed(forceSync) {
    var feedEl = document.getElementById("socialFeedSection");
    if (feedEl) feedEl.innerHTML = '<div class="social-feed-loading">Loading\u2026</div>';

    var url = "/api/social/feed?limit=60";
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        feedPosts = d.items || [];
        feedMeta  = d.meta  || {};
        renderFeed();
      })
      .catch(function () {
        feedPosts = [];
        feedMeta  = {};
        renderFeed();
      });
  }

  /* ── Tab management ─────────────────────────────────────────────────── */
  function renderTabs() {
    var body = document.getElementById("socialBody");
    if (!body) return;

    var existing = document.getElementById("socialTabBar");
    if (!existing) {
      var bar = document.createElement("div");
      bar.id        = "socialTabBar";
      bar.className = "social-tabs";
      bar.innerHTML =
        '<button class="social-tab-btn' + (activeTab === "feed" ? " active" : "") + '" onclick="window._socialSwitchTab(\'feed\')">' + L.tabFeed + '</button>' +
        '<button class="social-tab-btn' + (activeTab === "planner" ? " active" : "") + '" onclick="window._socialSwitchTab(\'planner\')">' + L.tabPlanner + '</button>';
      body.appendChild(bar);
    }

    // Create content containers if missing
    var feedEl = document.getElementById("socialFeedSection");
    if (!feedEl) {
      feedEl    = document.createElement("div");
      feedEl.id = "socialFeedSection";
      body.appendChild(feedEl);
    }

    var calEl = document.getElementById("socialCalSection");
    if (!calEl) {
      calEl    = document.createElement("div");
      calEl.id = "socialCalSection";
      body.appendChild(calEl);
    }

    applyTabVisibility();
  }

  function applyTabVisibility() {
    var feedEl = document.getElementById("socialFeedSection");
    var calEl  = document.getElementById("socialCalSection");
    if (feedEl) feedEl.style.display = activeTab === "feed" ? "" : "none";
    if (calEl)  calEl.style.display  = activeTab === "planner" ? "" : "none";

    document.querySelectorAll(".social-tab-btn").forEach(function (btn, i) {
      var tab = i === 0 ? "feed" : "planner";
      btn.classList.toggle("active", tab === activeTab);
    });
  }

  window._socialSwitchTab = function (tab) {
    if (tab === activeTab) return;
    activeTab = tab;
    applyTabVisibility();
    if (tab === "feed" && feedPosts === null) loadFeed();
    if (tab === "planner" && apiPosts === null) loadPosts();
  };

  /* ── Render: Connected Accounts ─────────────────────────────────────── */
  function renderAccounts() {
    var body = document.getElementById("socialBody");
    if (!body) return;
    var section = document.getElementById("socialAccountsSection");
    if (!section) {
      section    = document.createElement("div");
      section.id = "socialAccountsSection";
      body.insertBefore(section, body.firstChild);
    }

    var connCount = providers.filter(function (p) { return p.connected; }).length;
    var total     = 5;

    var html = '<div class="social-accounts-wrap">';
    html += '<div class="social-accounts-header">';
    html += '<span class="social-accounts-title">' + L.connectedAccounts + '</span>';
    html += '<span class="social-accounts-badge">' + connCount + '\u202f/\u202f' + total + ' connected</span>';
    html += '</div>';
    html += '<div class="social-accounts-grid">';

    ["ig","fb","yt","li","tk"].forEach(function (key) {
      var apiId     = PLATFORM_IDS[key];
      var prov      = providers.find(function (p) { return p.id === apiId; }) || { connected: false };
      var connected = !!prov.connected;
      var abbr      = PLATFORM_NAMES[key].slice(0, 2).toUpperCase();

      html += '<div class="social-connect-card">';
      html += '<div class="social-connect-card-top">';
      html += '<div class="social-post-platform ' + PLATFORM_CLASSES[key] + ' scc-icon">' + abbr + '</div>';
      html += '<div class="social-connect-info">';
      html += '<div class="social-connect-name">' + PLATFORM_NAMES[key] + '</div>';
      html += '<div class="social-connect-status ' + (connected ? "status-connected" : "status-disconnected") + '">';
      html += '<span class="status-dot"></span>' + (connected ? L.connected : L.disconnected);
      if (connected && prov.post_count) html += ' <span class="social-post-badge">' + prov.post_count + ' posts</span>';
      html += '</div></div>';
      html += '<div style="display:flex;gap:6px">';
      html += '<button class="btn btn-sm ' + (connected ? "btn-outline" : "btn-primary") + '" onclick="window._socialConnect(\'' + key + '\')">';
      html += connected ? L.update : L.connect;
      html += '</button>';
      if (connected) {
        html += '<button class="btn btn-sm btn-ghost" title="' + L.disconnect + '" onclick="window._socialDisconnect(\'' + key + '\')">&times;</button>';
      }
      html += '</div></div></div>';
    });

    html += '</div></div>';
    section.innerHTML = html;
  }

  /* ── Render: Live Feed ──────────────────────────────────────────────── */
  function renderFeed() {
    var el = document.getElementById("socialFeedSection");
    if (!el) return;

    var connectedProviders = providers.filter(function (p) { return p.connected; });
    var html = '';

    // Sync bar
    html += '<div class="social-sync-bar">';
    html += '<div class="social-sync-meta">';
    if (connectedProviders.length === 0) {
      html += '<span style="color:var(--text-dim)">Connect accounts above to see your live social feed.</span>';
    } else {
      connectedProviders.forEach(function (prov) {
        var key  = API_TO_KEY[prov.id] || prov.id;
        var meta = feedMeta[prov.id] || {};
        var ago  = meta.last_sync_at ? timeAgo(meta.last_sync_at) : 'never';
        var sync = syncingSet[prov.id];
        html += '<span class="social-sync-chip ' + (PLATFORM_CLASSES[key] || '') + '">';
        html += PLATFORM_NAMES[key] || prov.id;
        html += ' &bull; ' + (sync ? '<span class="sync-spin">&#8635;</span>' + L.syncing : L.lastSync + ' ' + ago);
        html += '</span>';
      });
    }
    html += '</div>';
    if (connectedProviders.length > 0) {
      html += '<button class="btn btn-sm btn-outline" onclick="window._socialSyncAll()">' + L.syncAll + '</button>';
    }
    html += '</div>';

    // Filter bar
    if ((feedPosts || []).length > 0) {
      html += '<div class="filter-group" style="margin:16px 0 12px">';
      ["all","ig","fb","yt","li","tk"].forEach(function (v) {
        var lbl    = v === "all" ? L.allPlatforms : PLATFORM_NAMES[v];
        var active = feedFilter === v ? " active" : "";
        html += '<button class="filter-btn' + active + '" data-feed-filter="' + v + '">' + lbl + '</button>';
      });
      html += '</div>';
    }

    // Post grid
    var posts = (feedPosts || []).filter(function (p) {
      if (feedFilter === "all") return true;
      var key = API_TO_KEY[p.provider] || p.provider;
      return key === feedFilter;
    });

    if (!feedPosts || feedPosts.length === 0) {
      html += '<div class="social-feed-empty">' + L.noFeedPosts + '</div>';
    } else if (posts.length === 0) {
      html += '<div class="social-feed-empty">No posts for this platform.</div>';
    } else {
      html += '<div class="social-feed-grid">';
      posts.forEach(function (p) {
        html += renderFeedCard(p);
      });
      html += '</div>';
    }

    el.innerHTML = html;

    // Wire filter buttons
    el.querySelectorAll("[data-feed-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        feedFilter = this.getAttribute("data-feed-filter");
        renderFeed();
      });
    });
  }

  function renderFeedCard(p) {
    var key     = API_TO_KEY[p.provider] || p.provider;
    var abbr    = (PLATFORM_NAMES[key] || p.provider).slice(0, 2).toUpperCase();
    var caption = p.caption ? escHtml(p.caption).slice(0, 160) + (p.caption.length > 160 ? "\u2026" : "") : "";
    var dateStr = p.published_at ? fmtDate(p.published_at) : "";

    var html = '<div class="social-feed-card">';

    // Thumbnail or platform color header
    if (p.thumbnail_url || p.media_url) {
      html += '<div class="social-feed-thumb">';
      html += '<img src="' + escHtml(p.thumbnail_url || p.media_url) + '" alt="" loading="lazy" onerror="this.parentNode.className=\'social-feed-thumb-fallback ' + PLATFORM_CLASSES[key] + '\';">';
      html += '<div class="social-feed-platform-badge ' + PLATFORM_CLASSES[key] + '">' + abbr + '</div>';
      html += '</div>';
    } else {
      html += '<div class="social-feed-thumb-fallback ' + PLATFORM_CLASSES[key] + '">';
      html += '<span class="social-feed-platform-big">' + abbr + '</span>';
      html += '</div>';
    }

    html += '<div class="social-feed-card-body">';

    // Platform + date header
    html += '<div class="social-feed-card-header">';
    html += '<span class="social-feed-pname ' + PLATFORM_CLASSES[key] + '-text">' + (PLATFORM_NAMES[key] || p.provider) + '</span>';
    if (dateStr) html += '<span class="social-feed-date">' + dateStr + '</span>';
    html += '</div>';

    if (caption) html += '<p class="social-feed-caption">' + caption + '</p>';

    // Metrics
    var metrics = [];
    if (p.likes_count)    metrics.push('<span class="social-metric"><span class="metric-icon">&#9829;</span>' + fmtNum(p.likes_count) + ' ' + L.likes + '</span>');
    if (p.comments_count) metrics.push('<span class="social-metric"><span class="metric-icon">&#128172;</span>' + fmtNum(p.comments_count) + ' ' + L.comments + '</span>');
    if (p.shares_count)   metrics.push('<span class="social-metric"><span class="metric-icon">&#8635;</span>' + fmtNum(p.shares_count) + ' ' + L.shares + '</span>');
    if (p.views_count)    metrics.push('<span class="social-metric"><span class="metric-icon">&#128065;</span>' + fmtNum(p.views_count) + ' ' + L.views + '</span>');

    if (metrics.length) html += '<div class="social-feed-metrics">' + metrics.join('') + '</div>';

    if (p.permalink) {
      html += '<a class="social-feed-link" href="' + escHtml(p.permalink) + '" target="_blank" rel="noopener">' + L.viewPost + ' &rarr;</a>';
    }

    html += '</div></div>';
    return html;
  }

  /* ── Render: Planner Calendar ───────────────────────────────────────── */
  function renderCalendar() {
    var cal = document.getElementById("socialCalSection");
    if (!cal) return;

    var posts  = apiPosts !== null ? apiPosts : DEMO_POSTS;
    var today  = new Date();
    var monday = getMonday(today);
    var html   = "";

    html += '<div class="filter-group" style="margin:20px 0 16px">';
    ["all","ig","fb","yt","li","tk"].forEach(function (v) {
      var lbl = v === "all" ? L.allPlatforms : PLATFORM_NAMES[v];
      var active = activeFilter === v ? " active" : "";
      html += '<button class="filter-btn' + active + '" data-filter="' + v + '">' + lbl + '</button>';
    });
    html += '</div>';

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
      html += '<p style="margin-top:10px;font-size:11px;color:var(--text-muted);text-align:center">Demo data &mdash; connect accounts and sync to see live scheduled posts</p>';
    }

    cal.innerHTML = html;
    cal.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = this.getAttribute("data-filter");
        renderCalendar();
      });
    });
  }

  /* ── Sync ───────────────────────────────────────────────────────────── */
  window._socialSyncAll = function () {
    providers.filter(function (p) { return p.connected; }).forEach(function (p) {
      syncingSet[p.id] = true;
    });
    renderFeed();

    fetch("/api/social/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () {
        syncingSet = {};
        feedPosts  = null;
        loadFeed();
        loadProviders();
      })
      .catch(function () {
        syncingSet = {};
        renderFeed();
      });
  };

  window._socialSyncOne = function (providerApi) {
    syncingSet[providerApi] = true;
    renderFeed();

    fetch("/api/social/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: providerApi })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () {
        delete syncingSet[providerApi];
        feedPosts = null;
        loadFeed();
        loadProviders();
      })
      .catch(function () {
        delete syncingSet[providerApi];
        renderFeed();
      });
  };

  /* ── Connect modal ──────────────────────────────────────────────────── */
  function buildModal() {
    if (document.getElementById("socialConnectOverlay")) return;
    var wrap       = document.createElement("div");
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
    var inputs   = document.getElementById("socialCredForm").querySelectorAll("input");
    var fields   = {}, hasValue = false;
    inputs.forEach(function (inp) {
      var v = inp.value.trim();
      if (v) { fields[inp.name] = v; hasValue = true; }
    });
    if (!hasValue) return;

    var btn          = document.getElementById("socialSaveBtn");
    btn.disabled     = true;
    btn.textContent  = L.saving;

    fetch("/api/social/credentials", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ provider: PLATFORM_IDS[connectingKey], fields: fields })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () {
        btn.textContent = L.saved;
        setTimeout(function () {
          window._socialCloseModal();
          feedPosts = null;
          loadProviders();
        }, 900);
      })
      .catch(function (err) {
        btn.disabled    = false;
        btn.textContent = L.save;
        alert("Error saving credentials (" + err + "). Make sure you are logged in.");
      });
  };

  window._socialDisconnect = function (key) {
    if (!confirm("Disconnect " + PLATFORM_NAMES[key] + "? All cached posts will be removed.")) return;
    fetch("/api/social/credentials", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ provider: PLATFORM_IDS[key] })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () { feedPosts = null; loadProviders(); })
      .catch(function () { alert("Error disconnecting. Try again."); });
  };

  window._socialCloseModal = function () {
    var ov = document.getElementById("socialConnectOverlay");
    if (ov) ov.style.display = "none";
    connectingKey = null;
  };

  window._socialNewPost = function () {
    alert("New Post composer \u2014 coming soon!");
  };

  /* ── Planner utils ──────────────────────────────────────────────────── */
  function mapApiPosts(rows) {
    var monday = getMonday(new Date());
    var result = [];
    rows.forEach(function (p) {
      if (!p.scheduled_at) return;
      var d    = new Date(p.scheduled_at.replace(" ", "T"));
      var diff = Math.floor((d - monday) / 86400000);
      if (diff < 0 || diff > 6) return;
      var provs = [];
      try { provs = JSON.parse(p.providers) || []; } catch (ex) { provs = []; }
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

  function fmtDate(iso) {
    var d = new Date(iso.replace(" ", "T") + (iso.length === 19 ? "Z" : ""));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function timeAgo(iso) {
    var then  = new Date(iso.replace(" ", "T") + (iso.length === 19 ? "Z" : ""));
    var diff  = Math.floor((Date.now() - then.getTime()) / 1000);
    if (diff < 60)   return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400)return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  function fmtNum(n) {
    n = parseInt(n, 10) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

})();
