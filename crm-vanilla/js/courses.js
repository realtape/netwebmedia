/* Courses Module - student view + admin management */
(function () {
  "use strict";

  var API_BASE = (window.CRM_APP && CRM_APP.API_BASE) || '/api';
  var userProgress = {};
  var allCourses   = [];
  var adminCourses = [];
  var isAdmin      = false;
  var activeTab    = 'student';
  var managingCourseId = null;
  var _isEs = false;

  function cname(c)  { return (_isEs && c.name_es)    ? c.name_es    : (c.name    || ''); }
  function ctag(c)   { return (_isEs && c.tagline_es)  ? c.tagline_es : (c.tagline || ''); }

  function getToken() {
    try { return localStorage.getItem('nwm_token') || ''; } catch(_) { return ''; }
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function api(method, path, body) {
    var opts = { method: method, headers: { 'X-Auth-Token': getToken() } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(API_BASE + path, opts).then(function(r) { return r.json(); });
  }

  function toast(msg, isError) {
    var el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 2800);
  }

  document.addEventListener('DOMContentLoaded', function() {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    _isEs = isEs;
    var L = buildL(isEs);
    if (window.CRM_APP && CRM_APP.buildHeader) CRM_APP.buildHeader(CRM_APP.t ? CRM_APP.t('nav.courses') : 'Courses', '');
    try {
      var raw = localStorage.getItem('nwm_user');
      if (raw) { var u = JSON.parse(raw); isAdmin = u.role === 'admin' || u.role === 'superadmin' || u.type === 'superadmin'; }
    } catch(_) {}
    loadAll(L);
  });

  function buildL(es) {
    return es ? {
      newCourse:'Nuevo Curso', students:'Estudiantes', lessons:'Lecciones', enroll:'Inscribirse', progress:'Progreso',
      search:'Buscar cursos...', totalCourses:'Cursos Totales', totalStudents:'Estudiantes', avgCompletion:'Completacion Promedio',
      published:'Publicados', complete:'Completado', manage:'Gestionar', myCourses:'Mis Cursos',
      createCourse:'Crear Curso', editCourse:'Editar Curso', name:'Nombre', tagline:'Subtitulo', description:'Descripcion',
      icon:'Icono', color:'Color', levelLabel:'Nivel', statusLabel:'Estado', orderIndex:'Orden', tutorialUrl:'URL Tutorial',
      save:'Guardar', cancel:'Cancelar', addLesson:'Agregar Leccion', editLesson:'Editar Leccion', createLesson:'Nueva Leccion',
      title:'Titulo', type:'Tipo', videoUrl:'URL del Video', content:'Contenido', durationMin:'Duracion (min)',
      confirmDelete:'Eliminar? No se puede deshacer.', noCoursesMatch:'Ningun curso coincide con',
      manageCourses:'Gestion de Cursos', lessonsOf:'Lecciones de'
    } : {
      newCourse:'New Course', students:'Students', lessons:'Lessons', enroll:'Enroll', progress:'Progress',
      search:'Search courses...', totalCourses:'Total Courses', totalStudents:'Students', avgCompletion:'Avg Completion',
      published:'Published', complete:'Completed', manage:'Manage', myCourses:'My Courses',
      createCourse:'Create Course', editCourse:'Edit Course', name:'Name', tagline:'Tagline', description:'Description',
      icon:'Icon (emoji)', color:'Color', levelLabel:'Level', statusLabel:'Status', orderIndex:'Order', tutorialUrl:'Tutorial URL',
      save:'Save', cancel:'Cancel', addLesson:'Add Lesson', editLesson:'Edit Lesson', createLesson:'New Lesson',
      title:'Title', type:'Type', videoUrl:'Video URL', content:'Content', durationMin:'Duration (min)',
      confirmDelete:'Delete this item? This cannot be undone.', noCoursesMatch:'No courses match',
      manageCourses:'Course Management', lessonsOf:'Lessons for'
    };
  }

  function loadAll(L) {
    var body = document.getElementById('coursesBody');
    if (!body) return;
    body.innerHTML = '<div style="padding:40px;text-align:center;color:#999">Loading courses...</div>';
    Promise.all([
      fetch(API_BASE + '/courses', { headers: { 'X-Auth-Token': getToken() } }).then(function(r){ return r.json(); }),
      fetch(API_BASE + '/courses/progress', { headers: { 'X-Auth-Token': getToken() } }).then(function(r){ return r.json(); })
    ]).then(function(results) {
      allCourses = results[0].items || [];
      (results[1].enrollments || []).forEach(function(e) { userProgress[e.course_id] = e; });
      buildPage(L);
    }).catch(function(err) {
      console.error('courses load failed:', err);
      body.innerHTML = '<div style="padding:40px;color:#e74c3c">Failed to load courses. Please refresh.</div>';
    });
  }

  function buildPage(L) {
    var body = document.getElementById('coursesBody');
    if (!body) return;
    var tabBar = isAdmin
      ? '<div class="courses-tab-bar"><button class="courses-tab active" data-tab="student">' + L.myCourses + '</button><button class="courses-tab" data-tab="admin">' + L.manage + '</button></div>'
      : '';
    body.innerHTML = tabBar +
      '<div id="courseStudentView"></div>' +
      '<div id="courseAdminView" style="display:none"></div>' +
      '<div id="courseDetail" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000;overflow-y:auto;padding:20px 0"></div>';
    if (isAdmin) {
      body.querySelectorAll('.courses-tab').forEach(function(btn) {
        btn.addEventListener('click', function() {
          body.querySelectorAll('.courses-tab').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          activeTab = btn.getAttribute('data-tab');
          document.getElementById('courseStudentView').style.display = activeTab === 'student' ? '' : 'none';
          document.getElementById('courseAdminView').style.display   = activeTab === 'admin'   ? '' : 'none';
          if (activeTab === 'admin') loadAdminView(L);
        });
      });
    }
    renderStudentView(L);
  }

  /* ── STUDENT ── */
  function renderStudentView(L) {
    var wrap = document.getElementById('courseStudentView');
    if (!wrap) return;
    var ts  = allCourses.reduce(function(a,c){ return a+(c.active_students||0); }, 0);
    var avg = allCourses.length ? Math.round(allCourses.reduce(function(a,c){ return a+(c.avg_completion||0); },0)/allCourses.length) : 0;
    var pub = allCourses.filter(function(c){ return c.status==='published'; }).length;
    var html = '<div class="courses-stats">';
    html += statCard(L.totalCourses, allCourses.length, '#22d3ee');
    html += statCard(L.totalStudents, ts.toLocaleString(), '#a29bfe');
    html += statCard(L.avgCompletion, avg+'%', '#00b894');
    html += statCard(L.published, pub, '#fdcb6e');
    html += '</div><div class="courses-toolbar"><input type="search" id="courseSearch" class="course-search" placeholder="' + escHtml(L.search) + '" /></div>';
    html += '<div class="course-grid" id="courseGrid"></div>';
    wrap.innerHTML = html;
    renderCourseGrid(L);
    wireSearch(L);
  }

  function statCard(label, value, color) {
    return '<div class="courses-stat" style="border-left:3px solid ' + color + '"><span class="courses-stat-label">' + escHtml(label) + '</span><div class="courses-stat-value">' + escHtml(String(value)) + '</div></div>';
  }

  function renderCourseGrid(L, filter) {
    var grid = document.getElementById('courseGrid');
    if (!grid) return;
    var q = (filter||'').trim().toLowerCase();
    var list = q ? allCourses.filter(function(c){
      var n = (cname(c) + ' ' + (c.name||'') + ' ' + (c.name_es||'')).toLowerCase();
      var t = (ctag(c)  + ' ' + (c.tagline||'') + ' ' + (c.tagline_es||'')).toLowerCase();
      return n.indexOf(q) !== -1 || t.indexOf(q) !== -1;
    }) : allCourses;
    if (!list.length) { grid.innerHTML = '<div class="empty-state">' + L.noCoursesMatch + ' "' + escHtml(q) + '"</div>'; return; }
    var html = '';
    list.forEach(function(c) {
      var en = userProgress[c.id], color = c.color||'#6c5ce7', pct = en?(en.progress_percent||0):0;
      var nm = cname(c), tg = ctag(c);
      html += '<article class="course-card">';
      if (c.cover_image) {
        html += '<div class="course-card-thumb course-card-thumb--img" style="border-bottom:1px solid ' + color + '33">';
        html += '<img src="' + escHtml(c.cover_image) + '" alt="' + escHtml(nm) + '" class="course-thumb-img" />';
        html += '<div class="course-thumb-overlay"><span class="course-thumb-icon-sm">' + escHtml(c.icon||'') + '</span></div></div>';
      } else {
        html += '<div class="course-card-thumb" style="background:linear-gradient(135deg,' + color + '22,' + color + '55);border-bottom:1px solid ' + color + '33">';
        html += '<div class="course-thumb-icon" style="color:' + color + '">' + escHtml(c.icon||'') + '</div>';
        html += '<div class="course-thumb-title" style="color:' + color + '">' + escHtml(nm) + '</div></div>';
      }
      html += '<div class="course-card-body">';
      html += '<div class="course-card-title">' + escHtml(nm) + '</div>';
      html += '<p class="course-card-tag">' + escHtml(tg) + '</p>';
      html += '<div class="course-meta"><span class="course-meta-item"><b>' + (c.lesson_count||0) + '</b> ' + L.lessons + '</span><span class="course-meta-item"> ' + escHtml(c.level||'All levels') + '</span></div>';
      html += '<div class="course-enroll"><span class="course-enroll-count">' + (c.active_students||0).toLocaleString() + ' ' + L.students.toLowerCase() + '</span>';
      if (en) html += '<span class="course-enroll-pct">' + Math.round(pct) + '% ' + L.progress.toLowerCase() + '</span>';
      html += '</div><div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
      html += '<div class="course-card-footer">';
      if (en) html += '<button class="btn course-view-btn" data-course-id="' + c.id + '">View Course</button>';
      else    html += '<button class="btn course-enroll-btn" data-course-id="' + c.id + '">' + escHtml(L.enroll) + '</button>';
      html += '</div></div></article>';
    });
    grid.innerHTML = html;
    grid.querySelectorAll('.course-enroll-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.preventDefault(); enrollCourse(parseInt(btn.getAttribute('data-course-id'),10),L); });
    });
    grid.querySelectorAll('.course-view-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.preventDefault(); showCourseDetail(parseInt(btn.getAttribute('data-course-id'),10),L); });
    });
  }

  function wireSearch(L) {
    var input = document.getElementById('courseSearch'); if (!input) return;
    var t;
    input.addEventListener('input', function(e){ clearTimeout(t); var v=e.target.value; t=setTimeout(function(){ renderCourseGrid(L,v); },120); });
  }

  function enrollCourse(courseId, L) {
    api('POST','/courses/enroll',{course_id:courseId}).then(function(resp){
      if (resp.enrollment_id) { userProgress[courseId]={id:resp.enrollment_id,course_id:courseId,progress_percent:0,status:'active'}; renderCourseGrid(L); toast('Enrolled!'); }
      else toast(resp.error||'Enroll failed',true);
    }).catch(function(){ toast('Enroll failed',true); });
  }

  function showCourseDetail(courseId, L) {
    api('GET','/courses/'+courseId).then(function(data){
      var lessons=data.lessons||[], color=(data.course&&data.course.color)||'#6c5ce7', en=data.enrollment||userProgress[courseId];
      var dname = data.course ? cname(data.course) : '';
      var dtag  = data.course ? ctag(data.course)  : '';
      var html='<div class="course-detail-modal" style="max-width:800px;margin:40px auto">';
      if (data.course && data.course.cover_image) {
        html+='<div class="modal-header" style="position:relative;padding:0;overflow:hidden;border-bottom:1px solid '+color+'33">';
        html+='<img src="'+escHtml(data.course.cover_image)+'" style="width:100%;height:220px;object-fit:cover;display:block" />';
        html+='<div style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px;background:linear-gradient(transparent,rgba(0,0,0,0.82))">';
        html+='<div style="font-size:32px;line-height:1;margin-bottom:8px">'+escHtml((data.course.icon)||'')+'</div>';
        html+='<h2 style="margin:0;color:#fff">'+escHtml(dname)+'</h2>';
        html+='<p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:14px">'+escHtml(dtag)+'</p></div>';
        html+='<button class="modal-close">&times;</button></div>';
      } else {
        html+='<div class="modal-header" style="background:linear-gradient(135deg,'+color+'22,'+color+'55);border-bottom:1px solid '+color+'33">';
        html+='<div><div style="font-size:40px;line-height:1;margin-bottom:12px">'+escHtml((data.course&&data.course.icon)||'')+'</div>';
        html+='<h2 style="margin:0;color:'+color+'">'+escHtml(dname)+'</h2>';
        html+='<p style="margin:8px 0 0;color:var(--text-dim,#8b8fa3);font-size:14px">'+escHtml(dtag)+'</p></div>';
        html+='<button class="modal-close">&times;</button></div>';
      }
      html+='<div style="padding:28px">';
      if (en) { var pct=Math.round(en.progress_percent||0); html+='<div class="progress-bar" style="height:8px;margin-bottom:12px"><div class="progress-fill" style="width:'+pct+'%;background:'+color+';height:100%"></div></div><p style="color:var(--text-dim,#8b8fa3);margin:0 0 20px;font-size:14px">'+pct+'% '+L.complete.toLowerCase()+'</p>'; }
      html+='<h3 style="margin:0 0 16px;color:var(--text,#e4e7ec)">'+L.lessons+'</h3>';
      if (!lessons.length) { html+='<div class="empty-state" style="padding:24px 0">No lessons available yet.</div>'; }
      else { lessons.forEach(function(lesson){
        html+='<div style="padding:12px;border:1px solid var(--border,#2a2d3a);border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px">';
        html+='<div><div style="font-weight:600;color:var(--text,#e4e7ec)">'+escHtml(lesson.title)+'</div><div style="font-size:13px;color:var(--text-muted,#5a5e70);margin-top:4px">'+(lesson.duration_minutes||0)+' min - '+escHtml(lesson.type||'video')+'</div></div>';
        if (en) html+='<button class="lesson-complete-btn" data-lesson-id="'+lesson.id+'" style="background:'+color+'">Mark Done</button>';
        html+='</div>';
      }); }
      html+='</div></div>';
      var modal=document.getElementById('courseDetail');
      modal.innerHTML=html; modal.style.display='block';
      modal.querySelector('.modal-close').addEventListener('click',function(){ modal.style.display='none'; });
      modal.addEventListener('click',function(e){ if(e.target===modal) modal.style.display='none'; });
      modal.querySelectorAll('.lesson-complete-btn').forEach(function(btn){
        btn.addEventListener('click',function(){ markLessonComplete(courseId,parseInt(btn.getAttribute('data-lesson-id'),10),L); });
      });
    }).catch(function(){ toast('Failed to load course details',true); });
  }

  function markLessonComplete(courseId, lessonId, L) {
    api('POST','/courses/'+courseId+'/complete-lesson',{lesson_id:lessonId,time_spent_minutes:0}).then(function(resp){
      if (resp.progress_percent!==undefined) {
        if (!userProgress[courseId]) userProgress[courseId]={course_id:courseId};
        userProgress[courseId].progress_percent=resp.progress_percent;
        showCourseDetail(courseId,L);
        if (resp.course_complete) toast('Course completed!');
      }
    }).catch(function(e){ console.error('mark lesson failed:',e); });
  }

  /* ── ADMIN ── */
  function loadAdminView(L) {
    var wrap=document.getElementById('courseAdminView');
    if (!wrap||wrap.dataset.loaded==='1') return;
    wrap.dataset.loaded='1';
    wrap.innerHTML='<div style="padding:40px;text-align:center;color:#999">Loading...</div>';
    api('GET','/courses?admin=1&limit=200').then(function(resp){
      adminCourses=resp.items||[];
      renderAdminView(L);
    }).catch(function(){ wrap.innerHTML='<div style="padding:40px;color:#e74c3c">Failed to load admin data.</div>'; });
  }

  function renderAdminView(L) {
    var wrap=document.getElementById('courseAdminView'); if (!wrap) return;
    var published=adminCourses.filter(function(c){ return c.status==='published'; }).length;
    var drafts=adminCourses.filter(function(c){ return c.status==='draft'; }).length;
    var totalEnroll=adminCourses.reduce(function(a,c){ return a+(c.active_students||0); },0);
    var html='<div class="courses-admin">';
    html+='<div class="courses-admin-header"><h2 style="margin:0;font-size:20px;font-weight:700;color:var(--text,#e4e7ec)">'+L.manageCourses+'</h2>';
    html+='<button class="btn course-enroll-btn" id="adminCreateCourse">+ '+L.newCourse+'</button></div>';
    html+='<div class="courses-stats" style="margin-top:20px">';
    html+=statCard(L.totalCourses,adminCourses.length,'#22d3ee');
    html+=statCard(L.published,published,'#00b894');
    html+=statCard('Drafts',drafts,'#fdcb6e');
    html+=statCard(L.totalStudents,totalEnroll.toLocaleString(),'#a29bfe');
    html+='</div>';
    if (!adminCourses.length) {
      html+='<div class="empty-state" style="padding:60px 20px">No courses yet. Create your first one!</div>';
    } else {
      html+='<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Course</th><th>Status</th><th>Lessons</th><th>Students</th><th>Avg %</th><th>Actions</th></tr></thead><tbody>';
      adminCourses.forEach(function(c){
        var bc=c.status==='published'?'badge-green':(c.status==='archived'?'badge-red':'badge-yellow');
        html+='<tr><td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:22px">'+escHtml(c.icon||'')+' </span><div><b>'+escHtml(c.name)+'</b><div style="font-size:12px;color:var(--text-muted,#5a5e70)">'+escHtml(c.tagline||'')+'</div></div></div></td>';
        html+='<td><span class="admin-badge '+bc+'">'+escHtml(c.status)+'</span></td>';
        html+='<td>'+(c.lesson_count||0)+'</td><td>'+(c.active_students||0)+'</td><td>'+(c.avg_completion||0)+'%</td>';
        html+='<td class="admin-actions"><button class="btn-sm-admin btn-edit-course" data-id="'+c.id+'">Edit</button> <button class="btn-sm-admin btn-lessons" data-id="'+c.id+'" data-name="'+escHtml(c.name)+'">Lessons</button> <button class="btn-sm-admin btn-del btn-del-course" data-id="'+c.id+'">Del</button></td></tr>';
      });
      html+='</tbody></table></div>';
    }
    html+='<div id="adminLessonsPanel" class="lessons-panel" style="display:none"></div></div>';
    wrap.innerHTML=html; wrap.dataset.loaded='1';
    wrap.querySelector('#adminCreateCourse').addEventListener('click',function(){ showCourseModal(null,L); });
    wrap.querySelectorAll('.btn-edit-course').forEach(function(btn){
      btn.addEventListener('click',function(){ var id=parseInt(btn.getAttribute('data-id'),10); showCourseModal(adminCourses.find(function(c){ return c.id===id; }),L); });
    });
    wrap.querySelectorAll('.btn-lessons').forEach(function(btn){
      btn.addEventListener('click',function(){ showLessonsPanel(parseInt(btn.getAttribute('data-id'),10),btn.getAttribute('data-name'),L); });
    });
    wrap.querySelectorAll('.btn-del-course').forEach(function(btn){
      btn.addEventListener('click',function(){ deleteCourse(parseInt(btn.getAttribute('data-id'),10),L); });
    });
  }

  function showCourseModal(course, L) {
    var isEdit=!!course;
    var html='<div class="admin-modal-overlay" id="adminModalOverlay"><div class="admin-modal">';
    html+='<div class="admin-modal-header"><h3>'+(isEdit?L.editCourse:L.createCourse)+'</h3><button class="modal-close" id="adminModalClose">&times;</button></div>';
    html+='<form id="adminCourseForm" class="admin-form">';
    html+=fRow(L.name,'<input name="name" required value="'+escHtml(course?course.name:'')+'" />');
    html+=fRow(L.tagline,'<input name="tagline" value="'+escHtml(course?(course.tagline||''):'')+'" />');
    html+=fRow(L.description,'<textarea name="description" rows="3">'+escHtml(course?(course.description||''):'')+'</textarea>');
    html+=fRow(L.icon,'<input name="icon" value="'+escHtml(course?(course.icon||''):'')+'" style="width:80px" />');
    html+=fRow(L.color,'<input name="color" type="color" value="'+escHtml(course?(course.color||'#6c5ce7'):'#6c5ce7')+'" style="width:60px;height:36px;border-radius:6px;cursor:pointer" />');
    html+=fRow(L.levelLabel,'<select name="level">'+['Beginner','Intermediate','Advanced','All levels'].map(function(l){ return '<option'+(course&&course.level===l?' selected':'')+'>'+l+'</option>'; }).join('')+'</select>');
    html+=fRow(L.statusLabel,'<select name="status">'+['draft','published','archived'].map(function(s){ return '<option value="'+s+'"'+(course&&course.status===s?' selected':'')+'>'+s+'</option>'; }).join('')+'</select>');
    html+=fRow(L.tutorialUrl,'<input name="tutorial_url" value="'+escHtml(course?(course.tutorial_url||''):'')+'" />');
    html+=fRow(L.orderIndex,'<input name="order_index" type="number" min="0" value="'+(course?(course.order_index||99):99)+'" style="width:80px" />');
    html+='<div class="admin-form-footer"><button type="submit" class="btn course-enroll-btn">'+L.save+'</button> <button type="button" id="adminFormCancel" class="btn course-view-btn">'+L.cancel+'</button></div></form></div></div>';
    var div=document.createElement('div'); div.innerHTML=html; document.body.appendChild(div.firstChild);
    var ov=document.getElementById('adminModalOverlay');
    document.getElementById('adminModalClose').addEventListener('click',function(){ ov.remove(); });
    document.getElementById('adminFormCancel').addEventListener('click',function(){ ov.remove(); });
    ov.addEventListener('click',function(e){ if(e.target===ov) ov.remove(); });
    document.getElementById('adminCourseForm').addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(e.target),data={}; fd.forEach(function(v,k){ data[k]=v; }); data.order_index=parseInt(data.order_index,10)||99;
      saveCourse(data,isEdit?course.id:null,L,function(){ ov.remove(); });
    });
  }

  function fRow(label, input) { return '<div class="admin-form-row"><label>'+escHtml(label)+'</label>'+input+'</div>'; }

  function saveCourse(data, id, L, done) {
    api(id?'PUT':'POST',id?'/courses/'+id:'/courses',data).then(function(resp){
      if (resp.course) { toast(id?'Course updated!':'Course created!'); if(typeof done==='function') done(); var w=document.getElementById('courseAdminView'); if(w) w.dataset.loaded='0'; loadAdminView(L); }
      else toast(resp.error||'Save failed',true);
    }).catch(function(){ toast('Save failed',true); });
  }

  function deleteCourse(id, L) {
    if (!confirm(L.confirmDelete)) return;
    api('DELETE','/courses/'+id).then(function(resp){
      if (resp.deleted) { toast('Course deleted.'); var w=document.getElementById('courseAdminView'); if(w) w.dataset.loaded='0'; loadAdminView(L); }
      else toast(resp.error||'Delete failed',true);
    }).catch(function(){ toast('Delete failed',true); });
  }

  function showLessonsPanel(courseId, courseName, L) {
    managingCourseId=courseId;
    var panel=document.getElementById('adminLessonsPanel'); if (!panel) return;
    panel.style.display='block';
    panel.innerHTML='<div style="padding:16px;color:#999">Loading lessons...</div>';
    panel.scrollIntoView({behavior:'smooth',block:'nearest'});
    api('GET','/courses/'+courseId+'/lessons').then(function(resp){ renderLessonsPanel(courseId,courseName,resp.lessons||[],L); })
      .catch(function(){ panel.innerHTML='<div style="padding:16px;color:#e74c3c">Failed to load lessons.</div>'; });
  }

  function renderLessonsPanel(courseId, courseName, lessons, L) {
    var panel=document.getElementById('adminLessonsPanel'); if (!panel) return;
    var html='<div class="lessons-panel-header"><h3>'+L.lessonsOf+': '+escHtml(courseName)+'</h3>';
    html+='<div style="display:flex;gap:8px"><button class="btn course-enroll-btn btn-add-lesson">+ '+L.addLesson+'</button><button class="btn course-view-btn btn-close-lessons">Close</button></div></div>';
    if (!lessons.length) { html+='<div class="empty-state" style="padding:32px 0">No lessons yet. Add your first!</div>'; }
    else {
      html+='<div class="lessons-list">';
      lessons.forEach(function(lesson,idx){
        var sc=lesson.status==='published'?'#00b894':(lesson.status==='archived'?'#e17055':'#fdcb6e');
        html+='<div class="lesson-row"><div class="lesson-row-num">'+(idx+1)+'</div>';
        html+='<div class="lesson-row-body"><div class="lesson-row-title">'+escHtml(lesson.title)+'</div>';
        html+='<div class="lesson-row-meta">'+(lesson.duration_minutes||0)+' min - '+escHtml(lesson.type||'video')+' - <span style="color:'+sc+'">'+escHtml(lesson.status)+'</span></div></div>';
        html+='<div class="lesson-row-actions"><button class="btn-sm-admin btn-edit-lesson" data-id="'+lesson.id+'">Edit</button> <button class="btn-sm-admin btn-del btn-del-lesson" data-id="'+lesson.id+'">Del</button></div></div>';
      });
      html+='</div>';
    }
    panel.innerHTML=html;
    panel.querySelector('.btn-close-lessons').addEventListener('click',function(){ panel.style.display='none'; });
    panel.querySelector('.btn-add-lesson').addEventListener('click',function(){ showLessonModal(null,courseId,courseName,lessons.length+1,L); });
    panel.querySelectorAll('.btn-edit-lesson').forEach(function(btn){
      btn.addEventListener('click',function(){ var id=parseInt(btn.getAttribute('data-id'),10); showLessonModal(lessons.find(function(l){ return l.id===id; }),courseId,courseName,lessons.length+1,L); });
    });
    panel.querySelectorAll('.btn-del-lesson').forEach(function(btn){
      btn.addEventListener('click',function(){ deleteLesson(courseId,parseInt(btn.getAttribute('data-id'),10),courseName,L); });
    });
  }

  function showLessonModal(lesson, courseId, courseName, nextOrder, L) {
    var isEdit=!!lesson;
    var html='<div class="admin-modal-overlay" id="adminLessonModalOverlay"><div class="admin-modal">';
    html+='<div class="admin-modal-header"><h3>'+(isEdit?L.editLesson:L.createLesson)+' - '+escHtml(courseName)+'</h3><button class="modal-close" id="adminLessonClose">&times;</button></div>';
    html+='<form id="adminLessonForm" class="admin-form">';
    html+=fRow(L.title,'<input name="title" required value="'+escHtml(lesson?lesson.title:'')+'" />');
    html+=fRow(L.description,'<textarea name="description" rows="2">'+escHtml(lesson?(lesson.description||''):'')+'</textarea>');
    html+=fRow(L.type,'<select name="type">'+['video','text','quiz','assignment'].map(function(t){ return '<option value="'+t+'"'+(lesson&&lesson.type===t?' selected':'')+'>'+t.charAt(0).toUpperCase()+t.slice(1)+'</option>'; }).join('')+'</select>');
    html+=fRow(L.durationMin,'<input name="duration_minutes" type="number" min="0" value="'+(lesson?(lesson.duration_minutes||0):0)+'" style="width:100px" />');
    html+=fRow(L.videoUrl,'<input name="video_url" value="'+escHtml(lesson?(lesson.video_url||''):'')+'" />');
    html+=fRow(L.content,'<textarea name="content" rows="4">'+escHtml(lesson?(lesson.content||''):'')+'</textarea>');
    html+=fRow(L.statusLabel,'<select name="status">'+['draft','published','archived'].map(function(s){ return '<option value="'+s+'"'+(lesson&&lesson.status===s?' selected':'')+'>'+s+'</option>'; }).join('')+'</select>');
    html+=fRow(L.orderIndex,'<input name="order_index" type="number" min="0" value="'+(lesson?(lesson.order_index||nextOrder):nextOrder)+'" style="width:80px" />');
    html+='<div class="admin-form-footer"><button type="submit" class="btn course-enroll-btn">'+L.save+'</button> <button type="button" id="adminLessonCancel" class="btn course-view-btn">'+L.cancel+'</button></div></form></div></div>';
    var div=document.createElement('div'); div.innerHTML=html; document.body.appendChild(div.firstChild);
    var ov=document.getElementById('adminLessonModalOverlay');
    document.getElementById('adminLessonClose').addEventListener('click',function(){ ov.remove(); });
    document.getElementById('adminLessonCancel').addEventListener('click',function(){ ov.remove(); });
    ov.addEventListener('click',function(e){ if(e.target===ov) ov.remove(); });
    document.getElementById('adminLessonForm').addEventListener('submit',function(e){
      e.preventDefault(); var fd=new FormData(e.target),data={}; fd.forEach(function(v,k){ data[k]=v; });
      data.duration_minutes=parseInt(data.duration_minutes,10)||0; data.order_index=parseInt(data.order_index,10)||1;
      saveLesson(data,courseId,isEdit?lesson.id:null,courseName,L,function(){ ov.remove(); });
    });
  }

  function saveLesson(data, courseId, lessonId, courseName, L, done) {
    api(lessonId?'PUT':'POST',lessonId?'/courses/'+courseId+'/lessons/'+lessonId:'/courses/'+courseId+'/lessons',data).then(function(resp){
      if (resp.lesson) { toast(lessonId?'Lesson updated!':'Lesson created!'); if(typeof done==='function') done(); showLessonsPanel(courseId,courseName,L); }
      else toast(resp.error||'Save failed',true);
    }).catch(function(){ toast('Save failed',true); });
  }

  function deleteLesson(courseId, lessonId, courseName, L) {
    if (!confirm(L.confirmDelete)) return;
    api('DELETE','/courses/'+courseId+'/lessons/'+lessonId).then(function(resp){
      if (resp.deleted) { toast('Lesson deleted.'); showLessonsPanel(courseId,courseName,L); }
      else toast(resp.error||'Delete failed',true);
    }).catch(function(){ toast('Delete failed',true); });
  }

})();
