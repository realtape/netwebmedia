/* CMS Shared Application Logic */

/* Inject api-client.js if a CMS HTML page didn't load it explicitly.
   Uses document.write so the script is fetched + auto-gate runs before
   any other CMS code executes (legal during parse time). */
(function () {
  if (window.NWMApi) return;
  if (document.readyState !== 'loading') return; // page already past parse
  var here = (document.currentScript && document.currentScript.src) || '';
  var base = here ? here.replace(/\/[^/]*$/, '') + '/' : 'js/';
  document.write('<script src="' + base + 'api-client.js"><' + '/script>');
})();

(function () {
  "use strict";

  var ICONS = {
    dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    pages: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
    blog: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M8 4v16"/></svg>',
    landing: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/><path d="M3 9h6"/><path d="M15 9h6"/></svg>',
    forms: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>',
    templates: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    media: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    seo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>',
    ab: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/><path d="M7 8h1"/><path d="M7 12h1"/><path d="M16 8h1"/><path d="M16 16h1"/></svg>',
    memberships: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="8" cy="15" r="1"/></svg>',
    workflows: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M9 6h6"/><path d="M6 9v3a3 3 0 0 0 3 3h3"/><path d="M18 9v3a3 3 0 0 1-3 3h-3"/></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    chevronLeft: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    filter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    external: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'
  };
  window.CMS_ICONS = ICONS;

  var NAV_ITEMS = [
    { id: "dashboard",    label: "Dashboard",      i18n: "nav_dashboard",      icon: "dashboard",   href: "index.html" },
    { id: "pages",        label: "Pages",          i18n: "nav_pages",          icon: "pages",       href: "pages.html" },
    { id: "blog",         label: "Blog",           i18n: "nav_blog",           icon: "blog",        href: "blog.html" },
    { id: "landing",      label: "Landing Pages",  i18n: "nav_landing",        icon: "landing",     href: "landing-pages.html" },
    { id: "forms",        label: "Forms",          i18n: "nav_forms",          icon: "forms",       href: "forms.html" },
    { id: "templates",    label: "Templates",      i18n: "nav_templates",      icon: "templates",   href: "templates.html" },
    { id: "media",        label: "Media Library",  i18n: "nav_media",          icon: "media",       href: "media.html" },
    { id: "seo",          label: "SEO",            i18n: "nav_seo",            icon: "seo",         href: "seo.html" },
    { id: "workflows",    label: "Workflows",      i18n: "nav_workflows",      icon: "workflows",   href: "workflows.html" },
    { id: "campaigns",    label: "Campaigns",      i18n: "nav_campaigns",      icon: "blog",        href: "campaigns.html" },
    { id: "content-writer", label: "Content Writer", i18n: "nav_content_writer", icon: "blog",      href: "content-writer.html" },
    { id: "knowledge",    label: "Knowledge Base", i18n: "nav_knowledge",      icon: "templates",   href: "knowledge.html" },
    { id: "agents",       label: "AI Agents",      i18n: "nav_agents",         icon: "workflows",   href: "agents.html" },
    { id: "ads",          label: "Paid Ads",       i18n: "nav_ads",            icon: "workflows",   href: "ads.html" },
    { id: "seo-planner",  label: "AI SEO",         i18n: "nav_seo_planner",    icon: "seo",         href: "seo-planner.html" },
    { id: "social",       label: "Social Media",   i18n: "nav_social",         icon: "blog",        href: "social.html" },
    { id: "analytics",    label: "Analytics",      i18n: "nav_analytics",      icon: "dashboard",   href: "analytics.html" },
    { id: "ab-tests",     label: "A/B Tests",      i18n: "nav_ab",             icon: "ab",          href: "ab-tests.html" },
    { id: "memberships",  label: "Memberships",    i18n: "nav_memberships",    icon: "memberships", href: "memberships.html" },
    { id: "settings",     label: "Settings",       i18n: "nav_settings",       icon: "settings",    href: "settings.html" }
  ];
  function LBL(item){ return (window.NWMi18n && window.NWMi18n.t) ? (window.NWMi18n.t(item.i18n) || item.label) : item.label; }

  function getActivePage() {
    var file = (window.location.pathname.split("/").pop() || "index.html");
    if (file === "" || file === "index.html") return "dashboard";
    var p = file.replace(".html", "");
    if (p === "landing-pages") return "landing";
    return p;
  }

  function buildSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    var active = getActivePage();
    var collapsed = localStorage.getItem("cms-sidebar-collapsed") === "true";

    var html = '<div class="sidebar-header">';
    html += '<div class="sidebar-brand">';
    html += '<div class="brand-icon brand-icon-cms">C</div>';
    html += '<span class="brand-text">NetWeb CMS</span>';
    html += '</div>';
    html += '<button class="sidebar-toggle" id="sidebarToggle">' + ICONS.chevronLeft + '</button>';
    html += '</div>';

    html += '<nav class="sidebar-nav">';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      var isActive = item.id === active ? " active" : "";
      var lbl = LBL(item);
      html += '<a href="' + item.href + '" class="nav-item' + isActive + '" title="' + lbl + '">';
      html += '<span class="nav-icon">' + ICONS[item.icon] + '</span>';
      html += '<span class="nav-label" data-i18n="' + item.i18n + '">' + lbl + '</span>';
      html += '</a>';
    }
    html += '</nav>';

    html += '<div class="sidebar-footer">';
    html += '<a href="/crm/" class="service-switch">';
    html += '<div class="switch-dot"></div>';
    html += '<div class="switch-body"><div class="switch-label" data-i18n="switch_to">Switch to</div><div class="switch-name" data-i18n="switch_crm">NetWeb CRM</div></div>';
    html += '</a>';
    html += '<div id="sidebar-lang" style="margin-top:10px;display:flex;justify-content:center;"></div>';
    html += '</div>';

    sidebar.innerHTML = html;
    if (collapsed) document.body.classList.add("sidebar-collapsed");
    var toggle = document.getElementById("sidebarToggle");
    if (toggle) toggle.addEventListener("click", function () {
      document.body.classList.toggle("sidebar-collapsed");
      localStorage.setItem("cms-sidebar-collapsed", document.body.classList.contains("sidebar-collapsed"));
    });
    // Apply i18n + inject language toggle
    if (window.NWMi18n) {
      window.NWMi18n.apply(sidebar);
      window.NWMi18n.injectToggle(document.getElementById('sidebar-lang'));
    }
    window.addEventListener('nwm:lang', function(){ buildSidebar(); });
  }

  function buildHeader(title, actionsHtml, subtitle) {
    var h = document.getElementById("pageHeader");
    if (!h) return;
    var html = '<div class="page-header-left">';
    html += '<div class="page-header-titles">';
    html += '<h1 class="page-title">' + title + '</h1>';
    if (subtitle) html += '<div class="page-subtitle">' + subtitle + '</div>';
    html += '</div></div>';
    html += '<div class="page-header-right">';
    html += '<div class="header-search"><span class="search-icon">' + ICONS.search + '</span>';
    html += '<input type="text" placeholder="Search content, templates, SEO…" /></div>';
    html += '<button class="header-icon" title="Notifications">' + ICONS.bell + '</button>';
    if (actionsHtml) html += actionsHtml;
    html += '</div>';
    h.innerHTML = html;
  }

  function statusBadge(status) {
    var map = {
      "published": { cls: "badge-green", label: "Published" },
      "draft":     { cls: "badge-gray",  label: "Draft" },
      "scheduled": { cls: "badge-blue",  label: "Scheduled" },
      "archived":  { cls: "badge-gray",  label: "Archived" },
      "active":    { cls: "badge-green", label: "Active" },
      "paused":    { cls: "badge-yellow",label: "Paused" },
      "running":   { cls: "badge-blue",  label: "Running" },
      "winner":    { cls: "badge-green", label: "Winner" },
      "completed": { cls: "badge-gray",  label: "Completed" }
    };
    var m = map[status] || { cls: "badge-gray", label: status };
    return '<span class="status-badge ' + m.cls + '">' + m.label + '</span>';
  }

  function fmtN(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toString();
  }

  window.CMS_APP = {
    ICONS: ICONS,
    buildSidebar: buildSidebar,
    buildHeader: buildHeader,
    statusBadge: statusBadge,
    fmtN: fmtN
  };

  document.addEventListener("DOMContentLoaded", buildSidebar);
})();
