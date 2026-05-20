/* CRM Shared Application Logic */
(function () {
  "use strict";

  /* ── SVG Icon definitions ── */
  var ICONS = {
    dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    contacts: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    pipeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="4" height="14" rx="1"/><rect x="7" y="3" width="4" height="18" rx="1"/><rect x="12" y="10" width="4" height="11" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/></svg>',
    conversations: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    payments: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    marketing: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>',
    automation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    sites: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    reputation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    reporting: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    documents: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    courses: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>',
    social: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    chevronLeft: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    filter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    whatsapp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    sms: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>'
  };

  window.CRM_ICONS = ICONS;

  /* ── Navigation items ── */
  var NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "index.html" },
    { id: "conversations", label: "Conversations", icon: "conversations", href: "conversations.html" },
    { id: "calendars", label: "Calendars", icon: "calendar", href: "calendar.html" },
    { id: "contacts", label: "Contacts", icon: "contacts", href: "contacts.html" },
    { id: "pipeline", label: "Opportunities", icon: "pipeline", href: "pipeline.html" },
    { id: "payments", label: "Payments", icon: "payments", href: "payments.html" },
    { id: "marketing", label: "Marketing", icon: "marketing", href: "marketing.html" },
    { id: "automation", label: "Automation", icon: "automation", href: "automation.html" },
    { id: "sites", label: "Sites", icon: "sites", href: "sites.html" },
    { id: "reputation", label: "Reputation", icon: "reputation", href: "reputation.html" },
    { id: "reporting", label: "Reporting", icon: "reporting", href: "reporting.html" },
    { id: "documents", label: "Documents", icon: "documents", href: "documents.html" },
    { id: "courses", label: "Courses", icon: "courses", href: "courses.html" },
    { id: "social", label: "Social Planner", icon: "social", href: "social.html" },
    { id: "settings", label: "Settings", icon: "settings", href: "settings.html" }
  ];

  /* ── Determine active page ── */
  function getActivePage() {
    var path = window.location.pathname;
    var file = path.split("/").pop() || "index.html";
    if (file === "" || file === "index.html") return "dashboard";
    var page = file.replace(".html", "");
    if (page === "calendar") return "calendars";
    return page;
  }

  /* ── Build sidebar ── */
  function buildSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    var active = getActivePage();
    var collapsed = localStorage.getItem("sidebar-collapsed") === "true";

    var html = '<div class="sidebar-header">';
    html += '<div class="sidebar-brand">';
    html += '<div class="brand-icon">N</div>';
    html += '<span class="brand-text">NetWeb CRM</span>';
    html += '</div>';
    html += '<button class="sidebar-toggle" id="sidebarToggle">' + ICONS.chevronLeft + '</button>';
    html += '</div>';

    html += '<nav class="sidebar-nav">';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      var isActive = item.id === active ? " active" : "";
      html += '<a href="' + item.href + '" class="nav-item' + isActive + '" title="' + item.label + '">';
      html += '<span class="nav-icon">' + ICONS[item.icon] + '</span>';
      html += '<span class="nav-label">' + item.label + '</span>';
      html += '</a>';
    }
    html += '</nav>';

    html += '<div class="sidebar-footer">';
    html += '<div class="user-card">';
    var loggedInUser = getLoggedInUser();
    var userName = loggedInUser ? loggedInUser.name : 'Guest';
    var userRole = loggedInUser ? (loggedInUser.type === 'demo' ? 'Demo' : loggedInUser.type.charAt(0).toUpperCase() + loggedInUser.type.slice(1)) : 'Guest';
    var userInitials = userName.split(' ').map(function(w){ return w.charAt(0).toUpperCase(); }).join('').substring(0, 2);
    html += '<div class="user-avatar">' + userInitials + '</div>';
    html += '<div class="user-info">';
    html += '<div class="user-name">' + userName + '</div>';
    html += '<div class="user-role">' + userRole + '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    sidebar.innerHTML = html;

    if (collapsed) {
      sidebar.classList.add("collapsed");
      document.getElementById("mainContent").classList.add("sidebar-collapsed");
    }

    document.getElementById("sidebarToggle").addEventListener("click", function () {
      var isCollapsed = sidebar.classList.toggle("collapsed");
      document.getElementById("mainContent").classList.toggle("sidebar-collapsed");
      localStorage.setItem("sidebar-collapsed", isCollapsed);
    });
  }

  /* ── Build header ── */
  function buildHeader(title, actions) {
    var header = document.getElementById("pageHeader");
    if (!header) return;

    var html = '<div class="header-left">';
    html += '<button class="mobile-menu-btn" id="mobileMenuBtn">' + ICONS.menu + '</button>';
    html += '<h1 class="page-title">' + title + '</h1>';
    html += '</div>';
    html += '<div class="header-right">';
    if (actions) {
      html += actions;
    }
    html += '<button class="header-icon-btn notification-btn">' + ICONS.bell + '<span class="notif-dot"></span></button>';
    var headerUser = getLoggedInUser();
    var headerInitials = 'G';
    if (headerUser && headerUser.name) {
      headerInitials = headerUser.name.split(' ').map(function(w){ return w.charAt(0).toUpperCase(); }).join('').substring(0, 2);
    }
    html += '<div class="header-avatar">' + headerInitials + '</div>';
    html += '</div>';

    header.innerHTML = html;

    var mobileBtn = document.getElementById("mobileMenuBtn");
    if (mobileBtn) {
      mobileBtn.addEventListener("click", function () {
        var sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle("mobile-open");
      });
    }
  }

  /* ── Utility: format currency ── */
  function formatCurrency(value) {
    if (value >= 1000) {
      return "$" + (value / 1000).toFixed(1) + "k";
    }
    return "$" + value.toLocaleString();
  }

  /* ── Utility: status badge ── */
  function statusBadge(status) {
    return '<span class="status-badge status-' + status + '">' + status.charAt(0).toUpperCase() + status.slice(1) + '</span>';
  }

  /* ── Utility: channel icon ── */
  function channelIcon(channel) {
    if (ICONS[channel]) return ICONS[channel];
    return ICONS.email;
  }

  /* ── Demo Gate Logic ── */
  function getLoggedInUser() {
    try {
      var raw = localStorage.getItem('crm_demo_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function getDemoUser() {
    var user = getLoggedInUser();
    if (user && user.type === 'demo') return user;
    return null;
  }

  function isDemo() {
    return getDemoUser() !== null;
  }

  function showUpgradeModal(moduleName) {
    // Remove existing modal if any
    var existing = document.getElementById('upgradeOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'upgradeOverlay';
    overlay.className = 'upgrade-overlay';

    var modal = document.createElement('div');
    modal.className = 'upgrade-modal';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'upgrade-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', function() {
      overlay.remove();
    });
    modal.appendChild(closeBtn);

    var heading = document.createElement('h2');
    heading.className = 'upgrade-heading';
    heading.textContent = 'Upgrade to Access ' + moduleName;
    modal.appendChild(heading);

    var sub = document.createElement('p');
    sub.className = 'upgrade-subheading';
    sub.textContent = 'Your demo includes the Dashboard overview. Unlock all 15 modules with a plan.';
    modal.appendChild(sub);

    var plans = document.createElement('div');
    plans.className = 'upgrade-plans';

    var planData = [
      {
        name: 'Starter',
        price: '$97',
        period: '/mo',
        features: ['Dashboard + 3 Modules', 'Up to 500 Contacts', 'Email Support', '1 User Seat'],
        featured: false
      },
      {
        name: 'Professional',
        price: '$297',
        period: '/mo',
        features: ['All 15 Modules', 'Unlimited Contacts', 'Priority Support', '5 User Seats', 'Automation Workflows', 'Custom Reporting'],
        featured: true
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Everything in Professional', 'Unlimited Users', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee', 'White-Label Options'],
        featured: false
      }
    ];

    for (var i = 0; i < planData.length; i++) {
      var p = planData[i];
      var card = document.createElement('div');
      card.className = 'upgrade-plan' + (p.featured ? ' featured' : '');

      var planName = document.createElement('div');
      planName.className = 'upgrade-plan-name';
      planName.textContent = p.name;
      card.appendChild(planName);

      var priceRow = document.createElement('div');
      priceRow.className = 'upgrade-plan-price';
      priceRow.textContent = p.price;
      if (p.period) {
        var periodSpan = document.createElement('span');
        periodSpan.className = 'upgrade-plan-period';
        periodSpan.textContent = p.period;
        priceRow.appendChild(periodSpan);
      }
      card.appendChild(priceRow);

      var featureList = document.createElement('ul');
      featureList.className = 'upgrade-plan-features';
      for (var j = 0; j < p.features.length; j++) {
        var li = document.createElement('li');
        li.textContent = p.features[j];
        featureList.appendChild(li);
      }
      card.appendChild(featureList);

      var cta = document.createElement('a');
      cta.className = 'upgrade-cta' + (p.featured ? ' primary' : '');
      cta.href = 'https://netwebmedia.com/contact';
      cta.target = '_blank';
      cta.textContent = 'Contact Sales';
      card.appendChild(cta);

      plans.appendChild(card);
    }

    modal.appendChild(plans);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  function initDemoGate() {
    if (!isDemo()) return;

    // If on a page other than index.html (dashboard), redirect
    var page = getActivePage();
    if (page !== 'dashboard') {
      window.location.href = 'index.html';
      return;
    }

    // Intercept all sidebar links except dashboard
    var navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    for (var i = 0; i < navLinks.length; i++) {
      (function(link) {
        var href = link.getAttribute('href') || '';
        if (href === 'index.html') return; // Allow dashboard
        link.addEventListener('click', function(e) {
          e.preventDefault();
          // Determine module name from the link text
          var label = link.querySelector('.nav-label');
          var moduleName = label ? label.textContent : 'this module';
          showUpgradeModal(moduleName);
        });
      })(navLinks[i]);
    }
  }

  /* ── Init on DOM ready ── */
  document.addEventListener("DOMContentLoaded", function () {
    buildSidebar();
    initDemoGate();
  });

  /* ── Expose to global ── */
  window.CRM_APP = {
    buildHeader: buildHeader,
    formatCurrency: formatCurrency,
    statusBadge: statusBadge,
    channelIcon: channelIcon,
    getActivePage: getActivePage,
    isDemo: isDemo,
    showUpgradeModal: showUpgradeModal,
    initDemoGate: initDemoGate,
    ICONS: ICONS
  };

})();
