/* Social Connect Wizard — v1
   Guides clients step-by-step through connecting each social media platform.
   Calls POST /api/social/credentials to save credentials.
*/
(function () {
  "use strict";

  /* ── Platform registry ─────────────────────────────────────────────── */
  var PLATFORMS = {
    ig: {
      name: "Instagram",
      cls: "platform-ig",
      abbr: "IG",
      desc: "Connect your Instagram Business account to schedule posts and view analytics.",
      time: "~10 min",
      fields: [
        { key: "ig_user_id",      label: "Instagram User ID",  placeholder: "17841400008460056", secret: false,
          hint: "Your numeric IG Business account ID" },
        { key: "ig_access_token", label: "Access Token",       placeholder: "EAAxxxxxxxxx…",      secret: true,
          hint: "Long-lived token from Graph API Explorer" }
      ],
      steps: [
        {
          title: "Set up a Meta Developer App",
          detail: 'Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener">developers.facebook.com/apps</a> and create a new app. Choose <strong>Business</strong> type. Add the <strong>Instagram Graph API</strong> product.'
        },
        {
          title: "Open Graph API Explorer",
          detail: 'Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener">Graph API Explorer</a>. Select your app from the top-right dropdown. Click <strong>Generate Access Token</strong> and authorize with your Instagram Business account.'
        },
        {
          title: "Add the required permissions",
          detail: 'In the Permissions panel, add: <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_show_list</code>. Then click <strong>Generate Access Token</strong> again to include the new scopes.'
        },
        {
          title: "Exchange for a long-lived token",
          detail: 'In Explorer, run this call: <code>GET /oauth/access_token?grant_type=fb_exchange_token&amp;client_id={APP_ID}&amp;client_secret={APP_SECRET}&amp;fb_exchange_token={SHORT_TOKEN}</code>. Copy the returned long-lived token — it lasts 60 days.'
        },
        {
          title: "Get your Instagram User ID",
          detail: 'Run <code>GET /me/accounts</code> in Explorer. From the response, note the connected Instagram Business Account. Then run <code>GET /{page-id}?fields=instagram_business_account</code> and copy the <code>id</code> value inside <code>instagram_business_account</code>.'
        },
        {
          title: "Paste your credentials below",
          detail: "Enter your Instagram User ID and the long-lived access token in the form below, then click Save."
        }
      ]
    },

    fb: {
      name: "Facebook",
      cls: "platform-fb",
      abbr: "FB",
      desc: "Connect your Facebook Business Page to publish posts and track engagement.",
      time: "~8 min",
      fields: [
        { key: "fb_page_id",    label: "Page ID",           placeholder: "123456789010",   secret: false,
          hint: "Found in your Page's About section or URL" },
        { key: "fb_page_token", label: "Page Access Token", placeholder: "EAAxxxxxxxxx…",  secret: true,
          hint: "Long-lived token for your Business Page" }
      ],
      steps: [
        {
          title: "Open Graph API Explorer",
          detail: 'Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener">developers.facebook.com/tools/explorer</a> and log in with the account that manages your Business Page.'
        },
        {
          title: "Select your app and get a token",
          detail: 'Choose your Meta app from the top-right dropdown. Click <strong>Generate Access Token</strong>. When prompted, grant permissions for your Business Page.'
        },
        {
          title: "Add Pages permissions",
          detail: 'In the Permissions panel add: <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>pages_show_list</code>. Regenerate the token to include them.'
        },
        {
          title: "Get your Page Access Token",
          detail: 'Run <code>GET /me/accounts</code> in Explorer. Find your page in the response. Copy the <code>access_token</code> value for that page — this is your long-lived Page Access Token.'
        },
        {
          title: "Get your Page ID",
          detail: 'The <code>id</code> field next to your page name in the <code>/me/accounts</code> response is your Page ID. You can also find it in your Facebook Page URL: <code>facebook.com/{page-name-or-id}</code>.'
        },
        {
          title: "Paste your credentials below",
          detail: "Enter the Page ID and Page Access Token in the form below, then click Save."
        }
      ]
    },

    yt: {
      name: "YouTube",
      cls: "platform-yt",
      abbr: "YT",
      desc: "Connect your YouTube channel to schedule video uploads and monitor performance.",
      time: "~15 min",
      fields: [
        { key: "yt_channel_id",    label: "Channel ID",          placeholder: "UCxxxxxxxxxx…",              secret: false,
          hint: "Visible in YouTube Studio URL after /channel/" },
        { key: "yt_client_id",     label: "OAuth Client ID",     placeholder: "xxxx.apps.googleusercontent.com", secret: false,
          hint: "From Google Cloud Console OAuth credentials" },
        { key: "yt_client_secret", label: "OAuth Client Secret", placeholder: "GOCSPX-xxxxx…",              secret: true,
          hint: "From Google Cloud Console OAuth credentials" },
        { key: "yt_access_token",  label: "Access Token",        placeholder: "ya29.xxxxxxxx…",             secret: true,
          hint: "Short-lived token from OAuth Playground" },
        { key: "yt_refresh_token", label: "Refresh Token",       placeholder: "1//xxxxxxxxx…",              secret: true,
          hint: "Long-lived token — keeps access alive automatically" }
      ],
      steps: [
        {
          title: "Create a Google Cloud project",
          detail: 'Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">console.cloud.google.com</a>. Create a new project (e.g. "Social Posting"). In the left menu, go to <strong>APIs & Services → Library</strong> and enable <strong>YouTube Data API v3</strong>.'
        },
        {
          title: "Create OAuth 2.0 credentials",
          detail: 'Go to <strong>APIs & Services → Credentials</strong>. Click <strong>Create Credentials → OAuth client ID</strong>. Choose <strong>Web application</strong>. Under <em>Authorized redirect URIs</em>, add: <code>https://developers.google.com/oauthplayground</code>. Copy the Client ID and Client Secret.'
        },
        {
          title: "Get tokens via OAuth Playground",
          detail: 'Open <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener">OAuth 2.0 Playground</a>. Click the ⚙️ gear icon (top right) → check <strong>"Use your own OAuth credentials"</strong> → paste your Client ID and Secret.'
        },
        {
          title: "Authorize your YouTube channel",
          detail: 'In the left panel, scroll to <strong>YouTube Data API v3</strong> and select <code>https://www.googleapis.com/auth/youtube</code>. Click <strong>Authorize APIs</strong> and log in with the Google account that owns your channel. Allow access.'
        },
        {
          title: "Exchange for tokens",
          detail: 'Click <strong>Exchange authorization code for tokens</strong>. Copy the <strong>Access token</strong> and <strong>Refresh token</strong> from the response panel.'
        },
        {
          title: "Find your Channel ID",
          detail: 'Open <a href="https://studio.youtube.com" target="_blank" rel="noopener">YouTube Studio</a>. The URL will show: <code>studio.youtube.com/channel/<strong>UC…</strong></code>. That UC… string is your Channel ID.'
        },
        {
          title: "Paste your credentials below",
          detail: "Enter all five values in the form below, then click Save. The system will auto-refresh your access token using the refresh token."
        }
      ]
    },

    li: {
      name: "LinkedIn",
      cls: "platform-li",
      abbr: "LI",
      desc: "Connect your LinkedIn Company Page to publish thought leadership content.",
      time: "~12 min",
      fields: [
        { key: "li_access_token", label: "OAuth Access Token", placeholder: "AQVxxxxxxxxx…",          secret: true,
          hint: "OAuth token with organization social scopes" },
        { key: "li_urn",          label: "Company Page URN",   placeholder: "urn:li:organization:12345", secret: false,
          hint: "Your LinkedIn Company Page URN" }
      ],
      steps: [
        {
          title: "Create a LinkedIn Developer App",
          detail: 'Go to <a href="https://www.linkedin.com/developers/apps/new" target="_blank" rel="noopener">linkedin.com/developers/apps/new</a>. Enter your app name and select your Company Page. Complete the verification if prompted.'
        },
        {
          title: "Request required products",
          detail: 'In your app settings, go to the <strong>Products</strong> tab. Request access to: <strong>Share on LinkedIn</strong> and <strong>Marketing Developer Platform</strong>. Approval is usually instant for Share on LinkedIn.'
        },
        {
          title: "Configure OAuth settings",
          detail: 'Under <strong>Auth → OAuth 2.0 settings</strong>, add a redirect URL (you can use <code>https://netwebmedia.com</code> as a placeholder). Note your Client ID and Client Secret.'
        },
        {
          title: "Generate an access token",
          detail: 'Use the <strong>OAuth Token Tool</strong> in the developer portal (Auth tab → OAuth Tools) or construct the URL: <code>https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={ID}&redirect_uri={URI}&scope=r_organization_social%20w_organization_social</code>. Complete the auth flow and exchange the code for a token.'
        },
        {
          title: "Find your Company Page URN",
          detail: 'After getting your token, call: <code>GET https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee</code> with header <code>Authorization: Bearer {token}</code>. The <code>organizationalTarget</code> field is your URN (format: <code>urn:li:organization:12345</code>).'
        },
        {
          title: "Paste your credentials below",
          detail: "Enter the OAuth token and Company URN below, then click Save. Note: LinkedIn tokens expire after 60 days and need manual renewal."
        }
      ]
    },

    tk: {
      name: "TikTok",
      cls: "platform-tk",
      abbr: "TK",
      desc: "Connect your TikTok account to post videos and reach a younger audience.",
      time: "~20 min (sandbox review required)",
      fields: [
        { key: "tt_access_token", label: "Access Token", placeholder: "att.xxxxxxxxxx…", secret: true,
          hint: "TikTok Content Posting API access token" }
      ],
      steps: [
        {
          title: "Create a TikTok Developer App",
          detail: 'Go to <a href="https://developers.tiktok.com/" target="_blank" rel="noopener">developers.tiktok.com</a> and log in. Click <strong>Manage Apps → Create an App</strong>. Fill in app details and select <strong>Content Posting API</strong> as the product.'
        },
        {
          title: "Apply for Content Posting API access",
          detail: 'In your app dashboard, go to <strong>Products → Content Posting API</strong> and submit an access request. TikTok reviews these manually — approval can take 1–5 business days. You\'ll need to describe your use case.'
        },
        {
          title: "Configure OAuth settings",
          detail: 'Under <strong>Login Kit → Redirect Domain</strong>, add your domain. Note your Client Key and Client Secret from the app settings page.'
        },
        {
          title: "Complete the OAuth flow",
          detail: 'Build or use an OAuth flow tool to generate an authorization URL: <code>https://www.tiktok.com/v2/auth/authorize?client_key={KEY}&scope=video.upload&response_type=code&redirect_uri={URI}</code>. Complete the auth, then exchange the code for an access token via <code>POST /v2/oauth/token/</code>.'
        },
        {
          title: "Paste your access token below",
          detail: "Enter the access token in the form below and click Save. TikTok tokens expire after 24 hours — you will need to reconnect regularly until refresh token support is added."
        }
      ]
    }
  };

  /* ── State ──────────────────────────────────────────────────────────── */
  var providers    = [];   // from GET /api/social/providers
  var selectedKey  = null; // active platform key
  var saving       = false;

  /* ── Boot ───────────────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader(
      "Connect Social Media",
      '<a class="btn btn-outline btn-sm" href="social.html">&#8592; Back to Social Planner</a>'
    );
    loadProviders();
  });

  /* ── Load connection status ─────────────────────────────────────────── */
  function loadProviders() {
    var body = document.getElementById("scwBody");
    body.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-size:14px">Loading…</div>';

    fetch("/api/social/providers")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        providers = d.items || [];
        if (selectedKey) renderGuide(selectedKey);
        else renderSelector();
      })
      .catch(function () {
        providers = [];
        if (selectedKey) renderGuide(selectedKey);
        else renderSelector();
      });
  }

  /* ── Render: platform selector ──────────────────────────────────────── */
  function renderSelector() {
    var connCount = providers.filter(function (p) { return p.connected; }).length;
    var total     = Object.keys(PLATFORMS).length;

    var html = '<div class="scw-wrap">';

    // Status bar
    html += '<div class="scw-status-bar">';
    html += '<span class="scw-status-bar-text"><strong>' + connCount + ' of ' + total + '</strong> platforms connected</span>';
    html += '<div class="scw-status-chips">';
    Object.keys(PLATFORMS).forEach(function (key) {
      var p    = providerByKey(key);
      var on   = p && p.connected;
      var name = PLATFORMS[key].name;
      html += '<span class="scw-chip ' + (on ? 'scw-chip-on' : 'scw-chip-off') + '">' + name + '</span>';
    });
    html += '</div></div>';

    // Headline
    html += '<h1 class="scw-headline">Connect Your Social Media</h1>';
    html += '<p class="scw-sub">Choose a platform below and follow the step-by-step guide to link it to your CRM account.</p>';

    // Grid
    html += '<div class="scw-platform-grid">';
    Object.keys(PLATFORMS).forEach(function (key) {
      var p    = PLATFORMS[key];
      var prov = providerByKey(key);
      var conn = prov && prov.connected;

      html += '<div class="scw-platform-card' + (conn ? ' is-connected' : '') + '" onclick="window._scwSelect(\'' + key + '\')">';
      html += '<div class="scw-platform-icon ' + p.cls + '">' + p.abbr + '</div>';
      html += '<div>';
      html += '<div class="scw-platform-name">' + p.name + '</div>';
      html += '<div class="scw-platform-desc">' + p.desc + '</div>';
      html += '</div>';
      html += '<div class="scw-platform-action">';
      if (conn) html += 'Update credentials &rarr;';
      else      html += 'Connect ' + p.name + ' &rarr;';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Callout
    html += '<div class="scw-callout">';
    html += '<span class="scw-callout-icon">&#128274;</span>';
    html += '<span>All credentials are stored securely and never shared. Tokens are encrypted in your organization\'s database and used only to publish on your behalf.</span>';
    html += '</div>';

    html += '</div>'; // scw-wrap
    document.getElementById("scwBody").innerHTML = html;
  }

  /* ── Render: guide + form for a platform ───────────────────────────── */
  function renderGuide(key) {
    selectedKey = key;
    var p    = PLATFORMS[key];
    var prov = providerByKey(key);
    var conn = prov && prov.connected;

    var html = '<div class="scw-wrap">';

    // Back
    html += '<button class="scw-back" onclick="window._scwBack()">&#8592; All platforms</button>';

    // Guide card
    html += '<div class="scw-guide">';

    // Header
    html += '<div class="scw-guide-header">';
    html += '<div class="scw-guide-icon ' + p.cls + '">' + p.abbr + '</div>';
    html += '<div>';
    html += '<h2 class="scw-guide-title">Connect ' + p.name + '</h2>';
    html += '<div class="scw-guide-subtitle">Estimated time: ' + p.time + (conn ? ' &nbsp;&#10003; Currently connected' : '') + '</div>';
    html += '</div></div>';

    html += '<div class="scw-guide-body">';

    // Callout
    html += '<div class="scw-callout">';
    html += '<span class="scw-callout-icon">&#128712;</span>';
    html += '<span>Follow each step in order. If you get stuck, our team can help — just open the chat widget below.</span>';
    html += '</div>';

    // Steps
    html += '<ol class="scw-steps">';
    p.steps.forEach(function (s, i) {
      html += '<li class="scw-step">';
      html += '<div class="scw-step-num">' + (i + 1) + '</div>';
      html += '<div class="scw-step-content">';
      html += '<div class="scw-step-title">' + s.title + '</div>';
      html += '<p class="scw-step-detail">' + s.detail + '</p>';
      html += '</div></li>';
    });
    html += '</ol>';

    // Credential form
    html += '<hr class="scw-form-divider">';
    html += '<div class="scw-form-title">Enter Your Credentials</div>';

    html += '<form id="scwForm" onsubmit="window._scwSave(event)">';
    p.fields.forEach(function (f) {
      html += '<div class="scw-field">';
      html += '<div class="scw-label">';
      html += '<span class="scw-label-text">' + f.label + '</span>';
      html += '<span class="scw-label-hint">' + f.hint + '</span>';
      html += '</div>';
      html += '<div class="scw-input-wrap">';
      html += '<input class="form-input scw-input" id="scw_' + f.key + '" type="' + (f.secret ? 'password' : 'text') + '" name="' + f.key + '" placeholder="' + f.placeholder + '" autocomplete="off">';
      if (f.secret) {
        html += '<button type="button" class="scw-toggle-vis" onclick="window._scwToggleVis(\'' + f.key + '\')" title="Show/hide">&#128065;</button>';
      }
      html += '</div></div>';
    });

    html += '<div class="scw-actions">';
    html += '<button type="submit" class="btn btn-primary" id="scwSaveBtn">Save & Connect</button>';
    html += '<button type="button" class="btn btn-outline" onclick="window._scwBack()">Cancel</button>';
    html += '<span class="scw-status" id="scwStatus"></span>';
    html += '</div>';
    html += '</form>';

    html += '</div></div>'; // guide-body + guide

    html += '</div>'; // scw-wrap
    document.getElementById("scwBody").innerHTML = html;
  }

  /* ── Render: success state ──────────────────────────────────────────── */
  function renderSuccess(key) {
    var p    = PLATFORMS[key];
    var body = document.getElementById("scwBody");

    // Keep the guide visible, append success banner
    var banner = document.createElement("div");
    banner.className = "scw-success-banner";
    banner.innerHTML =
      '<div class="scw-success-icon">&#9989;</div>' +
      '<div class="scw-success-title">' + p.name + ' Connected!</div>' +
      '<div class="scw-success-sub">Your credentials have been saved. You can now schedule ' + p.name + ' posts from the Social Planner.</div>' +
      '<div class="scw-success-actions">' +
      '<a href="social.html" class="btn btn-white">Open Social Planner</a>' +
      '<button class="btn btn-white-outline" onclick="window._scwBack()">Connect Another Platform</button>' +
      '</div>';

    var wrap = body.querySelector(".scw-wrap");
    if (wrap) wrap.appendChild(banner);
    else      body.appendChild(banner);
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function providerByKey(key) {
    var apiId = { ig: "instagram", fb: "facebook", yt: "youtube", li: "linkedin", tk: "tiktok" }[key];
    return providers.find(function (p) { return p.id === apiId; }) || null;
  }

  /* ── Global handlers ────────────────────────────────────────────────── */
  window._scwSelect = function (key) {
    selectedKey = key;
    renderGuide(key);
  };

  window._scwBack = function () {
    selectedKey = null;
    loadProviders(); // refresh status then render selector
  };

  window._scwToggleVis = function (fieldKey) {
    var input = document.getElementById("scw_" + fieldKey);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  };

  window._scwSave = function (e) {
    e.preventDefault();
    if (saving) return;

    var key    = selectedKey;
    var p      = PLATFORMS[key];
    var form   = document.getElementById("scwForm");
    var btn    = document.getElementById("scwSaveBtn");
    var status = document.getElementById("scwStatus");

    // Collect fields
    var fields = {};
    var missing = [];
    p.fields.forEach(function (f) {
      var val = (form.elements[f.key] || {}).value || "";
      if (val.trim()) {
        fields[f.key] = val.trim();
      } else {
        missing.push(f.label);
      }
    });

    if (missing.length) {
      status.className   = "scw-status error";
      status.textContent = "Please fill in: " + missing.join(", ");
      return;
    }

    saving             = true;
    btn.disabled       = true;
    btn.textContent    = "Saving…";
    status.className   = "scw-status saving";
    status.textContent = "Saving credentials…";

    var apiId = { ig: "instagram", fb: "facebook", yt: "youtube", li: "linkedin", tk: "tiktok" }[key];

    fetch("/api/social/credentials", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ provider: apiId, fields: fields })
    })
      .then(function (r) { return r.ok ? r.json() : r.json().then(function(d){ throw d; }); })
      .then(function () {
        saving          = false;
        btn.disabled    = false;
        btn.textContent = "Save & Connect";
        status.className   = "scw-status success";
        status.textContent = "Saved successfully!";
        // Refresh providers list then show success banner
        fetch("/api/social/providers")
          .then(function (r) { return r.ok ? r.json() : {}; })
          .then(function (d) { providers = (d.items) || providers; })
          .finally(function () { renderSuccess(key); });
      })
      .catch(function (err) {
        saving          = false;
        btn.disabled    = false;
        btn.textContent = "Save & Connect";
        status.className   = "scw-status error";
        var msg = (err && err.error) ? err.error : "Save failed. Check that all fields are correct.";
        status.textContent = msg;
      });
  };

})();
