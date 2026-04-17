/* Courses Page Logic */
(function () {
  "use strict";

  var COURSES = [
    { name: "Digital Marketing 101", students: 248, lessons: 24, completion: 78, status: "published", color: "#6c5ce7" },
    { name: "SEO Masterclass", students: 186, lessons: 18, completion: 65, status: "published", color: "#00b894" },
    { name: "Social Media Strategy", students: 312, lessons: 16, completion: 82, status: "published", color: "#fdcb6e" },
    { name: "Email Marketing Pro", students: 142, lessons: 12, completion: 71, status: "published", color: "#e17055" },
    { name: "AI for Business", students: 89, lessons: 20, completion: 34, status: "draft", color: "#00cec9" },
    { name: "Content Creation Blueprint", students: 0, lessons: 15, completion: 0, status: "draft", color: "#a29bfe" }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      newCourse: "Nuevo Curso", students: "Estudiantes", lessons: "Lecciones", edit: "Editar"
    } : {
      newCourse: "New Course", students: "Students", lessons: "Lessons", edit: "Edit"
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.courses'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.newCourse + '</button>');
    render(L);
  });

  function render(L) {
    var body = document.getElementById("coursesBody");
    if (!body) return;

    var html = '<div class="course-grid">';
    for (var i = 0; i < COURSES.length; i++) {
      var c = COURSES[i];
      html += '<div class="course-card">';
      html += '<div class="course-card-thumb" style="background:linear-gradient(135deg, ' + c.color + '22, ' + c.color + '44)">';
      html += '<div style="color:' + c.color + ';font-size:14px;font-weight:600">' + CRM_ICONS.courses + '<br>' + c.name + '</div>';
      html += '</div>';
      html += '<div class="course-card-body">';
      html += '<div class="course-card-title">' + c.name + '</div>';
      html += '<div class="course-card-stats">';
      html += '<div>' + L.students + ': <span>' + c.students + '</span></div>';
      html += '<div>' + L.lessons + ': <span>' + c.lessons + '</span></div>';
      html += '</div>';
      if (c.status === "published") {
        html += '<div style="display:flex;align-items:center;margin-bottom:12px">';
        html += '<div class="progress-bar"><div class="progress-fill" style="width:' + c.completion + '%"></div></div>';
        html += '<span style="font-size:12px;color:var(--text-dim)">' + c.completion + '%</span>';
        html += '</div>';
      }
      html += '<div class="course-card-footer">';
      html += CRM_APP.statusBadge(c.status);
      html += '<button class="action-link">' + L.edit + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    body.innerHTML = html;
  }

})();
