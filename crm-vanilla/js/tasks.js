/* Tasks page — sales rep to-dos linked to contacts/deals
   Backed by /api/tasks (api-php/routes/tasks.php).
*/
(function () {
  "use strict";

  var API = "/api/tasks";
  var state = {
    tasks: [],
    filter: { due: "", status: "", q: "" },
    contactId: null,
    dealId: null,
  };

  /* ── shared fetch wrapper with X-Auth-Token ── */
  function api(method, path, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, {
      method: method,
      headers: headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      var ct = r.headers.get("content-type") || "";
      var p = ct.indexOf("application/json") !== -1 ? r.json() : r.text();
      return p.then(function (data) {
        if (!r.ok) {
          var msg = (data && data.error) || ("HTTP " + r.status);
          var e = new Error(msg);
          e.status = r.status;
          e.data = data;
          throw e;
        }
        return data;
      });
    });
  }

  /* ── escape ── */
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }

  /* ── date helpers ── */
  function fmtDue(s) {
    if (!s) return "";
    var d = new Date(s.replace(" ", "T"));
    if (isNaN(d.getTime())) return s;
    var now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    var tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    var sameTomorrow = d.toDateString() === tomorrow.toDateString();
    var time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (sameDay) return "Today " + time;
    if (sameTomorrow) return "Tomorrow " + time;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
  }

  /* ── stats ── */
  function loadStats() {
    return api("GET", API + "/stats").then(function (s) {
      var el = document.getElementById("taskStats");
      if (!el) return;
      var by = s.by_status || {};
      el.innerHTML =
        card("Open",        (by.open || 0) + (by.in_progress || 0)) +
        card("Done",        by.done || 0) +
        card("Due Today",   s.due_today || 0, s.due_today > 0) +
        card("Overdue",     s.overdue   || 0, s.overdue   > 0) +
        card("Mine Open",   s.mine_open || 0);
    }).catch(function () { /* silent — page still works */ });
  }
  function card(label, value, alert) {
    return '<div class="stat-card' + (alert ? " alert" : "") + '">' +
           '<div class="label">' + esc(label) + '</div>' +
           '<div class="value">' + esc(String(value)) + '</div></div>';
  }

  /* ── list ── */
  function loadList() {
    var qs = [];
    if (state.filter.due)    qs.push("due="    + encodeURIComponent(state.filter.due));
    if (state.filter.status) qs.push("status=" + encodeURIComponent(state.filter.status));
    if (state.filter.q)      qs.push("q="      + encodeURIComponent(state.filter.q));
    if (state.contactId)     qs.push("contact_id=" + state.contactId);
    if (state.dealId)        qs.push("deal_id="    + state.dealId);
    qs.push("limit=200");

    var url = API + "?" + qs.join("&");
    return api("GET", url).then(function (r) {
      state.tasks = r.tasks || [];
      render();
    }).catch(function (e) {
      var list = document.getElementById("taskList");
      if (list) {
        list.innerHTML = '<div class="empty-state">Could not load tasks: ' + esc(e.message) +
                         '<br><small>Make sure the /api/tasks endpoint is deployed and you are signed in.</small></div>';
      }
    });
  }

  function render() {
    var list = document.getElementById("taskList");
    if (!list) return;
    if (!state.tasks.length) {
      list.innerHTML = '<div class="empty-state">No tasks match the current filter.<br>Click <strong>+ New Task</strong> to create one.</div>';
      return;
    }
    var html = state.tasks.map(rowHtml).join("");
    list.innerHTML = html;
  }

  function rowHtml(t) {
    var done = t.status === "done";
    var typeLbl = (t.task_type || "todo").replace("_", " ");
    var prio = t.priority || "normal";
    var dueText = fmtDue(t.due_at);
    var ctxParts = [];
    if (t.contact_id) ctxParts.push('Contact #' + t.contact_id);
    if (t.deal_id)    ctxParts.push('Deal #' + t.deal_id);
    var ctx = ctxParts.length ? '<span class="badge type">' + ctxParts.join(' · ') + '</span>' : "";

    return '' +
      '<div class="task-row' + (done ? ' done' : '') + '" data-id="' + t.id + '">' +
        '<div class="task-check' + (done ? ' checked' : '') + '" data-action="toggle" data-id="' + t.id + '" title="Toggle complete">' +
          (done ? '✓' : '') +
        '</div>' +
        '<div class="task-body">' +
          '<div class="title">' + esc(t.title) + '</div>' +
          (t.description ? '<div style="color:#64677a;font-size:13px;margin-top:3px;">' + esc(t.description) + '</div>' : '') +
          '<div class="meta">' +
            '<span class="badge type">' + esc(typeLbl) + '</span>' +
            '<span class="badge priority-' + esc(prio) + '">' + esc(prio) + '</span>' +
            (t.overdue ? '<span class="badge overdue">overdue</span>' : '') +
            (dueText ? '<span>📅 ' + esc(dueText) + '</span>' : '') +
            ctx +
          '</div>' +
        '</div>' +
        '<div class="task-actions">' +
          '<button class="btn btn-secondary" data-action="edit" data-id="' + t.id + '">Edit</button>' +
        '</div>' +
      '</div>';
  }

  /* ── modal ── */
  function openModal(task) {
    var modal = document.getElementById("taskModal");
    var isNew = !task;
    document.getElementById("modalTitle").textContent = isNew ? "New Task" : "Edit Task";
    document.getElementById("taskId").value = task ? task.id : "";
    document.getElementById("taskTitle").value = task ? (task.title || "") : "";
    document.getElementById("taskDescription").value = task ? (task.description || "") : "";
    document.getElementById("taskType").value = task ? (task.task_type || "todo") : "todo";
    document.getElementById("taskPriority").value = task ? (task.priority || "normal") : "normal";
    document.getElementById("taskStatus").value = task ? (task.status || "open") : "open";
    document.getElementById("taskDue").value = task && task.due_at ? task.due_at.replace(" ", "T").slice(0,16) : "";
    document.getElementById("taskContactId").value = task && task.contact_id ? task.contact_id : (state.contactId || "");
    document.getElementById("taskDealId").value    = task && task.deal_id    ? task.deal_id    : (state.dealId    || "");
    document.getElementById("taskDelete").style.display = isNew ? "none" : "inline-flex";
    modal.classList.add("open");
  }
  function closeModal() {
    document.getElementById("taskModal").classList.remove("open");
  }

  function readModal() {
    return {
      id:           document.getElementById("taskId").value,
      title:        document.getElementById("taskTitle").value.trim(),
      description:  document.getElementById("taskDescription").value.trim(),
      task_type:    document.getElementById("taskType").value,
      priority:     document.getElementById("taskPriority").value,
      status:       document.getElementById("taskStatus").value,
      due_at:       document.getElementById("taskDue").value || null,
      contact_id:   document.getElementById("taskContactId").value || null,
      deal_id:      document.getElementById("taskDealId").value || null,
    };
  }

  function saveTask() {
    var data = readModal();
    if (!data.title) { alert("Title is required."); return; }

    var payload = {
      title: data.title,
      description: data.description,
      task_type: data.task_type,
      priority: data.priority,
      status: data.status,
      due_at: data.due_at,
    };
    if (data.contact_id) payload.contact_id = parseInt(data.contact_id, 10);
    if (data.deal_id)    payload.deal_id    = parseInt(data.deal_id, 10);

    var promise = data.id
      ? api("PUT",  API + "/" + data.id, payload)
      : api("POST", API,                 payload);

    promise.then(function () {
      closeModal();
      return Promise.all([loadList(), loadStats()]);
    }).catch(function (e) {
      alert("Save failed: " + e.message);
    });
  }

  function deleteTask() {
    var id = document.getElementById("taskId").value;
    if (!id) return;
    if (!confirm("Delete this task?")) return;
    api("DELETE", API + "/" + id).then(function () {
      closeModal();
      return Promise.all([loadList(), loadStats()]);
    }).catch(function (e) { alert("Delete failed: " + e.message); });
  }

  function toggleComplete(id) {
    var task = state.tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    var path = task.status === "done" ? "/reopen" : "/complete";
    api("POST", API + "/" + id + path).then(function () {
      return Promise.all([loadList(), loadStats()]);
    }).catch(function (e) { alert(e.message); });
  }

  /* ── filter handlers ── */
  function bindFilters() {
    var due = document.getElementById("dueFilter");
    var st  = document.getElementById("statusFilter");
    if (due) {
      due.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-due]"); if (!b) return;
        Array.prototype.forEach.call(due.querySelectorAll("button"), function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        state.filter.due = b.getAttribute("data-due");
        loadList();
      });
    }
    if (st) {
      st.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-status]"); if (!b) return;
        Array.prototype.forEach.call(st.querySelectorAll("button"), function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        state.filter.status = b.getAttribute("data-status");
        loadList();
      });
    }
    var search = document.getElementById("taskSearch");
    if (search) {
      var t;
      search.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { state.filter.q = search.value.trim(); loadList(); }, 250);
      });
    }
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      var icons = (window.CRM_ICONS || {});
      CRM_APP.buildHeader("Tasks", '');
    }

    // Read ?contact_id= or ?deal_id= from URL to scope the page.
    var u = new URL(location.href);
    state.contactId = u.searchParams.get("contact_id");
    state.dealId    = u.searchParams.get("deal_id");

    bindFilters();

    document.getElementById("newTaskBtn").addEventListener("click", function () { openModal(null); });
    document.getElementById("taskCancel").addEventListener("click", closeModal);
    document.getElementById("taskSave").addEventListener("click", saveTask);
    document.getElementById("taskDelete").addEventListener("click", deleteTask);
    document.getElementById("taskModal").addEventListener("click", function (e) {
      if (e.target.id === "taskModal") closeModal();
    });

    document.getElementById("taskList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var id = parseInt(btn.getAttribute("data-id"), 10);
      var action = btn.getAttribute("data-action");
      if (action === "toggle") toggleComplete(id);
      else if (action === "edit") {
        var task = state.tasks.find(function (t) { return t.id === id; });
        if (task) openModal(task);
      }
    });

    loadStats();
    loadList();
  });

  // Expose for embedding/testing
  window.NWM_Tasks = { reload: function(){ return Promise.all([loadStats(), loadList()]); } };
})();
