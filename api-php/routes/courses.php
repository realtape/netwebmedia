<?php
/* Courses API — course list, lessons, enrollments, progress tracking */

function route_courses($parts, $method) {
  $u = requirePaidAccess();
  $action = $parts[0] ?? null;

  // GET /api/courses — list all published courses
  if (!$action && $method === 'GET') {
    $q = qparam('q', '');
    $level = qparam('level', '');
    $limit = max(1, min(500, (int) qparam('limit', 100)));
    $offset = max(0, (int) qparam('offset', 0));

    $where = ['status = ?'];
    $params = ['published'];
    if ($q !== '') {
      $where[] = '(name LIKE ? OR tagline LIKE ?)';
      $like = '%' . $q . '%';
      array_push($params, $like, $like);
    }
    if ($level !== '') {
      $where[] = 'level = ?';
      $params[] = $level;
    }
    $whereSql = implode(' AND ', $where);

    $total = (int) qOne("SELECT COUNT(*) AS c FROM courses WHERE $whereSql", $params)['c'];
    $rows = qAll(
      "SELECT id, slug, name, tagline, description, icon, color, level, status,
              (SELECT COUNT(*) FROM course_enrollments WHERE course_id = courses.id AND status = 'active') as active_students,
              (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id) as lesson_count,
              (SELECT AVG(COALESCE(progress_percent, 0)) FROM course_enrollments WHERE course_id = courses.id) as avg_completion
       FROM courses WHERE $whereSql ORDER BY order_index ASC LIMIT $limit OFFSET $offset",
      $params
    );

    foreach ($rows as &$r) {
      $r['active_students'] = (int) $r['active_students'];
      $r['lesson_count'] = (int) $r['lesson_count'];
      $r['avg_completion'] = (int) ($r['avg_completion'] ?? 0);
    }

    json_out(['total' => $total, 'limit' => $limit, 'offset' => $offset, 'items' => $rows]);
  }

  // GET /api/courses/{id} — get course with lessons
  if ($action && $action !== 'enroll' && $action !== 'progress' && $method === 'GET') {
    $id = (int) $action;
    $course = qOne("SELECT * FROM courses WHERE id = ? AND status = 'published'", [$id]);
    if (!$course) err('Course not found', 404);

    $lessons = qAll(
      "SELECT id, order_index, title, description, duration_minutes, type, status
       FROM lessons WHERE course_id = ? AND status = 'published' ORDER BY order_index ASC",
      [$id]
    );

    $enrollment = qOne(
      "SELECT id, progress_percent, status, enrolled_at, completed_at FROM course_enrollments WHERE course_id = ? AND user_id = ?",
      [$id, $u['id']]
    );

    json_out([
      'course' => $course,
      'lessons' => $lessons,
      'enrollment' => $enrollment,
      'total_lessons' => count($lessons)
    ]);
  }

  // POST /api/courses/enroll — enroll in a course
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

  // POST /api/courses/{id}/complete-lesson — mark lesson as complete
  if ($action && strpos($action, '/') !== false) {
    list($courseId, $subaction) = explode('/', $action, 2);
    $courseId = (int) $courseId;

    if ($subaction === 'complete-lesson' && $method === 'POST') {
      $b = body();
      $lessonId = (int) ($b['lesson_id'] ?? 0);
      $timeSpent = (int) ($b['time_spent_minutes'] ?? 0);
      if (!$lessonId) err('Missing lesson_id', 400);

      $lesson = qOne("SELECT id, course_id FROM lessons WHERE id = ? AND course_id = ?", [$lessonId, $courseId]);
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

      // Update enrollment progress
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

      // Mark course as completed if all lessons done
      if ($completed === $total) {
        qExec(
          "UPDATE course_enrollments SET status = 'completed', completed_at = NOW() WHERE id = ?",
          [$enrollment['id']]
        );
      }

      log_activity('course.lesson_complete', 'lesson', $lessonId, ['enrollment_id' => $enrollment['id']]);
      json_out(['progress_percent' => $progress, 'course_complete' => $progress === 100]);
    }
  }

  // GET /api/courses/progress — get user's course enrollments and progress
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
      $e['progress_percent'] = (int) $e['progress_percent'];
      $e['total_lessons'] = (int) $e['total_lessons'];
      $e['completed_lessons'] = (int) $e['completed_lessons'];
    }

    json_out(['enrollments' => $enrollments]);
  }

  err('Invalid request', 400);
}
