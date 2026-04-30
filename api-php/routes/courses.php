<?php
/* Courses API — course list, lessons, enrollments, progress + admin CRUD */

function route_courses($parts, $method) {
  $u = requirePaidAccess();
  $role    = $u['role']  ?? '';
  $type    = $u['type']  ?? '';
  $isAdmin = $role === 'admin' || $role === 'superadmin' || $type === 'superadmin';

  // URL segments: $parts[0]=action, $parts[1]=sub, $parts[2]=sub2
  // e.g. /api/courses/5/lessons/12  → $action='5', $sub='lessons', $sub2='12'
  $action = $parts[0] ?? null;
  $sub    = $parts[1] ?? null;
  $sub2   = $parts[2] ?? null;

  /* ─── GET /api/courses ─── */
  if (!$action && $method === 'GET') {
    $q      = qparam('q', '');
    $level  = qparam('level', '');
    $asAdmin = $isAdmin && qparam('admin', '') === '1';
    $limit  = max(1, min(500, (int) qparam('limit', 100)));
    $offset = max(0, (int) qparam('offset', 0));

    $where  = $asAdmin ? [] : ["status = 'published'"];
    $params = [];

    if ($q !== '') {
      $where[] = '(name LIKE ? OR tagline LIKE ?)';
      $like = '%' . $q . '%';
      array_push($params, $like, $like);
    }
    if ($level !== '') {
      $where[] = 'level = ?';
      $params[] = $level;
    }
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $total = (int) qOne("SELECT COUNT(*) AS c FROM courses $whereSql", $params)['c'];
    $rows = qAll(
      "SELECT id, slug, name, tagline, description, icon, color, level, status, order_index,
              (SELECT COUNT(*) FROM course_enrollments WHERE course_id = courses.id AND status = 'active') as active_students,
              (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id) as lesson_count,
              (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id AND status = 'published') as published_lessons,
              (SELECT AVG(COALESCE(progress_percent, 0)) FROM course_enrollments WHERE course_id = courses.id) as avg_completion
       FROM courses $whereSql ORDER BY order_index ASC, id ASC LIMIT $limit OFFSET $offset",
      $params
    );

    foreach ($rows as &$r) {
      $r['active_students']   = (int) $r['active_students'];
      $r['lesson_count']      = (int) $r['lesson_count'];
      $r['published_lessons'] = (int) ($r['published_lessons'] ?? 0);
      $r['avg_completion']    = (int) ($r['avg_completion'] ?? 0);
      $r['order_index']       = (int) $r['order_index'];
    }

    json_out(['total' => $total, 'limit' => $limit, 'offset' => $offset, 'items' => $rows]);
  }

  /* ─── POST /api/courses — admin: create course ─── */
  if (!$action && $method === 'POST') {
    if (!$isAdmin) err('Admin access required', 403);
    $b = body();
    $name        = trim($b['name'] ?? '');
    $slug        = trim($b['slug'] ?? '');
    $tagline     = trim($b['tagline'] ?? '');
    $description = trim($b['description'] ?? '');
    $icon        = trim($b['icon'] ?? '📚');
    $color       = trim($b['color'] ?? '#6c5ce7');
    $level       = $b['level'] ?? 'Intermediate';
    $status      = $b['status'] ?? 'draft';
    $tutorial_url = trim($b['tutorial_url'] ?? '');
    $order_index  = (int) ($b['order_index'] ?? 99);

    if (!$name) err('name is required', 400);
    if (!$slug)  $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($name));
    $slug = trim(preg_replace('/-+/', '-', $slug), '-');

    $existing = qOne("SELECT id FROM courses WHERE slug = ?", [$slug]);
    if ($existing) $slug .= '-' . time();

    $allowed_levels   = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];
    $allowed_statuses = ['draft', 'published', 'archived'];
    if (!in_array($level, $allowed_levels))   $level  = 'Intermediate';
    if (!in_array($status, $allowed_statuses)) $status = 'draft';

    qExec(
      "INSERT INTO courses (slug, name, tagline, description, icon, color, level, status, tutorial_url, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [$slug, $name, $tagline, $description, $icon, $color, $level, $status, $tutorial_url, $order_index]
    );
    $id = lastId();
    json_out(['course' => qOne("SELECT * FROM courses WHERE id = ?", [$id])], 201);
  }

  /* ─── GET /api/courses/progress ─── */
  if ($action === 'progress' && $method === 'GET') {
    $enrollments = qAll(
      "SELECT e.id, e.course_id, e.progress_percent, e.status, e.enrolled_at, e.completed_at,
              c.name, c.slug, c.icon, c.color,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id AND status = 'published') as total_lessons,
              (SELECT COUNT(*) FROM lesson_completions WHERE enrollment_id = e.id) as completed_lessons
       FROM course_enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ? ORDER BY e.updated_at DESC",
      [$u['id']]
    );

    foreach ($enrollments as &$e) {
      $e['progress_percent']  = (int) $e['progress_percent'];
      $e['total_lessons']     = (int) $e['total_lessons'];
      $e['completed_lessons'] = (int) $e['completed_lessons'];
    }

    json_out(['enrollments' => $enrollments]);
  }

  /* ─── GET /api/courses/admin/stats ─── */
  if ($action === 'admin' && $sub === 'stats' && $method === 'GET') {
    if (!$isAdmin) err('Admin access required', 403);
    $stats = qAll(
      "SELECT c.id, c.name, c.status, c.icon, c.color, c.order_index,
              COUNT(DISTINCT e.id) as total_enrollments,
              COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_enrollments,
              COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_enrollments,
              COALESCE(AVG(e.progress_percent), 0) as avg_progress,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id AND status = 'published') as lesson_count
       FROM courses c
       LEFT JOIN course_enrollments e ON e.course_id = c.id
       GROUP BY c.id, c.name, c.status, c.icon, c.color, c.order_index
       ORDER BY c.order_index ASC, c.id ASC",
      []
    );

    $totals = qOne(
      "SELECT COUNT(*) as total_courses,
              (SELECT COUNT(*) FROM course_enrollments) as total_enrollments,
              (SELECT COUNT(*) FROM course_enrollments WHERE status = 'completed') as completed,
              (SELECT COALESCE(AVG(progress_percent), 0) FROM course_enrollments) as avg_progress
       FROM courses",
      []
    );

    foreach ($stats as &$s) {
      $s['total_enrollments']     = (int) $s['total_enrollments'];
      $s['completed_enrollments'] = (int) $s['completed_enrollments'];
      $s['active_enrollments']    = (int) $s['active_enrollments'];
      $s['avg_progress']          = (int) ($s['avg_progress'] ?? 0);
      $s['lesson_count']          = (int) $s['lesson_count'];
      $s['order_index']           = (int) $s['order_index'];
    }

    json_out([
      'stats'  => $stats,
      'totals' => [
        'total_courses'   => (int) ($totals['total_courses'] ?? 0),
        'total_enrollments' => (int) ($totals['total_enrollments'] ?? 0),
        'completed'       => (int) ($totals['completed'] ?? 0),
        'avg_progress'    => (int) ($totals['avg_progress'] ?? 0),
      ]
    ]);
  }

  /* ─── POST /api/courses/enroll ─── */
  if ($action === 'enroll' && $method === 'POST') {
    $b = body();
    $courseId = (int) ($b['course_id'] ?? 0);
    if (!$courseId) err('Missing course_id', 400);

    $course = qOne("SELECT id FROM courses WHERE id = ? AND status = 'published'", [$courseId]);
    if (!$course) err('Course not found', 404);

    $existing = qOne(
      "SELECT id FROM course_enrollments WHERE course_id = ? AND user_id = ?",
      [$courseId, $u['id']]
    );

    if ($existing) {
      json_out(['message' => 'Already enrolled', 'enrollment_id' => $existing['id']]);
      return;
    }

    qExec(
      "INSERT INTO course_enrollments (course_id, user_id, status) VALUES (?, ?, ?)",
      [$courseId, $u['id'], 'active']
    );
    $enrollmentId = lastId();
    log_activity('course.enroll', 'course', $courseId, ['enrollment_id' => $enrollmentId]);
    json_out(['enrollment_id' => $enrollmentId, 'status' => 'active'], 201);
  }

  /* ─── Routes by numeric ID ─── */
  if ($action !== null && is_numeric($action)) {
    $courseId = (int) $action;

    /* GET /api/courses/{id} */
    if ($sub === null && $method === 'GET') {
      $statusCond = $isAdmin ? '' : "AND status = 'published'";
      $course = qOne("SELECT * FROM courses WHERE id = ? $statusCond", [$courseId]);
      if (!$course) err('Course not found', 404);

      $lessonCond = $isAdmin ? '' : "AND status = 'published'";
      $lessons = qAll(
        "SELECT id, order_index, title, description, duration_minutes, type, status, video_url
         FROM lessons WHERE course_id = ? $lessonCond ORDER BY order_index ASC",
        [$courseId]
      );

      $enrollment = qOne(
        "SELECT id, progress_percent, status, enrolled_at, completed_at
         FROM course_enrollments WHERE course_id = ? AND user_id = ?",
        [$courseId, $u['id']]
      );

      json_out([
        'course'       => $course,
        'lessons'      => $lessons,
        'enrollment'   => $enrollment,
        'total_lessons' => count($lessons)
      ]);
    }

    /* PUT /api/courses/{id} — admin: update */
    if ($sub === null && $method === 'PUT') {
      if (!$isAdmin) err('Admin access required', 403);
      $course = qOne("SELECT id FROM courses WHERE id = ?", [$courseId]);
      if (!$course) err('Course not found', 404);
      $b = body();

      $fields = []; $params = [];
      $allowed          = ['name','tagline','description','icon','color','level','status','tutorial_url','order_index'];
      $allowed_levels   = ['Beginner','Intermediate','Advanced','All levels'];
      $allowed_statuses = ['draft','published','archived'];

      foreach ($allowed as $f) {
        if (!array_key_exists($f, $b)) continue;
        $v = $b[$f];
        if ($f === 'level'  && !in_array($v, $allowed_levels))   continue;
        if ($f === 'status' && !in_array($v, $allowed_statuses)) continue;
        if ($f === 'order_index') $v = (int) $v;
        $fields[] = "$f = ?";
        $params[] = $v;
      }

      if (!$fields) err('No valid fields to update', 400);
      $params[] = $courseId;
      qExec("UPDATE courses SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?", $params);
      json_out(['course' => qOne("SELECT * FROM courses WHERE id = ?", [$courseId])]);
    }

    /* DELETE /api/courses/{id} — admin: delete */
    if ($sub === null && $method === 'DELETE') {
      if (!$isAdmin) err('Admin access required', 403);
      $course = qOne("SELECT id FROM courses WHERE id = ?", [$courseId]);
      if (!$course) err('Course not found', 404);
      qExec("DELETE FROM courses WHERE id = ?", [$courseId]);
      json_out(['deleted' => true]);
    }

    /* POST /api/courses/{id}/complete-lesson */
    if ($sub === 'complete-lesson' && $method === 'POST') {
      $b = body();
      $lessonId  = (int) ($b['lesson_id'] ?? 0);
      $timeSpent = (int) ($b['time_spent_minutes'] ?? 0);
      if (!$lessonId) err('Missing lesson_id', 400);

      $lesson = qOne("SELECT id FROM lessons WHERE id = ? AND course_id = ?", [$lessonId, $courseId]);
      if (!$lesson) err('Lesson not found', 404);

      $enrollment = qOne(
        "SELECT id FROM course_enrollments WHERE course_id = ? AND user_id = ?",
        [$courseId, $u['id']]
      );
      if (!$enrollment) err('Not enrolled in course', 403);

      $existing = qOne(
        "SELECT id FROM lesson_completions WHERE lesson_id = ? AND enrollment_id = ?",
        [$lessonId, $enrollment['id']]
      );

      if (!$existing) {
        qExec(
          "INSERT INTO lesson_completions (lesson_id, enrollment_id, time_spent_minutes) VALUES (?, ?, ?)",
          [$lessonId, $enrollment['id'], $timeSpent]
        );
      }

      $completed = (int) qOne(
        "SELECT COUNT(*) as c FROM lesson_completions WHERE enrollment_id = ?",
        [$enrollment['id']]
      )['c'];
      $total = (int) qOne(
        "SELECT COUNT(*) as c FROM lessons WHERE course_id = ? AND status = 'published'",
        [$courseId]
      )['c'];
      $progress = $total > 0 ? (int) ($completed / $total * 100) : 0;

      qExec(
        "UPDATE course_enrollments SET progress_percent = ?, updated_at = NOW() WHERE id = ?",
        [$progress, $enrollment['id']]
      );

      if ($total > 0 && $completed >= $total) {
        qExec(
          "UPDATE course_enrollments SET status = 'completed', completed_at = NOW() WHERE id = ?",
          [$enrollment['id']]
        );
      }

      log_activity('course.lesson_complete', 'lesson', $lessonId, ['enrollment_id' => $enrollment['id']]);
      json_out(['progress_percent' => $progress, 'course_complete' => $progress === 100]);
    }

    /* GET /api/courses/{id}/lessons — admin */
    if ($sub === 'lessons' && $sub2 === null && $method === 'GET') {
      if (!$isAdmin) err('Admin access required', 403);
      $lessons = qAll(
        "SELECT id, order_index, title, description, content, duration_minutes, video_url, type, status
         FROM lessons WHERE course_id = ? ORDER BY order_index ASC",
        [$courseId]
      );
      foreach ($lessons as &$l) {
        $l['order_index']       = (int) $l['order_index'];
        $l['duration_minutes']  = (int) $l['duration_minutes'];
      }
      json_out(['lessons' => $lessons, 'total' => count($lessons)]);
    }

    /* POST /api/courses/{id}/lessons — admin: create lesson */
    if ($sub === 'lessons' && $sub2 === null && $method === 'POST') {
      if (!$isAdmin) err('Admin access required', 403);
      $course = qOne("SELECT id FROM courses WHERE id = ?", [$courseId]);
      if (!$course) err('Course not found', 404);
      $b = body();

      $title       = trim($b['title'] ?? '');
      $description = trim($b['description'] ?? '');
      $content     = trim($b['content'] ?? '');
      $duration    = (int) ($b['duration_minutes'] ?? 0);
      $video_url   = trim($b['video_url'] ?? '');
      $type        = $b['type'] ?? 'video';
      $status      = $b['status'] ?? 'draft';
      $order_index = (int) ($b['order_index'] ?? 99);

      if (!$title) err('title is required', 400);

      $allowed_types    = ['video','text','quiz','assignment'];
      $allowed_statuses = ['draft','published','archived'];
      if (!in_array($type, $allowed_types))     $type   = 'video';
      if (!in_array($status, $allowed_statuses)) $status = 'draft';

      qExec(
        "INSERT INTO lessons (course_id, order_index, title, description, content, duration_minutes, video_url, type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [$courseId, $order_index, $title, $description, $content, $duration, $video_url, $type, $status]
      );
      $lessonId = lastId();
      json_out(['lesson' => qOne("SELECT * FROM lessons WHERE id = ?", [$lessonId])], 201);
    }

    /* PUT /api/courses/{id}/lessons/{lessonId} — admin: update */
    if ($sub === 'lessons' && $sub2 !== null && $method === 'PUT') {
      if (!$isAdmin) err('Admin access required', 403);
      $lessonId = (int) $sub2;
      $lesson = qOne("SELECT id FROM lessons WHERE id = ? AND course_id = ?", [$lessonId, $courseId]);
      if (!$lesson) err('Lesson not found', 404);
      $b = body();

      $fields = []; $params = [];
      $allowed          = ['title','description','content','duration_minutes','video_url','type','status','order_index'];
      $allowed_types    = ['video','text','quiz','assignment'];
      $allowed_statuses = ['draft','published','archived'];

      foreach ($allowed as $f) {
        if (!array_key_exists($f, $b)) continue;
        $v = $b[$f];
        if ($f === 'type'   && !in_array($v, $allowed_types))    continue;
        if ($f === 'status' && !in_array($v, $allowed_statuses)) continue;
        if (in_array($f, ['duration_minutes','order_index'])) $v = (int) $v;
        $fields[] = "$f = ?";
        $params[] = $v;
      }

      if (!$fields) err('No valid fields to update', 400);
      $params[] = $lessonId;
      qExec("UPDATE lessons SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?", $params);
      json_out(['lesson' => qOne("SELECT * FROM lessons WHERE id = ?", [$lessonId])]);
    }

    /* DELETE /api/courses/{id}/lessons/{lessonId} — admin: delete */
    if ($sub === 'lessons' && $sub2 !== null && $method === 'DELETE') {
      if (!$isAdmin) err('Admin access required', 403);
      $lessonId = (int) $sub2;
      $lesson = qOne("SELECT id FROM lessons WHERE id = ? AND course_id = ?", [$lessonId, $courseId]);
      if (!$lesson) err('Lesson not found', 404);
      qExec("DELETE FROM lessons WHERE id = ?", [$lessonId]);
      json_out(['deleted' => true]);
    }
  }

  err('Invalid request', 400);
}
