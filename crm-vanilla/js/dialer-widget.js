/* Dialer widget — click-to-dial that logs the call to /api/calls and shows
   an outcome panel. Mountable on contact detail.
   Usage: NWMDialer.attach(contact, { containerEl }).
*/
(function (w) {
  "use strict";

  var OUTCOMES = [
    { v: 'connected',          label: 'Connected' },
    { v: 'left_voicemail',     label: 'Left voicemail' },
    { v: 'no_answer',          label: 'No answer' },
    { v: 'busy',               label: 'Busy' },
    { v: 'wrong_number',       label: 'Wrong number' },
    { v: 'follow_up',          label: 'Schedule follow-up' },
    { v: 'not_interested',     label: 'Not interested' },
  ];

  function api(method, path, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, { method: method, headers: headers, credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r); });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function ensureCss() {
    if (document.getElementById("nwm-dialer-css")) return;
    var s = document.createElement("style");
    s.id = "nwm-dialer-css";
    s.textContent = [
      ".nwm-dial-btn{display:inline-flex;align-items:center;gap:6px;background:#10b981;color:#fff;border:none;padding:7px 14px;border-radius:8px;font:700 13px Inter;cursor:pointer;text-decoration:none}",
      ".nwm-dial-btn:hover{background:#0ea674}",
      ".nwm-dial-btn:disabled{opacity:.5;cursor:not-allowed}",
      ".nwm-dial-modal{position:fixed;inset:0;background:rgba(2,8,23,.55);z-index:1000;display:flex;align-items:center;justify-content:center}",
      ".nwm-dial-card{background:#fff;border-radius:14px;padding:22px;width:420px;max-width:92vw;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:Inter}",
      ".nwm-dial-card h3{margin:0 0 4px;color:#010F3B;font:800 17px Poppins,Inter}",
      ".nwm-dial-card .num{color:#1a1a2e;font:700 22px monospace;margin:8px 0 12px;letter-spacing:1px}",
      ".nwm-dial-card .small{color:#64748b;font:500 12px Inter}",
      ".nwm-dial-card label{display:block;color:#1a1a2e;font:600 11px Inter;margin:14px 0 4px;text-transform:uppercase;letter-spacing:.4px}",
      ".nwm-dial-card select,.nwm-dial-card input,.nwm-dial-card textarea{width:100%;padding:9px 10px;border:1px solid #e3e5ee;border-radius:8px;font:400 14px Inter;box-sizing:border-box}",
      ".nwm-dial-card textarea{min-height:60px;resize:vertical;font-family:Inter}",
      ".nwm-dial-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}",
      ".nwm-dial-actions .btn{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font:700 13px Inter}",
      ".nwm-dial-actions .secondary{background:#f2f3f8;color:#1a1a2e}",
      ".nwm-dial-actions .primary{background:#FF671F;color:#fff}",
      ".nwm-dial-timer{font:700 16px Inter;color:#FF671F;text-align:center;background:#fff8eb;border:1px solid #fbbf24;padding:8px;border-radius:8px;margin:8px 0}",
    ].join("\n");
    document.head.appendChild(s);
  }

  /**
   * Replace a simple "Call" link with a smart dial button.
   * Returns the button element.
   */
  function buildButton(contact, opts) {
    ensureCss();
    var btn = document.createElement("button");
    btn.className = "nwm-dial-btn";
    btn.type = "button";
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
                   '<span>Call</span>';
    btn.disabled = !contact || !contact.phone;
    btn.addEventListener("click", function () {
      if (!contact || !contact.phone) return;
      startCall(contact, opts || {});
    });
    return btn;
  }

  function startCall(contact, opts) {
    // 1. Log the call as 'dialing' immediately
    var startedAt = Date.now();
    var callId = null;
    api("POST", "/api/calls", {
      contact_id: contact.id || null,
      to_phone:   contact.phone,
      direction:  "outbound",
      status:     "dialing",
    }).then(function (r) { callId = r.call && r.call.id; }).catch(function () {});

    // 2. Open tel: link in same window so the device's dialer takes over
    try { location.href = "tel:" + (contact.phone || '').replace(/\s+/g, ''); }
    catch (e) { /* most desktop browsers will just no-op or show a chooser */ }

    // 3. Show outcome capture modal that updates the call row when submitted
    var modal = document.createElement("div");
    modal.className = "nwm-dial-modal";
    modal.innerHTML =
      '<div class="nwm-dial-card">' +
        '<h3>Call in progress</h3>' +
        '<div class="num">' + esc(contact.phone) + '</div>' +
        '<div class="small">' + esc(contact.name || '') + (contact.company ? ' · ' + esc(contact.company) : '') + '</div>' +
        '<div class="nwm-dial-timer" data-timer>00:00</div>' +
        '<label>Outcome</label>' +
        '<select data-outcome>' + OUTCOMES.map(function (o) {
          return '<option value="' + esc(o.v) + '">' + esc(o.label) + '</option>';
        }).join("") + '</select>' +
        '<label>Notes</label>' +
        '<textarea data-notes placeholder="What did you discuss? Next steps?"></textarea>' +
        '<div class="nwm-dial-actions">' +
          '<button class="btn secondary" data-cancel>Discard log</button>' +
          '<button class="btn primary" data-save>Save Call</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var timerEl = modal.querySelector("[data-timer]");
    var ti = setInterval(function () {
      var sec = Math.floor((Date.now() - startedAt) / 1000);
      var m = Math.floor(sec / 60), s = sec % 60;
      timerEl.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }, 1000);

    function close() {
      clearInterval(ti);
      modal.remove();
    }

    modal.querySelector("[data-cancel]").addEventListener("click", function () {
      // Cancel the dial: if we have an id, mark as failed; otherwise just close
      if (callId) {
        api("PUT", "/api/calls/" + callId, { status: "failed", outcome: "discarded" }).catch(function(){});
      }
      close();
    });

    modal.querySelector("[data-save]").addEventListener("click", function () {
      var sec = Math.floor((Date.now() - startedAt) / 1000);
      var outcome = modal.querySelector("[data-outcome]").value;
      var notes = modal.querySelector("[data-notes]").value.trim();
      var status = (outcome === 'no_answer' || outcome === 'busy' || outcome === 'wrong_number') ? outcome : 'completed';
      var save = function (id) {
        return api("PUT", "/api/calls/" + id, {
          status: status, outcome: outcome, duration_sec: sec, notes: notes, ended_at: new Date().toISOString(),
        });
      };
      var p = callId
        ? save(callId)
        : api("POST", "/api/calls", {
            contact_id: contact.id || null, to_phone: contact.phone,
            direction: "outbound", status: status, outcome: outcome,
            duration_sec: sec, notes: notes,
          }).then(function (r) { return r; });
      p.then(function () {
        close();
        if (typeof opts.onLogged === 'function') opts.onLogged();
      }).catch(function () {
        alert("Could not save call log. (Make sure /api/calls is deployed.)");
      });
    });

    // Click on backdrop closes
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        // Treat as cancel
        if (callId) api("PUT", "/api/calls/" + callId, { status: "failed", outcome: "discarded" }).catch(function(){});
        close();
      }
    });
  }

  w.NWMDialer = { buildButton: buildButton, startCall: startCall };
})(window);
