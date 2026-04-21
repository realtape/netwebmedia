/* Courses Page Logic — 15 courses mapped to real NetWebMedia tutorials */
(function () {
  "use strict";

  // Each course points to its tutorial page in /tutorials/{slug}.html
  var COURSES = [
    {
      slug: "nwm-crm", name: "NetWeb CRM Masterclass",
      tagline: "Master every module — Sales, Marketing, Service, CMS, AI Agents, Ops, Partner",
      students: 486, lessons: 28, duration: "4h 20m", completion: 82, status: "published",
      level: "All levels", color: "#6c5ce7", icon: "📇",
      tutorial: "/tutorials/nwm-crm.html"
    },
    {
      slug: "nwm-cms", name: "NetWeb CMS for Marketers",
      tagline: "Pages, blog, memberships, LMS, community — ship in hours, not weeks",
      students: 312, lessons: 16, duration: "2h 40m", completion: 74, status: "published",
      level: "Beginner", color: "#00cec9", icon: "🌐",
      tutorial: "/tutorials/nwm-cms.html"
    },
    {
      slug: "ai-automate", name: "AI Automations in 2026",
      tagline: "Build agents, workflows, and triggers that run the company while you sleep",
      students: 241, lessons: 18, duration: "3h 05m", completion: 68, status: "published",
      level: "Intermediate", color: "#a29bfe", icon: "⚡",
      tutorial: "/tutorials/ai-automate.html"
    },
    {
      slug: "ai-chat-agents", name: "AI Chat Agents",
      tagline: "Design, train, and deploy chat agents that actually convert — across SMS, WhatsApp, web",
      students: 198, lessons: 14, duration: "2h 15m", completion: 71, status: "published",
      level: "Intermediate", color: "#22d3ee", icon: "🤖",
      tutorial: "/tutorials/ai-chat-agents.html"
    },
    {
      slug: "ai-seo", name: "AI SEO + AEO",
      tagline: "Rank in Google, ChatGPT, Perplexity, Gemini — the modern answer-engine playbook",
      students: 329, lessons: 22, duration: "3h 45m", completion: 77, status: "published",
      level: "All levels", color: "#00b894", icon: "🔍",
      tutorial: "/tutorials/ai-seo.html"
    },
    {
      slug: "email-marketing", name: "Lifecycle Email Marketing",
      tagline: "Behavioral triggers, bilingual nurture flows, and revenue attribution that stands up",
      students: 276, lessons: 20, duration: "3h 10m", completion: 80, status: "published",
      level: "Intermediate", color: "#e17055", icon: "💌",
      tutorial: "/tutorials/email-marketing.html"
    },
    {
      slug: "paid-ads", name: "Paid Ads at Creative Scale",
      tagline: "40 ad variants a week on Meta, Google, TikTok — the only way to win in 2026",
      students: 214, lessons: 16, duration: "2h 50m", completion: 69, status: "published",
      level: "Advanced", color: "#fd79a8", icon: "🎯",
      tutorial: "/tutorials/paid-ads.html"
    },
    {
      slug: "social-media", name: "Social Media That Drives Revenue",
      tagline: "Organic + paid + UGC + influencer — turn followers into customers, not vanity metrics",
      students: 352, lessons: 19, duration: "3h 00m", completion: 73, status: "published",
      level: "All levels", color: "#fdcb6e", icon: "📱",
      tutorial: "/tutorials/social-media.html"
    },
    {
      slug: "video-factory", name: "AI Video Factory",
      tagline: "Script, shoot, edit, publish — 30+ short-form videos/week with an AI-first pipeline",
      students: 167, lessons: 14, duration: "2h 25m", completion: 62, status: "published",
      level: "Intermediate", color: "#8b5cf6", icon: "🎬",
      tutorial: "/tutorials/video-factory.html"
    },
    {
      slug: "websites", name: "High-Conversion Websites",
      tagline: "From Shopify to headless — engineer sites that compound revenue month over month",
      students: 283, lessons: 17, duration: "2h 55m", completion: 75, status: "published",
      level: "All levels", color: "#0984e3", icon: "🖥️",
      tutorial: "/tutorials/websites.html"
    },
    {
      slug: "fractional-cmo", name: "Fractional CMO Playbook",
      tagline: "Strategy, forecasting, and operator rhythms for growth-stage founders",
      students: 122, lessons: 12, duration: "2h 10m", completion: 66, status: "published",
      level: "Advanced", color: "#d63031", icon: "🧠",
      tutorial: "/tutorials/fractional-cmo.html"
    },
    {
      slug: "analyzer", name: "Growth Analyzer Deep-Dive",
      tagline: "Run the 8-dimension diagnostic, read the signal, build the 90-day plan",
      students: 98, lessons: 10, duration: "1h 40m", completion: 58, status: "published",
      level: "Beginner", color: "#74b9ff", icon: "📊",
      tutorial: "/tutorials/analyzer.html"
    },
    {
      slug: "whatsapp-automation", name: "WhatsApp Business Automation Mastery",
      tagline: "100% automated WhatsApp — templates, flows, broadcasts, CRM sync, zero manual replies",
      students: 0, lessons: 38, duration: "4h 45m", completion: 0, status: "published",
      level: "Intermediate", color: "#25d366", icon: "💬",
      tutorial: "/tutorials/whatsapp-automation.html"
    },
    {
      slug: "chatbot-automation", name: "AI Chatbot Automation — Full Deployment",
      tagline: "Design, build, and deploy chatbots that qualify leads and close deals across every platform",
      students: 0, lessons: 42, duration: "5h 10m", completion: 0, status: "published",
      level: "Intermediate", color: "#22d3ee", icon: "🤖",
      tutorial: "/tutorials/chatbot-automation.html"
    },
    {
      slug: "sms-automation", name: "SMS & Multi-Platform Messaging Automation",
      tagline: "Compliance, keyword triggers, drip sequences, two-way automation across SMS, IG, FB, and more",
      students: 0, lessons: 31, duration: "3h 50m", completion: 0, status: "published",
      level: "Intermediate", color: "#a29bfe", icon: "📲",
      tutorial: "/tutorials/sms-automation.html"
    }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      newCourse: "Nuevo Curso", students: "Estudiantes", lessons: "Lecciones",
      open: "Abrir Tutorial", edit: "Editar", search: "Buscar cursos…",
      totalCourses: "Cursos Totales", totalStudents: "Estudiantes", avgCompletion: "Completación Promedio",
      published: "Publicados",
      duration: "Duración", level: "Nivel"
    } : {
      newCourse: "New Course", students: "Students", lessons: "Lessons",
      open: "Open Tutorial", edit: "Edit", search: "Search courses…",
      totalCourses: "Total Courses", totalStudents: "Students", avgCompletion: "Avg Completion",
      published: "Published",
      duration: "Duration", level: "Level"
    };

    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader(CRM_APP.t('nav.courses'), '<button class="btn btn-primary">' + (CRM_APP.ICONS && CRM_APP.ICONS.plus || '+') + ' ' + L.newCourse + '</button>');
    }
    renderStatsStrip(L);
    render(L);
    wireSearch(L);
  });

  function renderStatsStrip(L) {
    var body = document.getElementById("coursesBody");
    if (!body) return;

    var totalStudents = COURSES.reduce(function (a, c) { return a + c.students; }, 0);
    var avgCompletion = Math.round(COURSES.reduce(function (a, c) { return a + c.completion; }, 0) / COURSES.length);
    var published = COURSES.filter(function (c) { return c.status === "published"; }).length;

    var html = '<div class="courses-stats">';
    html += statCard(L.totalCourses, COURSES.length, "#22d3ee");
    html += statCard(L.totalStudents, totalStudents.toLocaleString(), "#a29bfe");
    html += statCard(L.avgCompletion, avgCompletion + "%", "#00b894");
    html += statCard(L.published, published, "#fdcb6e");
    html += '</div>';

    html += '<div class="courses-toolbar">';
    html += '<input type="search" id="courseSearch" class="course-search" placeholder="' + L.search + '" />';
    html += '</div>';

    html += '<div class="course-grid" id="courseGrid"></div>';
    body.innerHTML = html;
  }

  function statCard(label, value, color) {
    return '<div class="courses-stat" style="border-left:3px solid ' + color + '">' +
      '<div class="courses-stat-label">' + label + '</div>' +
      '<div class="courses-stat-value">' + value + '</div>' +
      '</div>';
  }

  function render(L, filter) {
    var grid = document.getElementById("courseGrid");
    if (!grid) return;
    var q = (filter || "").trim().toLowerCase();
    var list = q
      ? COURSES.filter(function (c) { return c.name.toLowerCase().indexOf(q) !== -1 || c.tagline.toLowerCase().indexOf(q) !== -1; })
      : COURSES;

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No courses match "' + escapeHtml(q) + '"</div>';
      return;
    }

    var html = "";
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      html += '<article class="course-card">';
      html += '<div class="course-card-thumb" style="background:linear-gradient(135deg, ' + c.color + '22, ' + c.color + '55); border-bottom:1px solid ' + c.color + '33">';
      html += '<div class="course-thumb-icon" style="color:' + c.color + '">' + c.icon + '</div>';
      html += '<div class="course-thumb-title" style="color:' + c.color + '">' + c.name + '</div>';
      html += '</div>';
      html += '<div class="course-card-body">';
      html += '<div class="course-card-title">' + c.name + '</div>';
      html += '<p class="course-card-tag">' + c.tagline + '</p>';
      html += '<div class="course-meta">';
      html += '<span class="course-meta-item"><b>' + c.lessons + '</b> ' + L.lessons + '</span>';
      html += '<span class="course-meta-item">⏱ ' + c.duration + '</span>';
      html += '<span class="course-meta-item">🎓 ' + c.level + '</span>';
      html += '</div>';
      html += '<div class="course-enroll">';
      html += '<span class="course-enroll-count">' + c.students.toLocaleString() + ' ' + L.students.toLowerCase() + '</span>';
      html += '<span class="course-enroll-pct">' + c.completion + '% ' + (isEs(L) ? 'completado' : 'completion') + '</span>';
      html += '</div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + c.completion + '%; background:' + c.color + '"></div></div>';
      html += '<div class="course-card-footer">';
      html += (window.CRM_APP && CRM_APP.statusBadge ? CRM_APP.statusBadge(c.status) : '<span class="badge badge-success">' + c.status + '</span>');
      html += '<a class="btn btn-primary btn-sm" href="' + c.tutorial + '" target="_blank" rel="noopener">' + L.open + ' →</a>';
      html += '</div>';
      html += '</div>';
      html += '</article>';
    }
    grid.innerHTML = html;
  }

  function wireSearch(L) {
    var input = document.getElementById("courseSearch");
    if (!input) return;
    var t;
    input.addEventListener("input", function (e) {
      clearTimeout(t);
      var v = e.target.value;
      t = setTimeout(function () { render(L, v); }, 120);
    });
  }

  function isEs(L) { return L && L.open && L.open.indexOf("Abrir") === 0; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]); }); }

})();
