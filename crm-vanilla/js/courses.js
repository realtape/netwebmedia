/* Courses Page Logic — real API-driven course enrollment, lessons, progress tracking */
(function () {
  "use strict";

  var API_BASE = (window.CRM_APP && CRM_APP.API_BASE) || '/api';
  var userProgress = {};
  var allCourses = [];

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      newCourse: "Nuevo Curso", students: "Estudiantes", lessons: "Lecciones",
      enroll: "Inscribirse", enrolled: "Inscrito", progress: "Progreso",
      search: "Buscar cursos…", level: "Nivel", duration: "Duración",
      totalCourses: "Cursos Totales", totalStudents: "Estudiantes", avgCompletion: "Completación Promedio",
      published: "Publicados", myProgress: "Mi Progreso", myEnrollments: "Mis Inscripciones",
      lessons: "Lecciones", complete: "Completado"
    } : {
      newCourse: "New Course", students: "Students", lessons: "Lessons",
      enroll: "Enroll", enrolled: "Enrolled", progress: "Progress",
      search: "Search courses…", level: "Level", duration: "Duration",
      totalCourses: "Total Courses", totalStudents: "Students", avgCompletion: "Avg Completion",
      published: "Published", myProgress: "My Progress", myEnrollments: "My Enrollments",
      lessons: "Lessons", complete: "Completed"
    };

    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader(CRM_APP.t('nav.courses'), '');
    }

    loadCoursesAndProgress(L);
  });

  function loadCoursesAndProgress(L) {
    var body = document.getElementById("coursesBody");
    if (!body) return;

    body.innerHTML = '<div style="padding:40px; text-align:center; color:#999">Loading courses…</div>';

    Promise.all([
      fetch(API_BASE + '/courses', { headers: { 'X-Auth-Token': getToken() } }).then(r => r.json()),
      fetch(API_BASE + '/courses/progress', { headers: { 'X-Auth-Token': getToken() } }).then(r => r.json())
    ]).then(function (results) {
      var coursesResp = results[0];
      var progressResp = results[1];

      allCourses = coursesResp.items || [];
      var enrollments = progressResp.enrollments || [];

      enrollments.forEach(function (e) {
        userProgress[e.course_id] = e;
      });

      renderStatsStrip(L);
      render(L);
      wireSearch(L);
    }).catch(function (err) {
      console.error('Failed to load courses:', err);
      body.innerHTML = '<div style="padding:40px; color:#e74c3c">Failed to load courses. Please refresh.</div>';
    });
  }

  function renderStatsStrip(L) {
    var body = document.getElementById("coursesBody");
    if (!body) return;

    var totalStudents = allCourses.reduce(function (a, c) { return a + (c.active_students || 0); }, 0);
    var avgCompletion = allCourses.length ? Math.round(allCourses.reduce(function (a, c) { return a + (c.avg_completion || 0); }, 0) / allCourses.length) : 0;
    var published = allCourses.filter(function (c) { return c.status === "published"; }).length;

    var html = '<div class="courses-stats">';
    html += statCard(L.totalCourses, allCourses.length, "#22d3ee");
    html += statCard(L.totalStudents, totalStudents.toLocaleString(), "#a29bfe");
    html += statCard(L.avgCompletion, avgCompletion + "%", "#00b894");
    html += statCard(L.published, published, "#fdcb6e");
    html += '</div>';

    html += '<div class="courses-toolbar">';
    html += '<input type="search" id="courseSearch" class="course-search" placeholder="' + L.search + '" />';
    html += '</div>';

    html += '<div class="course-grid" id="courseGrid"></div>';
    html += '<div id="courseDetail" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:1000; overflow-y:auto"></div>';
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
      ? allCourses.filter(function (c) { return c.name.toLowerCase().indexOf(q) !== -1 || c.tagline.toLowerCase().indexOf(q) !== -1; })
      : allCourses;

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No courses match "' + escapeHtml(q) + '"</div>';
      return;
    }

    var html = "";
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var enrollment = userProgress[c.id];
      var color = safeColor(c.color, "#6c5ce7");
      var progress = enrollment ? Number(enrollment.progress_percent) || 0 : 0;
      var cid = parseInt(c.id, 10) || 0;
      var lessonCount = parseInt(c.lesson_count, 10) || 0;
      var activeStudents = parseInt(c.active_students, 10) || 0;

      html += '<article class="course-card" data-course-id="' + cid + '">';
      html += '<div class="course-card-thumb" style="background:linear-gradient(135deg, ' + color + '22, ' + color + '55); border-bottom:1px solid ' + color + '33">';
      html += '<div class="course-thumb-icon" style="color:' + color + '">' + escapeHtml(c.icon || '📚') + '</div>';
      html += '<div class="course-thumb-title" style="color:' + color + '">' + escapeHtml(c.name || '') + '</div>';
      html += '</div>';
      html += '<div class="course-card-body">';
      html += '<div class="course-card-title">' + escapeHtml(c.name || '') + '</div>';
      html += '<p class="course-card-tag">' + escapeHtml(c.tagline || '') + '</p>';
      html += '<div class="course-meta">';
      html += '<span class="course-meta-item"><b>' + lessonCount + '</b> ' + escapeHtml(L.lessons) + '</span>';
      html += '<span class="course-meta-item">🎓 ' + escapeHtml(c.level || 'All levels') + '</span>';
      html += '</div>';
      html += '<div class="course-enroll">';
      html += '<span class="course-enroll-count">' + activeStudents.toLocaleString() + ' ' + escapeHtml(L.students.toLowerCase()) + '</span>';
      if (enrollment) {
        html += '<span class="course-enroll-pct">' + Math.round(progress) + '% ' + escapeHtml(L.progress.toLowerCase()) + '</span>';
      }
      html += '</div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + Math.round(progress) + '%; background:' + color + '"></div></div>';
      html += '<div class="course-card-footer">';
      if (enrollment) {
        html += '<button class="btn btn-primary btn-sm course-view-btn" data-course-id="' + cid + '">View Course →</button>';
      } else {
        html += '<button class="btn btn-primary btn-sm course-enroll-btn" data-course-id="' + cid + '">' + escapeHtml(L.enroll) + '</button>';
      }
      html += '</div>';
      html += '</div>';
      html += '</article>';
    }
    grid.innerHTML = html;

    // Wire up enroll and view buttons
    wireEnrollButtons(L);
    wireViewCourseButtons(L);
  }

  function wireEnrollButtons(L) {
    var buttons = document.querySelectorAll(".course-enroll-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var courseId = parseInt(btn.getAttribute("data-course-id"), 10);
        enrollCourse(courseId, L);
      });
    });
  }

  function wireViewCourseButtons(L) {
    var buttons = document.querySelectorAll(".course-view-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var courseId = parseInt(btn.getAttribute("data-course-id"), 10);
        showCourseDetail(courseId, L);
      });
    });
  }

  function enrollCourse(courseId, L) {
    fetch(API_BASE + '/courses/enroll', {
      method: 'POST',
      headers: {
        'X-Auth-Token': getToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ course_id: courseId })
    })
    .then(r => r.json())
    .then(function (resp) {
      if (resp.enrollment_id) {
        userProgress[courseId] = {
          id: resp.enrollment_id,
          course_id: courseId,
          progress_percent: 0,
          status: 'active'
        };
        render(L);
      }
    })
    .catch(function (err) {
      console.error('Enrollment failed:', err);
      alert('Failed to enroll in course');
    });
  }

  function showCourseDetail(courseId, L) {
    var course = allCourses.find(function (c) { return c.id === courseId; });
    var enrollment = userProgress[courseId];
    if (!course) return;

    fetch(API_BASE + '/courses/' + courseId, {
      headers: { 'X-Auth-Token': getToken() }
    })
    .then(r => r.json())
    .then(function (data) {
      var lessons = data.lessons || [];
      var color = safeColor(data.course && data.course.color, "#6c5ce7");
      var courseName = (data.course && data.course.name) || '';
      var courseTagline = (data.course && data.course.tagline) || '';
      var courseIcon = (data.course && data.course.icon) || '📚';
      var enrollPct = enrollment ? Number(enrollment.progress_percent) || 0 : 0;
      var safeCourseId = parseInt(courseId, 10) || 0;

      var html = '<div class="course-detail-modal" style="background:white; max-width:800px; margin:40px auto; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.3)">';
      html += '<div class="modal-header" style="background:linear-gradient(135deg, ' + color + '22, ' + color + '55); padding:30px; border-bottom:1px solid ' + color + '33; display:flex; justify-content:space-between; align-items:center">';
      html += '<div>';
      html += '<div style="font-size:32px; margin-bottom:10px">' + escapeHtml(courseIcon) + '</div>';
      html += '<h2 style="margin:0; color:' + color + '">' + escapeHtml(courseName) + '</h2>';
      html += '<p style="margin:8px 0 0; color:#666; font-size:14px">' + escapeHtml(courseTagline) + '</p>';
      html += '</div>';
      html += '<button class="modal-close" style="background:none; border:none; font-size:24px; cursor:pointer; color:#666">&times;</button>';
      html += '</div>';

      html += '<div style="padding:30px">';
      if (enrollment) {
        html += '<div class="progress-bar" style="height:8px; margin-bottom:20px"><div class="progress-fill" style="width:' + Math.round(enrollPct) + '%; background:' + color + '; height:100%"></div></div>';
        html += '<p style="color:#666; margin:0 0 20px; font-size:14px">' + Math.round(enrollPct) + '% ' + escapeHtml(L.complete.toLowerCase()) + '</p>';
      }

      html += '<h3 style="margin:20px 0 15px; color:#333">' + escapeHtml(L.lessons) + '</h3>';
      for (var i = 0; i < lessons.length; i++) {
        var lesson = lessons[i];
        var lessonId = parseInt(lesson.id, 10) || 0;
        var lessonDuration = parseInt(lesson.duration_minutes, 10) || 0;
        html += '<div style="padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center">';
        html += '<div>';
        html += '<div style="font-weight:600; color:#333">' + escapeHtml(lesson.title || '') + '</div>';
        html += '<div style="font-size:13px; color:#999; margin-top:4px">' + lessonDuration + ' min • ' + escapeHtml(lesson.type || 'video') + '</div>';
        html += '</div>';
        html += '<button class="lesson-complete-btn" data-lesson-id="' + lessonId + '" data-course-id="' + safeCourseId + '" style="background:' + color + '; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:13px">Mark Done</button>';
        html += '</div>';
      }
      html += '</div>';
      html += '</div>';

      var modal = document.getElementById("courseDetail");
      modal.innerHTML = html;
      modal.style.display = 'block';

      modal.querySelector('.modal-close').addEventListener('click', function () {
        modal.style.display = 'none';
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.style.display = 'none';
      });

      // Wire lesson complete buttons
      var lessonBtns = modal.querySelectorAll('.lesson-complete-btn');
      lessonBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var lessonId = parseInt(btn.getAttribute('data-lesson-id'), 10);
          markLessonComplete(courseId, lessonId, L);
        });
      });
    })
    .catch(function (err) {
      console.error('Failed to load course:', err);
      alert('Failed to load course details');
    });
  }

  function markLessonComplete(courseId, lessonId, L) {
    fetch(API_BASE + '/courses/' + courseId + '/complete-lesson', {
      method: 'POST',
      headers: {
        'X-Auth-Token': getToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lesson_id: lessonId, time_spent_minutes: 0 })
    })
    .then(r => r.json())
    .then(function (resp) {
      if (resp.progress_percent !== undefined) {
        userProgress[courseId].progress_percent = resp.progress_percent;
        showCourseDetail(courseId, L);
        if (resp.course_complete) {
          alert('Course completed! 🎉');
        }
      }
    })
    .catch(function (err) {
      console.error('Failed to mark lesson complete:', err);
    });
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

  function getToken() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('nwm_token') || '';
    }
    return '';
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]); }); }

  // CSS-context safe color: only allow #hex (3/6/8) or rgba(). Everything else
  // (e.g. malicious "red; background:url(//evil)") falls back to the default.
  // Mirrors the same defense added to branding.js earlier — see plans/audits/RATING-2026-04-30.md.
  var COLOR_RE = /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\))$/;
  function safeColor(v, fallback) {
    if (typeof v !== 'string') return fallback;
    var t = v.trim();
    return COLOR_RE.test(t) ? t : fallback;
  }

})();
