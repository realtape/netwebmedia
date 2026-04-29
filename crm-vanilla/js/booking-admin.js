/* Booking admin — manage links, weekly availability, and upcoming bookings.
   Backed by /api/booking/admin/* (api-php/routes/booking.php).
*/
(function () {
  "use strict";

  var API = "/api/booking/admin";
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  var state = {
    links: [],
    availability: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    bookings: [],
  };

  /* ── shared fetch ── */
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
          var e = new Error((data && data.error) || ("HTTP " + r.status));
          e.status = r.status; throw e;
        }
        return data;
      });
    });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function toast(msg, isError) {
    var el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  /* ── tabs ── */
  function bindTabs() {
    var tabs = document.querySelectorAll(".booking-tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        document.querySelectorAll(".booking-panel").forEach(function (p) { p.classList.remove("active"); });
        var key = t.getAttribute("data-bktab");
        document.getElementById("bk-" + key).classList.add("active");
        if (key === "availability" && !state.availLoaded) loadAvailability();
        if (key === "bookings" && !state.bookingsLoaded) loadBookings();
      });
    });
  }

  /* ── LINKS ── */
  function loadLinks() {
    return api("GET", API + "/links").then(function (r) {
      state.links = r.links || [];
      renderLinks();
    }).catch(function (e) {
      var l = document.getElementById("linksList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load booking links: ' + esc(e.message) +
        '<br><small>Make sure /api/booking/admin/links is deployed and you are signed in.</small></div>';
    });
  }

  function renderLinks() {
    var l = document.getElementById("linksList");
    if (!state.links.length) {
      l.innerHTML = '<div class="empty-state">No booking links yet.<br>Click <strong>+ New Link</strong> to create your first sharable link.</div>';
      return;
    }
    var origin = location.origin;
    l.innerHTML = state.links.map(function (link) {
      var url = origin + "/book.html?slug=" + encodeURIComponent(link.slug);
      return '<div class="link-card' + (link.is_active ? '' : ' disabled') + '">' +
               '<div class="info">' +
                 '<h4>' + esc(link.title) + (link.is_active ? '' : ' <span style="font-size:10px;background:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:4px;font-weight:600">PAUSED</span>') + '</h4>' +
                 (link.description ? '<div class="desc">' + esc(link.description) + '</div>' : '') +
                 '<a href="' + esc(url) + '" target="_blank" class="url">' + esc(url) + '</a>' +
                 '<div class="meta">' +
                   '<span>⏱ ' + link.duration_min + ' min</span>' +
                   '<span>📡 ' + esc((link.meeting_type || 'video').replace('_',' ')) + '</span>' +
                   (link.buffer_min ? '<span>buffer: ' + link.buffer_min + 'm</span>' : '') +
                 '</div>' +
               '</div>' +
               '<div class="actions">' +
                 '<button class="btn btn-secondary" data-action="copy" data-url="' + esc(url) + '">Copy</button>' +
                 '<button class="btn btn-secondary" data-action="edit" data-id="' + link.id + '">Edit</button>' +
               '</div>' +
             '</div>';
    }).join("");
  }

  function openLinkModal(link) {
    var isNew = !link;
    document.getElementById("linkModalTitle").textContent = isNew ? "New Booking Link" : "Edit Booking Link";
    document.getElementById("linkId").value          = link ? link.id : "";
    document.getElementById("linkTitle").value       = link ? (link.title || "") : "";
    document.getElementById("linkSlug").value        = link ? (link.slug || "") : "";
    document.getElementById("linkDescription").value = link ? (link.description || "") : "";
    document.getElementById("linkDuration").value    = link ? (link.duration_min || 30) : 30;
    document.getElementById("linkBuffer").value      = link ? (link.buffer_min || 0)    : 0;
    document.getElementById("linkAdvanceMin").value  = link ? (link.advance_min_hours || 4) : 4;
    document.getElementById("linkAdvanceMax").value  = link ? (link.advance_max_days || 30) : 30;
    document.getElementById("linkMeetingType").value = link ? (link.meeting_type || "video") : "video";
    document.getElementById("linkIsActive").value    = link ? String(link.is_active ?? 1) : "1";
    document.getElementById("linkLocation").value    = link ? (link.meeting_location || "") : "";
    document.getElementById("linkDelete").style.display = isNew ? "none" : "inline-flex";
    document.getElementById("linkModal").classList.add("open");
  }
  function closeLinkModal() { document.getElementById("linkModal").classList.remove("open"); }

  function readLinkForm() {
    return {
      title:             document.getElementById("linkTitle").value.trim(),
      slug:              document.getElementById("linkSlug").value.trim(),
      description:       document.getElementById("linkDescription").value.trim(),
      duration_min:      parseInt(document.getElementById("linkDuration").value, 10) || 30,
      buffer_min:        parseInt(document.getElementById("linkBuffer").value, 10) || 0,
      advance_min_hours: parseInt(document.getElementById("linkAdvanceMin").value, 10) || 0,
      advance_max_days:  parseInt(document.getElementById("linkAdvanceMax").value, 10) || 30,
      meeting_type:      document.getElementById("linkMeetingType").value,
      is_active:         parseInt(document.getElementById("linkIsActive").value, 10),
      meeting_location:  document.getElementById("linkLocation").value.trim(),
    };
  }

  function saveLink() {
    var id = document.getElementById("linkId").value;
    var data = readLinkForm();
    if (!data.title) { toast("Title is required.", true); return; }
    if (!data.slug) delete data.slug; // let server generate

    var p = id
      ? api("PUT",  API + "/links/" + id, data)
      : api("POST", API + "/links",       data);

    p.then(function () { toast(id ? "Link updated." : "Link created."); closeLinkModal(); return loadLinks(); })
     .catch(function (e) { toast("Save failed: " + e.message, true); });
  }

  function deleteLink() {
    var id = document.getElementById("linkId").value;
    if (!id) return;
    if (!confirm("Delete this booking link? Existing bookings will remain but the public URL will stop working.")) return;
    api("DELETE", API + "/links/" + id)
      .then(function () { toast("Deleted."); closeLinkModal(); return loadLinks(); })
      .catch(function (e) { toast("Delete failed: " + e.message, true); });
  }

  /* ── AVAILABILITY ── */
  function loadAvailability() {
    return api("GET", API + "/availability").then(function (r) {
      state.availability = r.availability || { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
      // Default Mon–Fri 9–5 if nothing set yet
      var anySet = false;
      for (var d = 0; d < 7; d++) if ((state.availability[d] || []).length) { anySet = true; break; }
      if (!anySet) {
        state.availability = { 0:[], 1:[{start:"09:00",end:"17:00"}], 2:[{start:"09:00",end:"17:00"}],
                               3:[{start:"09:00",end:"17:00"}], 4:[{start:"09:00",end:"17:00"}],
                               5:[{start:"09:00",end:"17:00"}], 6:[] };
      }
      state.availLoaded = true;
      renderAvailability();
    }).catch(function (e) {
      var grid = document.getElementById("availGrid");
      if (grid) grid.innerHTML = '<div class="empty-state">Could not load availability: ' + esc(e.message) + '</div>';
    });
  }

  function renderAvailability() {
    var grid = document.getElementById("availGrid");
    if (!grid) return;
    grid.innerHTML = DAYS.map(function (name, dow) {
      var windows = state.availability[dow] || [];
      var winHtml = windows.map(function (w, i) {
        return '<div class="avail-window" data-dow="' + dow + '" data-i="' + i + '">' +
                 '<input type="time" value="' + esc(w.start) + '" data-edit="start">' +
                 '<span>–</span>' +
                 '<input type="time" value="' + esc(w.end) + '" data-edit="end">' +
                 '<button type="button" data-rm="' + dow + ',' + i + '" title="Remove">✕</button>' +
               '</div>';
      }).join("");
      if (!windows.length) winHtml = '<span style="color:#94a3b8;font:500 13px Inter">Unavailable</span>';
      return '<div class="avail-day">' +
               '<div class="avail-day-head">' +
                 '<span class="avail-day-name">' + esc(name) + '</span>' +
                 '<button type="button" class="avail-add" data-add="' + dow + '">+ Add window</button>' +
               '</div>' +
               '<div class="avail-windows">' + winHtml + '</div>' +
             '</div>';
    }).join("");

    grid.querySelectorAll("[data-add]").forEach(function (b) {
      b.addEventListener("click", function () {
        var dow = parseInt(b.getAttribute("data-add"), 10);
        state.availability[dow] = state.availability[dow] || [];
        state.availability[dow].push({ start: "09:00", end: "17:00" });
        renderAvailability();
      });
    });
    grid.querySelectorAll("[data-rm]").forEach(function (b) {
      b.addEventListener("click", function () {
        var parts = b.getAttribute("data-rm").split(",");
        var dow = parseInt(parts[0], 10), i = parseInt(parts[1], 10);
        state.availability[dow].splice(i, 1);
        renderAvailability();
      });
    });
    grid.querySelectorAll(".avail-window").forEach(function (w) {
      w.addEventListener("change", function () {
        var dow = parseInt(w.getAttribute("data-dow"), 10);
        var i   = parseInt(w.getAttribute("data-i"), 10);
        var startEl = w.querySelector('[data-edit="start"]');
        var endEl   = w.querySelector('[data-edit="end"]');
        state.availability[dow][i] = { start: startEl.value, end: endEl.value };
      });
    });
  }

  function saveAvailability() {
    api("PUT", API + "/availability", { availability: state.availability })
      .then(function () { toast("Schedule saved."); })
      .catch(function (e) { toast("Save failed: " + e.message, true); });
  }

  /* ── BOOKINGS ── */
  function loadBookings() {
    var status = document.getElementById("bookingStatusFilter").value;
    var url = API + "/bookings?limit=200";
    if (status) url += "&status=" + encodeURIComponent(status);
    return api("GET", url).then(function (r) {
      state.bookings = r.bookings || [];
      state.bookingsLoaded = true;
      renderBookings();
    }).catch(function (e) {
      var l = document.getElementById("bookingsList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load bookings: ' + esc(e.message) + '</div>';
    });
  }

  function renderBookings() {
    var l = document.getElementById("bookingsList");
    if (!state.bookings.length) {
      l.innerHTML = '<div class="empty-state">No bookings yet.</div>';
      return;
    }
    l.innerHTML = state.bookings.map(function (b) {
      var d = new Date(b.starts_at.replace(" ", "T"));
      var when = d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      var cancelBtn = b.status === "confirmed"
        ? '<button class="btn btn-secondary" data-cancel="' + b.id + '">Cancel</button>'
        : '';
      return '<div class="booking-row ' + (b.status === "cancelled" ? "cancelled" : "") + '">' +
               '<div class="when">' + esc(when) + '<br><span style="color:#64748b;font-weight:500;font-size:12px">' + esc(b.link_title || '') + '</span></div>' +
               '<div class="guest">' +
                 '<strong>' + esc(b.guest_name) + '</strong><br>' +
                 '<span class="small">' + esc(b.guest_email) + (b.guest_phone ? ' · ' + esc(b.guest_phone) : '') + '</span>' +
                 (b.notes ? '<div class="small" style="margin-top:4px">' + esc(b.notes) + '</div>' : '') +
               '</div>' +
               '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
                 '<span class="badge ' + esc(b.status) + '">' + esc(b.status) + '</span>' +
                 cancelBtn +
               '</div>' +
             '</div>';
    }).join("");

    l.querySelectorAll("[data-cancel]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-cancel");
        if (!confirm("Cancel this booking? The guest will not be notified automatically.")) return;
        api("POST", API + "/bookings/" + id + "/cancel")
          .then(function () { toast("Cancelled."); return loadBookings(); })
          .catch(function (e) { toast("Cancel failed: " + e.message, true); });
      });
    });
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader("Booking", '');
    }

    bindTabs();
    document.getElementById("newLinkBtn").addEventListener("click", function () { openLinkModal(null); });
    document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
    document.getElementById("reloadBookings").addEventListener("click", loadBookings);
    document.getElementById("bookingStatusFilter").addEventListener("change", loadBookings);

    document.getElementById("linkCancel").addEventListener("click", closeLinkModal);
    document.getElementById("linkSave").addEventListener("click", saveLink);
    document.getElementById("linkDelete").addEventListener("click", deleteLink);
    document.getElementById("linkModal").addEventListener("click", function (e) {
      if (e.target.id === "linkModal") closeLinkModal();
    });

    document.getElementById("linksList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]"); if (!btn) return;
      var action = btn.getAttribute("data-action");
      if (action === "copy") {
        var url = btn.getAttribute("data-url");
        navigator.clipboard.writeText(url).then(function () { toast("Link copied."); }, function () {
          window.prompt("Copy this URL:", url);
        });
      } else if (action === "edit") {
        var id = parseInt(btn.getAttribute("data-id"), 10);
        var link = state.links.find(function (l) { return l.id === id; });
        if (link) openLinkModal(link);
      }
    });

    loadLinks();
  });
})();
