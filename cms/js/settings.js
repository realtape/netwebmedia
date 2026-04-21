/* Settings */
(function () {
  "use strict";

  function sectionCard(title, rowsHtml) {
    var html = '<div class="card settings-card">';
    html += '<div class="card-header"><div class="card-title">' + title + '</div><button class="btn btn-secondary">Edit</button></div>';
    html += '<div class="settings-body">' + rowsHtml + '</div>';
    html += '</div>';
    return html;
  }

  function row(label, value) {
    return '<div class="settings-row"><div class="sr-label">' + label + '</div><div class="sr-value">' + value + '</div></div>';
  }

  function general() {
    var html = "";
    html += row("Site name", "NetWeb Media");
    html += row("Primary URL", '<code class="url-code">https://netwebmedia.com</code>');
    html += row("Timezone", "America/New_York");
    html += row("Default language", "English (en-US)");
    return sectionCard("General", html);
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
    html += row("Add domain", '<button class="btn btn-secondary">' + CMS_APP.ICONS.plus + ' Connect domain</button>');
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
      html += '<div class="integ-main"><div class="integ-name">' + it.name + '</div><div class="integ-sub muted small">' + it.sub + '</div></div>';
      html += '<div><span class="status-badge ' + badgeCls + '">' + it.state + '</span> ';
      html += '<button class="btn btn-secondary">' + (it.state === "connected" ? "Manage" : "Connect") + '</button></div>';
      html += '</div>';
    }
    return sectionCard("Integrations", html);
  }

  function keys() {
    var html = "";
    html += row("CMS API key", '<code>nwm_live_xxxxxxxxxxxx7a4f</code>');
    html += row("Publishing webhook", '<code>whsec_xxxxxxxxxxxx9e2c</code>');
    html += row("GA4 Measurement ID", '<code>G-XXXXXXXXXX</code>');
    return sectionCard("API Keys", html);
  }

  function team() {
    var owners = ["Isabella Torres (Owner)", "David Kim (Admin)", "Sofia Martínez (Editor)", "Marcus Chen (Editor)"];
    var html = "";
    for (var i = 0; i < owners.length; i++) {
      html += '<div class="settings-row"><div class="sr-label">' + owners[i].split(" (")[0] + '</div><div class="sr-value">' + owners[i].split("(")[1].replace(")", "") + '</div></div>';
    }
    return sectionCard("Team", html);
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Settings", "", "Configure your CMS, domains, integrations, and team");
    var html = general() + branding() + domains() + integrations() + keys() + team();
    document.getElementById("settingsMount").innerHTML = html;
  });
})();
