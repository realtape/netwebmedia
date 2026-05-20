/* Settings */
(function () {
  "use strict";

  var SLUG = 'cms_general';
  var current = { id: null, data: {} };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function sectionCard(title, rowsHtml, headRight) {
    var html = '<div class="card settings-card">';
    html += '<div class="card-header"><div class="card-title">' + title + '</div>' + (headRight || '') + '</div>';
    html += '<div class="settings-body">' + rowsHtml + '</div>';
    html += '</div>';
    return html;
  }

  function row(label, value) {
    return '<div class="settings-row"><div class="sr-label">' + label + '</div><div class="sr-value">' + value + '</div></div>';
  }

  function general() {
    var d = current.data || {};
    var html = "";
    html += row("Site name", esc(d.site_name || "NetWeb Media"));
    html += row("Primary URL", '<code class="url-code">' + esc(d.primary_url || "https://netwebmedia.com") + '</code>');
    html += row("Timezone", esc(d.timezone || "America/Santiago"));
    html += row("Default language", esc(d.default_language || "English (en-US)"));
    return sectionCard("General", html, '<button class="btn btn-secondary" id="editGeneral">Edit</button>');
  }

  function branding() {
    var html = "";
    html += row("Primary color (CRM)", '<span class="color-swatch" style="background:#6c5ce7"></span> <code>#6c5ce7</code>');
    html += row("Accent color (CMS)", '<span class="color-swatch" style="background:#10b981"></span> <code>#10b981</code>');
    html += row("Logo", '<div class="logo-placeholder">NWM</div>');
    return sectionCard("Branding", html);
  }

  function domains() {
    var html = "";
    html += row("netwebmedia.com", '<span class="status-badge badge-green">Primary</span> <span class="status-badge badge-green">SSL active</span>');
    html += row("www.netwebmedia.com", '<span class="status-badge badge-blue">Redirect</span>');
    html += row("Hosting", '<span class="muted small">Managed in cPanel at InMotion</span>');
    return sectionCard("Domains", html);
  }

  function integrations() {
    var items = [
      { name: "Hubspot",   state: "connected",    sub: "CRM + forms" },
      { name: "GoHighLevel",state: "connected",   sub: "Marketing automation" },
      { name: "Resend",    state: "connected",    sub: "Transactional email" },
      { name: "Google Analytics 4", state: "connected", sub: "Site analytics" },
      { name: "Slack",     state: "disconnected", sub: "Notifications" },
      { name: "Stripe",    state: "connected",    sub: "Billing" }
    ];
    var html = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var badgeCls = it.state === "connected" ? "badge-green" : "badge-gray";
      html += '<div class="settings-row integ-row">';
      html += '<div class="integ-main"><div class="integ-name">' + esc(it.name) + '</div><div class="integ-sub muted small">' + esc(it.sub) + '</div></div>';
      html += '<div><span class="status-badge ' + badgeCls + '">' + it.state + '</span></div>';
      html += '</div>';
    }
    html += row("", '<span class="muted small">Connections are managed via GitHub Secrets + provider OAuth.</span>');
    return sectionCard("Integrations", html);
  }

  function keys() {
    var html = "";
    html += row("CMS API key", '<code>nwm_live_xxxxxxxxxxxx7a4f</code>');
    html += row("Publishing webhook", '<code>whsec_xxxxxxxxxxxx9e2c</code>');
    html += row("GA4 Measurement ID", '<code>G-XXXXXXXXXX</code>');
    html += row("", '<span class="muted small">Rotate keys via GitHub Secrets, then redeploy.</span>');
    return sectionCard("API Keys", html);
  }

  function team() {
    var owners = ["Isabella Torres (Owner)", "David Kim (Admin)", "Sofia Martínez (Editor)", "Marcus Chen (Editor)"];
    var html = "";
    for (var i = 0; i < owners.length; i++) {
      html += '<div class="settings-row"><div class="sr-label">' + esc(owners[i].split(" (")[0]) + '</div><div class="sr-value">' + esc(owners[i].split("(")[1].replace(")", "")) + '</div></div>';
    }
    return sectionCard("Team", html);
  }

  function renderAll() {
    document.getElementById("settingsMount").innerHTML =
      general() + branding() + domains() + integrations() + keys() + team();
    var b = document.getElementById("editGeneral");
    if (b) b.onclick = openGeneralEditor;
  }

  function openGeneralEditor() {
    var d = current.data || {};
    var body =
      '<label class="lbl">Site name<input class="inp" id="f_site_name" value="' + esc(d.site_name || "NetWeb Media") + '"></label>' +
      '<label class="lbl">Primary URL<input class="inp" id="f_primary_url" value="' + esc(d.primary_url || "https://netwebmedia.com") + '"></label>' +
      '<label class="lbl">Timezone<input class="inp" id="f_timezone" value="' + esc(d.timezone || "America/Santiago") + '"></label>' +
      '<label class="lbl">Default language<input class="inp" id="f_default_language" value="' + esc(d.default_language || "English (en-US)") + '"></label>' +
      '<div class="nwm-modal-foot"><button class="btn btn-primary" id="sSave">Save</button> <button class="btn" id="sCancel">Cancel</button></div>';
    var m = document.createElement("div");
    m.className = "nwm-modal-backdrop";
    m.innerHTML = '<div class="nwm-modal"><div class="nwm-modal-head"><h3>Edit General Settings</h3><button class="nwm-modal-close">×</button></div><div class="nwm-modal-body">' + body + '</div></div>';
    document.body.appendChild(m);
    function close() { m.remove(); }
    m.querySelector(".nwm-modal-close").onclick = close;
    m.addEventListener("click", function (e) { if (e.target === m) close(); });
    m.querySelector("#sCancel").onclick = close;
    m.querySelector("#sSave").onclick = function () {
      if (!(window.NWMApi && NWMApi.create)) { alert("Not signed in — settings can't be saved."); return; }
      var data = {
        site_name: document.getElementById("f_site_name").value.trim(),
        primary_url: document.getElementById("f_primary_url").value.trim(),
        timezone: document.getElementById("f_timezone").value.trim(),
        default_language: document.getElementById("f_default_language").value.trim()
      };
      var payload = { slug: SLUG, title: "CMS General Settings", status: "active", data: data };
      var p = current.id ? NWMApi.update("setting", current.id, payload) : NWMApi.create("setting", payload);
      p.then(function (r) {
        current.data = data;
        if (r && r.id) current.id = r.id;
        close();
        renderAll();
      }).catch(function (e) { alert("Save failed: " + e.message); });
    };
  }

  function loadSettings() {
    if (!(window.NWMApi && NWMApi.list)) { renderAll(); return; }
    NWMApi.list("setting", { q: SLUG, limit: 10 }).then(function (r) {
      var hit = ((r && r.items) || []).find(function (x) { return x.slug === SLUG; });
      if (hit) { current.id = hit.id; current.data = hit.data || {}; }
      renderAll();
    }).catch(function () { renderAll(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Settings", "", "Configure your CMS, domains, integrations, and team");
    renderAll();
    loadSettings();
  });
})();
