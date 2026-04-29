/* Notes widget — reusable mountable threaded-notes panel.
   Backed by /api/notes (api-php/routes/notes.php).

   Usage:
     NWMNotes.mount('#myContainer', { contactId: 42 });
     NWMNotes.mount('#dealPanel',   { dealId: 17, title: 'Deal notes' });
*/
(function (w) {
  "use strict";

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
      return r.json().then(function (d) { return r.ok ? d : Promise.reject(d); });
    });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function relTime(iso) {
    if (!iso) return "";
    var d = new Date(iso.replace(" ", "T"));
    if (isNaN(d.getTime())) return iso;
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return "just now";
    if (diff < 3600)      return Math.floor(diff / 60) + "m ago";
    if (diff < 86400)     return Math.floor(diff / 3600) + "h ago";
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function ensureCss() {
    if (document.getElementById("nwm-notes-css")) return;
    var s = document.createElement("style");
    s.id = "nwm-notes-css";
    s.textContent = [
      ".nwm-notes{font:500 13px Inter,system-ui,sans-serif;color:#1a1a2e}",
      ".nwm-notes-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}",
      ".nwm-notes-head h4{margin:0;font:700 14px Inter;color:#010F3B;letter-spacing:.3px}",
      ".nwm-notes-form{margin-bottom:10px}",
      ".nwm-notes-form textarea{width:100%;min-height:54px;padding:8px 10px;border:1px solid #e3e5ee;border-radius:8px;font:500 13px Inter;resize:vertical;box-sizing:border-box}",
      ".nwm-notes-form textarea:focus{outline:none;border-color:#FF671F}",
      ".nwm-notes-form .actions{display:flex;justify-content:space-between;align-items:center;margin-top:6px}",
      ".nwm-notes-form .actions label{display:flex;gap:5px;align-items:center;color:#64748b;font-size:12px;cursor:pointer}",
      ".nwm-notes-form .submit{background:#FF671F;color:#fff;border:none;padding:6px 14px;border-radius:6px;font:600 12px Inter;cursor:pointer}",
      ".nwm-notes-form .submit:disabled{opacity:.5;cursor:not-allowed}",
      ".nwm-note{background:#fff;border:1px solid #e3e5ee;border-radius:8px;padding:10px 12px;margin-bottom:6px;line-height:1.45}",
      ".nwm-note.pinned{background:#fff8eb;border-color:#fbbf24}",
      ".nwm-note .note-meta{display:flex;justify-content:space-between;color:#64748b;font:600 11px Inter;text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px}",
      ".nwm-note .note-author{color:#010F3B}",
      ".nwm-note .note-actions button{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:11px;margin-left:8px;padding:0}",
      ".nwm-note .note-actions button:hover{color:#FF671F}",
      ".nwm-note .note-body{white-space:pre-wrap;color:#1a1a2e;font-size:13px}",
      ".nwm-notes-empty{color:#94a3b8;text-align:center;padding:14px 8px;font-size:12px}",
      ".nwm-notes-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px;border-radius:8px;font-size:12px}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function mount(containerSelector, opts) {
    ensureCss();
    var el = typeof containerSelector === "string"
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!el) return null;
    opts = opts || {};

    el.classList.add("nwm-notes");
    el.innerHTML =
      '<div class="nwm-notes-head"><h4>' + (opts.title || "Notes") + '</h4></div>' +
      '<div class="nwm-notes-form">' +
        '<textarea data-note-input placeholder="Add a note (Cmd/Ctrl+Enter to save)…"></textarea>' +
        '<div class="actions">' +
          '<label><input type="checkbox" data-note-pin> Pin to top</label>' +
          '<button class="submit" data-note-submit disabled>Add Note</button>' +
        '</div>' +
      '</div>' +
      '<div data-note-list><div class="nwm-notes-empty">Loading notes…</div></div>';

    var listEl  = el.querySelector("[data-note-list]");
    var input   = el.querySelector("[data-note-input]");
    var pinBox  = el.querySelector("[data-note-pin]");
    var submit  = el.querySelector("[data-note-submit]");

    function buildQS() {
      var p = [];
      if (opts.contactId) p.push("contact_id=" + encodeURIComponent(opts.contactId));
      if (opts.dealId)    p.push("deal_id="    + encodeURIComponent(opts.dealId));
      if (opts.taskId)    p.push("task_id="    + encodeURIComponent(opts.taskId));
      return "?" + p.join("&");
    }

    function load() {
      api("GET", "/api/notes" + buildQS()).then(function (r) {
        var notes = r.notes || [];
        if (!notes.length) {
          listEl.innerHTML = '<div class="nwm-notes-empty">No notes yet. Add the first one above.</div>';
          return;
        }
        listEl.innerHTML = notes.map(noteHtml).join("");
      }).catch(function (e) {
        listEl.innerHTML = '<div class="nwm-notes-error">Could not load notes.<br><small>' +
                           esc((e && e.error) || "API error") + '</small></div>';
      });
    }

    function noteHtml(n) {
      return '<div class="nwm-note' + (n.pinned ? ' pinned' : '') + '" data-id="' + n.id + '">' +
               '<div class="note-meta">' +
                 '<span class="note-author">' + esc(n.author_name || 'unknown') + ' · ' + esc(relTime(n.created_at)) + (n.pinned ? ' · 📌 pinned' : '') + '</span>' +
                 '<span class="note-actions">' +
                   '<button data-toggle-pin>' + (n.pinned ? 'unpin' : 'pin') + '</button>' +
                   '<button data-delete>delete</button>' +
                 '</span>' +
               '</div>' +
               '<div class="note-body">' + esc(n.body) + '</div>' +
             '</div>';
    }

    input.addEventListener("input", function () {
      submit.disabled = !input.value.trim();
    });
    input.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && input.value.trim()) {
        submit.click();
      }
    });

    submit.addEventListener("click", function () {
      var body = input.value.trim();
      if (!body) return;
      submit.disabled = true; submit.textContent = "Saving…";
      var payload = {
        body: body,
        pinned: pinBox.checked ? 1 : 0,
      };
      if (opts.contactId) payload.contact_id = opts.contactId;
      if (opts.dealId)    payload.deal_id    = opts.dealId;
      if (opts.taskId)    payload.task_id    = opts.taskId;
      api("POST", "/api/notes", payload).then(function () {
        input.value = ""; pinBox.checked = false;
        submit.textContent = "Add Note";
        load();
      }).catch(function (e) {
        submit.disabled = false; submit.textContent = "Add Note";
        alert("Failed: " + ((e && e.error) || "API error"));
      });
    });

    listEl.addEventListener("click", function (e) {
      var noteEl = e.target.closest(".nwm-note");
      if (!noteEl) return;
      var id = parseInt(noteEl.getAttribute("data-id"), 10);
      if (e.target.matches("[data-delete]")) {
        if (!confirm("Delete this note?")) return;
        api("DELETE", "/api/notes/" + id).then(load).catch(function (e) {
          alert((e && e.error) || "Could not delete");
        });
      } else if (e.target.matches("[data-toggle-pin]")) {
        var isPinned = noteEl.classList.contains("pinned");
        api("PUT", "/api/notes/" + id, { pinned: isPinned ? 0 : 1 }).then(load).catch(function (e) {
          alert((e && e.error) || "Could not update");
        });
      }
    });

    load();
    return { reload: load, element: el };
  }

  w.NWMNotes = { mount: mount };
})(window);
