/* Notifications bell — auto-injects into the .page-header on every CRM page.
   Polls /api/notifications/count every 60s and shows a dropdown of recent items.
   Also handles browser push subscription (best-effort, gracefully degrades).
*/
(function () {
  "use strict";

  var POLL_INTERVAL_MS = 60000;
  var pollTimer = null;
  var dropdownEl = null;

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

  function relTime(iso) {
    if (!iso) return "";
    var d = new Date(iso.replace(" ", "T"));
    if (isNaN(d.getTime())) return iso;
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return "just now";
    if (diff < 3600)      return Math.floor(diff / 60) + "m";
    if (diff < 86400)     return Math.floor(diff / 3600) + "h";
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d";
    return d.toLocaleDateString();
  }

  function ensureCss() {
    if (document.getElementById("nwm-notif-css")) return;
    var s = document.createElement("style");
    s.id = "nwm-notif-css";
    s.textContent = [
      ".nwm-bell{position:relative;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#fff;border:1px solid #e3e5ee;cursor:pointer;color:#1a1a2e;margin-right:6px}",
      ".nwm-bell:hover{border-color:#FF671F;color:#FF671F}",
      ".nwm-bell .badge{position:absolute;top:-4px;right:-4px;background:#FF671F;color:#fff;font:700 10px Inter;min-width:16px;height:16px;border-radius:8px;padding:0 4px;display:flex;align-items:center;justify-content:center;border:2px solid #fff}",
      ".nwm-notif-dropdown{position:absolute;top:46px;right:0;background:#fff;border:1px solid #e3e5ee;border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.18);width:340px;max-width:calc(100vw - 24px);max-height:480px;overflow:hidden;display:flex;flex-direction:column;z-index:999;font:500 13px Inter}",
      ".nwm-notif-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #f0f1f5}",
      ".nwm-notif-head h4{margin:0;font:700 14px Inter;color:#010F3B}",
      ".nwm-notif-head button{background:none;border:none;color:#FF671F;font:600 11px Inter;cursor:pointer;text-transform:uppercase;letter-spacing:.4px}",
      ".nwm-notif-list{flex:1;overflow-y:auto;padding:4px}",
      ".nwm-notif-item{padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;gap:10px;align-items:flex-start}",
      ".nwm-notif-item:hover{background:#f8fafc}",
      ".nwm-notif-item.unread{background:#fff8eb}",
      ".nwm-notif-item .dot{flex:0 0 8px;height:8px;margin-top:6px;background:#FF671F;border-radius:50%;visibility:hidden}",
      ".nwm-notif-item.unread .dot{visibility:visible}",
      ".nwm-notif-item .title{font:600 13px Inter;color:#010F3B;line-height:1.3}",
      ".nwm-notif-item .body{color:#64748b;font:500 12px Inter;line-height:1.4;margin-top:2px}",
      ".nwm-notif-item .when{color:#94a3b8;font:600 11px Inter;text-transform:uppercase;letter-spacing:.3px;flex-shrink:0;margin-left:auto}",
      ".nwm-notif-empty{color:#94a3b8;text-align:center;padding:30px;font:500 13px Inter}",
      ".nwm-notif-foot{padding:10px;border-top:1px solid #f0f1f5;display:flex;gap:6px}",
      ".nwm-notif-foot button{flex:1;background:#f2f3f8;border:1px solid #e3e5ee;border-radius:6px;color:#1a1a2e;font:600 11px Inter;cursor:pointer;padding:6px}",
      ".nwm-notif-foot button:hover{background:#FF671F;color:#fff;border-color:#FF671F}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function injectBell() {
    var header = document.querySelector(".page-header");
    if (!header) return;
    if (document.getElementById("nwm-bell")) return;

    var rightSlot = header.querySelector(".header-actions") || header.querySelector(".page-header-right") || header;
    var bell = document.createElement("button");
    bell.id = "nwm-bell";
    bell.className = "nwm-bell";
    bell.title = "Notifications";
    bell.innerHTML = (window.CRM_ICONS && window.CRM_ICONS.bell)
      ? window.CRM_ICONS.bell
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    bell.innerHTML += '<span class="badge" id="nwm-bell-badge" style="display:none">0</span>';

    bell.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleDropdown();
    });
    document.addEventListener("click", function (e) {
      if (dropdownEl && !dropdownEl.contains(e.target) && e.target !== bell) closeDropdown();
    });

    // Try to insert at end of header content
    if (rightSlot.firstChild && rightSlot !== header) {
      rightSlot.insertBefore(bell, rightSlot.firstChild);
    } else {
      header.appendChild(bell);
    }
    bell.style.position = "relative";
  }

  function toggleDropdown() {
    if (dropdownEl) { closeDropdown(); return; }
    openDropdown();
  }

  function openDropdown() {
    var bell = document.getElementById("nwm-bell"); if (!bell) return;
    dropdownEl = document.createElement("div");
    dropdownEl.className = "nwm-notif-dropdown";
    dropdownEl.innerHTML =
      '<div class="nwm-notif-head"><h4>Notifications</h4><button data-mark-all>Mark all read</button></div>' +
      '<div class="nwm-notif-list"><div class="nwm-notif-empty">Loading…</div></div>' +
      '<div class="nwm-notif-foot"><button data-test-push>Test push</button><button data-enable-push>Enable browser notifications</button></div>';
    bell.appendChild(dropdownEl);

    dropdownEl.querySelector("[data-mark-all]").addEventListener("click", function () {
      api("POST", "/api/notifications/mark-all-read").then(function () { refresh(); });
    });
    dropdownEl.querySelector("[data-test-push]").addEventListener("click", function () {
      api("POST", "/api/notifications/push/test", { title: "Test", body: "Hello from NetWebMedia CRM" }).then(refresh);
    });
    dropdownEl.querySelector("[data-enable-push]").addEventListener("click", subscribeToPush);

    loadList();
  }

  function closeDropdown() {
    if (dropdownEl && dropdownEl.parentNode) dropdownEl.parentNode.removeChild(dropdownEl);
    dropdownEl = null;
  }

  function loadList() {
    if (!dropdownEl) return;
    api("GET", "/api/notifications?limit=20").then(function (r) {
      if (!dropdownEl) return;
      var listEl = dropdownEl.querySelector(".nwm-notif-list");
      var rows = r.notifications || [];
      if (!rows.length) {
        listEl.innerHTML = '<div class="nwm-notif-empty">No notifications.</div>';
        return;
      }
      listEl.innerHTML = rows.map(function (n) {
        return '<div class="nwm-notif-item ' + (n.is_read ? '' : 'unread') + '" data-id="' + n.id + '" data-link="' + esc(n.link || '') + '">' +
                 '<span class="dot"></span>' +
                 '<div style="flex:1;min-width:0">' +
                   '<div class="title">' + esc(n.title) + '</div>' +
                   (n.body ? '<div class="body">' + esc(n.body) + '</div>' : '') +
                 '</div>' +
                 '<span class="when">' + esc(relTime(n.created_at)) + '</span>' +
               '</div>';
      }).join("");
      listEl.querySelectorAll(".nwm-notif-item").forEach(function (it) {
        it.addEventListener("click", function () {
          var id = it.getAttribute("data-id");
          var link = it.getAttribute("data-link");
          api("POST", "/api/notifications/" + id + "/read").then(refresh);
          if (link) location.href = link;
        });
      });
    }).catch(function () {
      if (!dropdownEl) return;
      dropdownEl.querySelector(".nwm-notif-list").innerHTML = '<div class="nwm-notif-empty">Could not load.</div>';
    });
  }

  function refreshCount() {
    api("GET", "/api/notifications/count").then(function (r) {
      var b = document.getElementById("nwm-bell-badge");
      if (!b) return;
      if (r.unread > 0) {
        b.textContent = r.unread > 99 ? "99+" : r.unread;
        b.style.display = "flex";
      } else {
        b.style.display = "none";
      }
    }).catch(function () {});
  }

  function refresh() {
    refreshCount();
    if (dropdownEl) loadList();
  }

  /* ── push subscription ── */
  function urlBase64ToUint8Array(b64) {
    var padding = '='.repeat((4 - b64.length % 4) % 4);
    var s = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(s);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Browser push isn't supported here. In-app notifications still work.");
      return;
    }
    api("GET", "/api/notifications/push/key").then(function (k) {
      if (!k.public_key) {
        alert("Browser push not yet configured by this server. Notifications will appear in the bell only.\n(Server admin: set vapid_public_key + dispatcher.)");
        return;
      }
      navigator.serviceWorker.register("/crm-vanilla/sw.js").catch(function () {
        return navigator.serviceWorker.register("/sw.js");
      }).then(function (reg) {
        return Notification.requestPermission().then(function (perm) {
          if (perm !== "granted") throw new Error("Permission denied");
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(k.public_key),
          });
        });
      }).then(function (sub) {
        return api("POST", "/api/notifications/push/subscribe", { subscription: sub.toJSON() });
      }).then(function () {
        alert("Browser notifications enabled.");
      }).catch(function (e) {
        alert("Could not enable: " + (e.message || "unknown"));
      });
    });
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    ensureCss();
    // Wait one tick to let CRM_APP build the header first
    setTimeout(function () {
      injectBell();
      refreshCount();
      pollTimer = setInterval(refreshCount, POLL_INTERVAL_MS);
    }, 200);
  });

  // Pause polling when tab hidden, refresh on visible
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    else if (!document.hidden && !pollTimer) {
      refreshCount();
      pollTimer = setInterval(refreshCount, POLL_INTERVAL_MS);
    }
  });
})();
