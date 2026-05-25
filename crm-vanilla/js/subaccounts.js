/* NetWebMedia CRM — Sub-accounts admin page logic
 *
 * Master-org-only listing/management of sub-accounts (white-label tenants).
 *
 * API: query-string routing on /api/index.php
 *   GET    /api/?r=organizations
 *   POST   /api/?r=organizations
 *   PATCH  /api/?r=organizations&slug=<slug>
 *   POST   /api/?r=organizations&slug=<slug>&sub=suspend
 *   POST   /api/?r=organizations&slug=<slug>&sub=unsuspend
 *
 * Defensive: every fetch is try/catch'd; 403 surfaces a friendly screen.
 */
(function () {
  "use strict";

  var state = {
    orgs: [],
    isMasterOwner: false,
    editing: null   // org currently being edited in the modal, or null for "create"
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtDate(s) {
    if (!s) return "—";
    try {
      var d = new Date(s.indexOf("T") > -1 ? s : s.replace(" ", "T") + "Z");
      if (isNaN(d.getTime())) return esc(s);
      return d.toISOString().slice(0, 10);
    } catch (_) { return esc(s); }
  }
  function slugify(s) {
    return String(s || "").toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 64);
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function toast(msg, kind) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = [
      "position:fixed", "right:20px", "bottom:20px",
      "background:" + (kind === "error" ? "#c0392b" : "#27ae60"),
      "color:#fff", "padding:12px 18px", "border-radius:8px",
      "box-shadow:0 6px 20px rgba(0,0,0,.25)", "z-index:2000",
      "font:600 13px Inter,sans-serif", "max-width:340px"
    ].join(";");
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2400);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2800);
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP) {
      try { CRM_APP.buildSidebar && CRM_APP.buildSidebar(); } catch (_) {}
      try {
        // The "+ New sub-account" button is master-owner-only. Render the
        // header WITHOUT it on first paint; we'll add it back inside
        // maybeShowCreateButton() once loadOrgs() confirms permissions.
        CRM_APP.buildHeader && CRM_APP.buildHeader("Sub-accounts", '');
      } catch (_) {}
    }

    // Mount the org switcher into the page header (after build).
    var headerRight = document.querySelector(".page-header .header-right");
    if (headerRight && window.nwmOrgSwitcher) {
      var slot = document.createElement("div");
      slot.id = "orgSwitcherSlot";
      headerRight.insertBefore(slot, headerRight.firstChild);
      window.nwmOrgSwitcher.mount(slot);
    }

    loadOrgs();
  });

  // Render the "+ New sub-account" button only after we've confirmed the
  // current user is a master-org owner. Idempotent.
  function maybeShowCreateButton() {
    if (!state.isMasterOwner) return;
    var headerRight = document.querySelector(".page-header .header-right");
    if (!headerRight) return;
    if (document.getElementById("newSubBtn")) return; // already there
    var btn = document.createElement("button");
    btn.id = "newSubBtn";
    btn.className = "btn btn-primary";
    btn.style.marginRight = "6px";
    btn.textContent = "+ New sub-account";
    btn.addEventListener("click", function () { openModal(null); });
    // Insert before the org switcher slot if present, else append.
    var orgSlot = document.getElementById("orgSwitcherSlot");
    if (orgSlot) headerRight.insertBefore(btn, orgSlot);
    else headerRight.appendChild(btn);
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  function loadOrgs() {
    var body = document.getElementById("subaccountsBody");
    if (body) body.innerHTML = '<tr><td colspan="7" style="padding:24px;color:var(--text-dim);">Loading…</td></tr>';

    fetch("/api/?r=organizations", { credentials: "include" })
      .then(function (r) {
        if (r.status === 401) { location.href = "/login.html"; return null; }
        if (r.status === 403) { renderForbidden(); return null; }
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        if (!json) return;
        var orgs = (json && json.organizations) || [];
        state.orgs = orgs;
        // Master-owner heuristic: response includes member_count when the
        // master-owner branch served it, OR they own the master org (id=1).
        state.isMasterOwner = orgs.some(function (o) {
          if (typeof o.member_count !== "undefined") return true;
          if (Number(o.id) === 1 && o.my_role === "owner") return true;
          return false;
        });

        if (!state.isMasterOwner) {
          renderForbidden();
          return;
        }
        maybeShowCreateButton();
        renderTable();
      })
      .catch(function (err) {
        console.error("[subaccounts] load failed", err);
        if (body) body.innerHTML = '<tr><td colspan="7" style="padding:24px;color:var(--red);">Failed to load. Please reload.</td></tr>';
      });
  }

  // ── Rendering ────────────────────────────────────────────────────────────
  function renderForbidden() {
    var wrap = document.getElementById("subaccountsRoot");
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="card" style="text-align:center;padding:48px 24px;">' +
        '<h2 style="margin:0 0 12px;">You don\'t have permission to view this page.</h2>' +
        '<p style="color:var(--text-dim);margin:0 0 24px;">Sub-account management is restricted to NetWebMedia owners.</p>' +
        '<a href="/crm-vanilla/index.html" class="btn btn-primary">← Back to dashboard</a>' +
      '</div>';
    // Defensive: button shouldn't exist for non-masters anymore (it's only
    // created via maybeShowCreateButton after a master-owner check), but
    // remove it if some race ever lands it here.
    var newBtn = document.getElementById("newSubBtn");
    if (newBtn && newBtn.parentNode) newBtn.parentNode.removeChild(newBtn);
  }

  function renderTable() {
    var body = document.getElementById("subaccountsBody");
    if (!body) return;

    // Filter to sub-accounts (exclude master org). Master owners see all.
    var rows = state.orgs.filter(function (o) { return Number(o.id) !== 1; });

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7" style="padding:24px;color:var(--text-dim);text-align:center;">No sub-accounts yet. Click "+ New sub-account" to create one.</td></tr>';
      return;
    }

    var html = "";
    for (var i = 0; i < rows.length; i++) {
      var o = rows[i];
      var statusColor = o.status === "active" ? "var(--green)" :
                        o.status === "suspended" ? "var(--red)" : "var(--text-dim)";
      var statusLabel = (o.status || "").charAt(0).toUpperCase() + (o.status || "").slice(1);
      var planLabel = (o.plan || "").charAt(0).toUpperCase() + (o.plan || "").slice(1);
      var memberCount = (typeof o.member_count !== "undefined") ? o.member_count : "—";

      html += '<tr data-slug="' + esc(o.slug) + '">';
      html += '<td><code style="font-size:12px;color:var(--text-dim);">' + esc(o.slug) + '</code></td>';
      html += '<td><strong>' + esc(o.display_name || o.slug) + '</strong></td>';
      html += '<td><span class="status-badge" style="background:rgba(108,92,231,.15);color:var(--accent);">' + esc(planLabel) + '</span></td>';
      html += '<td><span style="color:' + statusColor + ';font-weight:600;font-size:12px;">●</span> ' + esc(statusLabel) + '</td>';
      html += '<td>' + esc(memberCount) + '</td>';
      html += '<td style="color:var(--text-dim);font-size:12px;">' + fmtDate(o.created_at) + '</td>';
      html += '<td style="white-space:nowrap;">';
      html += '<button class="btn btn-secondary btn-sm" data-act="edit" data-slug="' + esc(o.slug) + '">Edit</button> ';
      html += '<button class="btn btn-secondary btn-sm" data-act="view" data-slug="' + esc(o.slug) + '">View</button> ';
      if (o.status === "active") {
        html += '<button class="btn btn-secondary btn-sm" data-act="suspend" data-slug="' + esc(o.slug) + '" style="color:var(--red);">Suspend</button>';
      } else {
        html += '<button class="btn btn-secondary btn-sm" data-act="unsuspend" data-slug="' + esc(o.slug) + '" style="color:var(--green);">Unsuspend</button>';
      }
      html += '</td>';
      html += '</tr>';
    }
    body.innerHTML = html;

    body.onclick = function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      var slug = btn.getAttribute("data-slug");
      var org = state.orgs.find(function (x) { return x.slug === slug; });
      if (!org) return;
      if (act === "edit") openModal(org);
      else if (act === "view") {
        // Switch context first, then go to dashboard.
        switchAndGo(org);
      }
      else if (act === "suspend") suspendOrg(org, true);
      else if (act === "unsuspend") suspendOrg(org, false);
    };
  }

  function switchAndGo(org) {
    fetch("/api/?r=organizations&sub=switch", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: org.id })
    }).then(function (r) {
      if (!r.ok) throw new Error("switch HTTP " + r.status);
      try { sessionStorage.removeItem("nwm_orgs"); } catch (_) {}
      location.href = "/crm-vanilla/index.html?org=" + encodeURIComponent(org.slug);
    }).catch(function (err) {
      console.error("[subaccounts] switch failed", err);
      toast("Could not switch — opening with hint", "error");
      location.href = "/crm-vanilla/index.html?org=" + encodeURIComponent(org.slug);
    });
  }

  function suspendOrg(org, suspend) {
    var verb = suspend ? "suspend" : "unsuspend";
    // Sanitize before piping into confirm(): a tenant-controlled
    // display_name with embedded newlines could craft a deceptive prompt
    // (e.g. inject a fake "Cancel" line). confirm() is plain text so this
    // is not XSS, but it's still a UX/social-engineering hole.
    var safeName = String(org.display_name || org.slug || "")
      .replace(/[\r\n\t]+/g, " ")
      .slice(0, 80);
    if (!confirm((suspend ? "Suspend" : "Unsuspend") + ' "' + safeName + '"?')) return;
    fetch("/api/?r=organizations&slug=" + encodeURIComponent(org.slug) + "&sub=" + verb, {
      method: "POST", credentials: "include"
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function () {
      toast("Sub-account " + (suspend ? "suspended" : "reactivated"));
      try { sessionStorage.removeItem("nwm_orgs"); } catch (_) {}
      loadOrgs();
    }).catch(function (err) {
      console.error("[subaccounts]", verb, "failed", err);
      toast("Action failed", "error");
    });
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  function openModal(org) {
    state.editing = org || null;
    var isEdit = !!org;

    var modal = document.getElementById("subModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "subModal";
      modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;";
      document.body.appendChild(modal);
    }
    modal.innerHTML = modalHtml(org, isEdit);
    modal.style.display = "flex";

    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    var form = document.getElementById("subForm");
    if (form) form.addEventListener("submit", onSubmit);

    var nameInput = document.getElementById("f_display_name");
    var slugInput = document.getElementById("f_slug");
    var subdomainInput = document.getElementById("f_subdomain");
    var slugTouched = isEdit; // don't auto-rewrite on edit
    var subTouched = isEdit;

    if (nameInput && slugInput) {
      nameInput.addEventListener("input", function () {
        if (!slugTouched) slugInput.value = slugify(nameInput.value);
        if (!subTouched && subdomainInput) subdomainInput.value = (slugInput.value || "") + ".netwebmedia.com";
      });
    }
    if (slugInput) {
      slugInput.addEventListener("input", function () {
        slugTouched = true;
        slugInput.value = slugify(slugInput.value);
        if (!subTouched && subdomainInput) subdomainInput.value = (slugInput.value || "") + ".netwebmedia.com";
      });
    }
    if (subdomainInput) subdomainInput.addEventListener("input", function () { subTouched = true; });

    var closeBtn = document.getElementById("subModalClose");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    var cancelBtn = document.getElementById("subModalCancel");
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    setTimeout(function () { if (nameInput) nameInput.focus(); }, 50);
  }

  function closeModal() {
    var modal = document.getElementById("subModal");
    if (modal) modal.style.display = "none";
    state.editing = null;
  }

  function modalHtml(org, isEdit) {
    var o = org || {};
    return [
      '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);max-width:560px;width:100%;max-height:90vh;overflow:auto;padding:24px;">',
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">',
          '<h2 style="margin:0;font-size:18px;">' + (isEdit ? "Edit sub-account" : "New sub-account") + '</h2>',
          '<button id="subModalClose" style="background:none;border:none;color:var(--text-dim);font-size:22px;cursor:pointer;">×</button>',
        '</div>',
        '<form id="subForm">',
          field("Display name *", '<input id="f_display_name" name="display_name" required maxlength="120" value="' + esc(o.display_name || "") + '" ' + inputCss() + '>'),
          field("Slug *",        '<input id="f_slug" name="slug" required pattern="[a-z0-9-]{2,64}" value="' + esc(o.slug || "") + '" ' + (isEdit ? "readonly " : "") + inputCss() + '>',
                                 isEdit ? "Slug cannot be changed after creation." : "lowercase letters, numbers, hyphens (2–64 chars)"),
          field("Plan *",
            '<select id="f_plan" name="plan" ' + inputCss() + '>' +
              '<option value="agency"' + (o.plan === "agency" ? " selected" : "") + '>Agency (can host its own clients)</option>' +
              '<option value="client"' + (o.plan !== "agency" ? " selected" : "") + '>Client (single tenant)</option>' +
            '</select>',
            isEdit ? "Plan changes require backend update" : ""),
          '<div style="border-top:1px solid var(--border);margin:16px 0 12px;padding-top:12px;font-size:12px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;">Optional</div>',
          field("Subdomain", '<input id="f_subdomain" name="subdomain" value="' + esc(o.subdomain || "") + '" placeholder="acme.netwebmedia.com" ' + inputCss() + '>'),
          field("Sender email", '<input id="f_sender_email" name="sender_email" type="email" value="' + esc(o.sender_email || "") + '" placeholder="hello@acme.com" ' + inputCss() + '>'),
          field("Logo URL", '<input id="f_branding_logo_url" name="branding_logo_url" value="' + esc(o.branding_logo_url || "") + '" placeholder="https://…/logo.svg" ' + inputCss() + '>'),
          '<div style="display:flex;gap:12px;">',
            '<div style="flex:1;">' + field("Primary color", '<input id="f_branding_primary_color" name="branding_primary_color" type="color" value="' + esc(o.branding_primary_color || "#010F3B") + '" style="width:100%;height:38px;border-radius:6px;border:1px solid var(--border);background:var(--bg-card);">') + '</div>',
            '<div style="flex:1;">' + field("Secondary color", '<input id="f_branding_secondary_color" name="branding_secondary_color" type="color" value="' + esc(o.branding_secondary_color || "#FF671F") + '" style="width:100%;height:38px;border-radius:6px;border:1px solid var(--border);background:var(--bg-card);">') + '</div>',
          '</div>',
          '<div id="subFormError" style="display:none;color:var(--red);background:rgba(225,112,85,.1);padding:10px 12px;border-radius:6px;margin-top:12px;font-size:13px;"></div>',
          '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">',
            '<button type="button" id="subModalCancel" class="btn btn-secondary">Cancel</button>',
            '<button type="submit" class="btn btn-primary" id="subFormSubmit">' + (isEdit ? "Save changes" : "Create sub-account") + '</button>',
          '</div>',
        '</form>',
      '</div>'
    ].join("");
  }

  function field(label, input, hint) {
    return '<div style="margin-bottom:14px;"><label style="display:block;font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:6px;">' + esc(label) + '</label>' + input +
      (hint ? '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">' + esc(hint) + '</div>' : "") + '</div>';
  }
  function inputCss() {
    return 'style="width:100%;padding:9px 12px;background:var(--bg-input,var(--bg-card));border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;outline:none;font-family:inherit;"';
  }

  function onSubmit(e) {
    e.preventDefault();
    var errEl = document.getElementById("subFormError");
    var btn = document.getElementById("subFormSubmit");
    if (errEl) errEl.style.display = "none";
    if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }

    var form = e.target;
    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function (v, k) { if (v !== "") payload[k] = v; });

    var isEdit = !!state.editing;
    var url, method;
    if (isEdit) {
      url = "/api/?r=organizations&slug=" + encodeURIComponent(state.editing.slug);
      method = "PATCH";
      // Slug + plan are not editable via PATCH (allowlist on the server).
      delete payload.slug;
      delete payload.plan;
    } else {
      url = "/api/?r=organizations";
      method = "POST";
    }

    fetch(url, {
      method: method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (json) { return { ok: r.ok, status: r.status, json: json }; });
    }).then(function (res) {
      if (!res.ok) {
        var msg = (res.json && (res.json.error || res.json.message)) || ("HTTP " + res.status);
        throw new Error(msg);
      }
      toast(isEdit ? "Sub-account updated" : "Sub-account created");
      try { sessionStorage.removeItem("nwm_orgs"); } catch (_) {}
      closeModal();
      loadOrgs();
    }).catch(function (err) {
      console.error("[subaccounts] save failed", err);
      if (errEl) { errEl.textContent = String(err && err.message || err); errEl.style.display = "block"; }
      if (btn) { btn.disabled = false; btn.textContent = isEdit ? "Save changes" : "Create sub-account"; }
    });
  }
})();
