/* SMS admin — bulk campaigns, opt-outs, inbound log.
   Backed by /api/sms/* (api-php/routes/sms.php).
*/
(function () {
  "use strict";

  var API = "/api/sms";

  var state = {
    campaigns: [],
    optOuts:   [],
    inbound:   [],
    loaded:    { campaigns:false, optouts:false, inbound:false },
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
          e.status = r.status; e.data = data; throw e;
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
    setTimeout(function () { el.remove(); }, 2800);
  }

  function relTime(iso) {
    if (!iso) return "";
    var d = new Date(iso.replace(" ", "T"));
    if (isNaN(d.getTime())) return iso;
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return Math.max(1, Math.floor(diff)) + "s ago";
    if (diff < 3600)      return Math.floor(diff / 60) + "m ago";
    if (diff < 86400)     return Math.floor(diff / 3600) + "h ago";
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
    return d.toLocaleDateString();
  }

  /* ── tabs ── */
  function bindTabs() {
    var tabs = document.querySelectorAll(".sms-tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        document.querySelectorAll(".sms-panel").forEach(function (p) { p.classList.remove("active"); });
        var key = t.getAttribute("data-smstab");
        document.getElementById("sms-" + key).classList.add("active");
        if (key === "campaigns" && !state.loaded.campaigns) loadCampaigns();
        if (key === "optouts"   && !state.loaded.optouts)   loadOptOuts();
        if (key === "inbound"   && !state.loaded.inbound)   loadInbound();
      });
    });
  }

  /* ── CAMPAIGNS ── */
  function loadCampaigns() {
    return api("GET", API + "/campaigns").then(function (r) {
      state.campaigns = r.campaigns || [];
      state.loaded.campaigns = true;
      renderCampaigns();
    }).catch(function (e) {
      var l = document.getElementById("campaignsList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load campaigns: ' + esc(e.message) +
        '<br><small>Make sure /api/sms is deployed and you are signed in.</small></div>';
    });
  }

  function renderCampaigns() {
    var l = document.getElementById("campaignsList");
    if (!state.campaigns.length) {
      l.innerHTML = '<div class="empty-state">No SMS campaigns yet.<br>Click <strong>+ New Campaign</strong> to create your first one.</div>';
      return;
    }
    l.innerHTML = state.campaigns.map(function (c) {
      var pct = c.total_recipients > 0 ? Math.round(((c.sent_count + c.failed_count) / c.total_recipients) * 100) : 0;
      var showProgress = c.status === "sending" || c.status === "sent";
      var actions = [];
      if (c.status === "draft" || c.status === "paused") actions.push('<button class="btn btn-secondary" data-action="edit" data-id="' + c.id + '">Edit</button>');
      if (c.status === "sending") actions.push('<button class="btn btn-secondary" data-action="cancel" data-id="' + c.id + '">Pause</button>');
      if (c.status !== "sending" && c.status !== "sent") actions.push('<button class="btn btn-danger" data-action="delete" data-id="' + c.id + '">Delete</button>');

      return '<div class="campaign-row">' +
               '<div class="info">' +
                 '<h4>' + esc(c.name) + ' <span class="badge ' + esc(c.status) + '">' + esc(c.status) + '</span></h4>' +
                 '<div class="body-preview">' + esc(c.body) + '</div>' +
                 '<div class="meta">' +
                   '<span>👥 ' + (c.total_recipients || 0) + ' recipients</span>' +
                   (c.sent_count ? '<span>✅ ' + c.sent_count + ' sent</span>' : '') +
                   (c.failed_count ? '<span>❌ ' + c.failed_count + ' failed</span>' : '') +
                   (c.opted_out_count ? '<span>🚫 ' + c.opted_out_count + ' opted-out</span>' : '') +
                   (c.created_at ? '<span>📅 ' + esc(relTime(c.created_at)) + '</span>' : '') +
                 '</div>' +
                 (showProgress ? '<div class="progress"><div class="progress-bar" style="width:' + pct + '%"></div></div>' : '') +
               '</div>' +
               '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
                 actions.join('') +
               '</div>' +
             '</div>';
    }).join("");
  }

  function openCampaignModal(c) {
    var isNew = !c;
    document.getElementById("campaignModalTitle").textContent = isNew ? "New SMS Campaign" : "Edit SMS Campaign";
    document.getElementById("campaignId").value = c ? c.id : "";
    document.getElementById("cName").value      = c ? (c.name || "") : "";
    document.getElementById("cBody").value      = c ? (c.body || "") : "";
    var f = (c && c.audience_filter) || {};
    document.getElementById("cSegment").value = f.segment   || "";
    document.getElementById("cNiche").value   = f.niche_key || "";
    document.getElementById("cStatus").value  = f.status    || "";
    document.getElementById("cCity").value    = f.city      || "";
    document.getElementById("cDelete").style.display = isNew ? "none" : "inline-flex";
    document.getElementById("cPreviewBox").innerHTML = "";
    document.getElementById("campaignModal").classList.add("open");
    updateCharCounter();
  }
  function closeCampaignModal() { document.getElementById("campaignModal").classList.remove("open"); }

  function readCampaignForm() {
    var filter = {};
    var seg = document.getElementById("cSegment").value;   if (seg) filter.segment = seg;
    var n   = document.getElementById("cNiche").value;     if (n)   filter.niche_key = n;
    var st  = document.getElementById("cStatus").value;    if (st)  filter.status = st;
    var ct  = document.getElementById("cCity").value.trim(); if (ct) filter.city = ct;
    return {
      name: document.getElementById("cName").value.trim(),
      body: document.getElementById("cBody").value.trim(),
      audience_filter: Object.keys(filter).length ? filter : null,
    };
  }

  function saveCampaign(thenSend) {
    var id = document.getElementById("campaignId").value;
    var data = readCampaignForm();
    if (!data.name) { toast("Name is required.", true); return; }
    if (!data.body) { toast("Body is required.", true); return; }

    var p = id
      ? api("PUT",  API + "/campaigns/" + id, data).then(function () { return id; })
      : api("POST", API + "/campaigns",       data).then(function (r) { return r.id; });

    p.then(function (cid) {
      if (thenSend) {
        if (!confirm("Send SMS to all matching contacts now? This cannot be undone.")) return;
        return api("POST", API + "/campaigns/" + cid + "/send").then(function (r) {
          toast("Queued " + (r.queued || 0) + " recipients (" + (r.opted_out || 0) + " opted-out skipped). Cron will send.");
          closeCampaignModal();
          return loadCampaigns();
        });
      } else {
        toast(id ? "Updated." : "Saved as draft.");
        closeCampaignModal();
        return loadCampaigns();
      }
    }).catch(function (e) { toast("Failed: " + e.message, true); });
  }

  function deleteCampaign() {
    var id = document.getElementById("campaignId").value;
    if (!id) return;
    if (!confirm("Delete this campaign? Pending recipients will be removed.")) return;
    api("DELETE", API + "/campaigns/" + id)
      .then(function () { toast("Deleted."); closeCampaignModal(); return loadCampaigns(); })
      .catch(function (e) { toast("Delete failed: " + e.message, true); });
  }

  function previewCampaign() {
    var id = document.getElementById("campaignId").value;
    var data = readCampaignForm();
    if (!data.body) { toast("Add a message body first.", true); return; }

    var run = id
      ? api("PUT", API + "/campaigns/" + id, data).then(function () { return id; })
      : api("POST", API + "/campaigns", data).then(function (r) {
          document.getElementById("campaignId").value = r.id;
          document.getElementById("cDelete").style.display = "inline-flex";
          return r.id;
        });

    run.then(function (cid) {
      return api("POST", API + "/campaigns/" + cid + "/preview");
    }).then(function (r) {
      var box = document.getElementById("cPreviewBox");
      var samples = (r.sample || []).map(function (s) {
        return '<div class="preview-msg"><div class="to">→ ' + esc(s.phone || '?') + ' (' + esc(s.name || 'Unknown') + ')</div>' + esc(s.body) + '</div>';
      }).join("");
      box.innerHTML =
        '<div class="preview-box">' +
          '<div class="preview-stats">' +
            '<div><span>' + r.audience_size + '</span> matching contacts</div>' +
            '<div class="' + (r.opt_out_count > 0 ? 'alert' : '') + '"><span>' + r.opt_out_count + '</span> opted-out (skipped)</div>' +
            '<div><span>' + Math.max(0, r.audience_size - r.opt_out_count) + '</span> will receive</div>' +
          '</div>' +
          (samples ? '<div style="font:600 11px Inter;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-top:8px">Sample messages</div>' + samples
                   : '<div style="color:#94a3b8;font-size:13px">No matching contacts. Adjust the audience filter.</div>') +
        '</div>';
    }).catch(function (e) { toast("Preview failed: " + e.message, true); });
  }

  function updateCharCounter() {
    var ta = document.getElementById("cBody");
    var c  = document.getElementById("charCounter");
    var n  = ta.value.length;
    var seg = n === 0 ? 0 : Math.ceil(n / 160);
    c.textContent = n + " / " + (seg <= 1 ? "160" : seg * 160) + " chars (" + (seg || 1) + " SMS segment" + (seg > 1 ? "s" : "") + ")";
    c.className = "char-counter" + (n > 160 ? " warn" : "");
  }

  /* ── OPT-OUTS ── */
  function loadOptOuts() {
    return api("GET", API + "/opt-outs").then(function (r) {
      state.optOuts = r.opt_outs || [];
      state.loaded.optouts = true;
      renderOptOuts();
    }).catch(function (e) {
      var l = document.getElementById("optOutsList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load opt-outs: ' + esc(e.message) + '</div>';
    });
  }
  function renderOptOuts() {
    var l = document.getElementById("optOutsList");
    if (!state.optOuts.length) {
      l.innerHTML = '<div class="empty-state">No opt-outs yet. STOP keyword replies will be added here automatically.</div>';
      return;
    }
    l.innerHTML = state.optOuts.map(function (o) {
      return '<div class="opt-out-row">' +
               '<span class="phone">' + esc(o.phone) + '</span>' +
               '<span class="reason">' + esc(o.reason) + '</span>' +
               '<span class="when">' + esc(relTime(o.opted_out_at)) + '</span>' +
               '<button class="btn btn-secondary" data-resub="' + o.id + '">Re-subscribe</button>' +
             '</div>';
    }).join("");
  }
  function openOptOutModal() {
    document.getElementById("optOutPhone").value = "";
    document.getElementById("optOutReason").value = "manual";
    document.getElementById("optOutModal").classList.add("open");
  }
  function closeOptOutModal() { document.getElementById("optOutModal").classList.remove("open"); }
  function saveOptOut() {
    var phone = document.getElementById("optOutPhone").value.trim();
    if (!phone) { toast("Phone is required.", true); return; }
    api("POST", API + "/opt-outs", { phone: phone, reason: document.getElementById("optOutReason").value })
      .then(function () { toast("Opted out."); closeOptOutModal(); return loadOptOuts(); })
      .catch(function (e) { toast("Failed: " + e.message, true); });
  }

  /* ── INBOUND ── */
  function loadInbound() {
    return api("GET", API + "/inbound").then(function (r) {
      state.inbound = r.inbound || [];
      state.loaded.inbound = true;
      renderInbound();
    }).catch(function (e) {
      var l = document.getElementById("inboundList");
      if (l) l.innerHTML = '<div class="empty-state">Could not load inbound: ' + esc(e.message) + '</div>';
    });
  }
  function renderInbound() {
    var l = document.getElementById("inboundList");
    if (!state.inbound.length) {
      l.innerHTML = '<div class="empty-state">No inbound SMS yet.</div>';
      return;
    }
    l.innerHTML = state.inbound.map(function (i) {
      return '<div class="opt-out-row">' +
               '<span class="phone">' + esc(i.from_phone) + '</span>' +
               '<span style="flex:2;color:#1a1a2e;font:500 13px Inter">' + esc(i.body) + '</span>' +
               '<span class="when">' + esc(relTime(i.received_at)) + '</span>' +
             '</div>';
    }).join("");
  }

  /* ── boot ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.CRM_APP && CRM_APP.buildHeader) {
      CRM_APP.buildHeader("SMS", '');
    }
    bindTabs();

    document.getElementById("newCampaignBtn").addEventListener("click", function () { openCampaignModal(null); });
    document.getElementById("cCancel").addEventListener("click", closeCampaignModal);
    document.getElementById("cSave").addEventListener("click", function () { saveCampaign(false); });
    document.getElementById("cSend").addEventListener("click", function () { saveCampaign(true); });
    document.getElementById("cDelete").addEventListener("click", deleteCampaign);
    document.getElementById("cPreview").addEventListener("click", previewCampaign);
    document.getElementById("cBody").addEventListener("input", updateCharCounter);
    document.getElementById("campaignModal").addEventListener("click", function (e) {
      if (e.target.id === "campaignModal") closeCampaignModal();
    });

    document.getElementById("mergeTags").addEventListener("click", function (e) {
      var t = e.target.closest("[data-tag]"); if (!t) return;
      var ta = document.getElementById("cBody");
      var tag = t.getAttribute("data-tag");
      var pos = ta.selectionStart || ta.value.length;
      ta.value = ta.value.slice(0, pos) + tag + ta.value.slice(pos);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos + tag.length;
      updateCharCounter();
    });

    document.getElementById("addOptOutBtn").addEventListener("click", openOptOutModal);
    document.getElementById("ooCancel").addEventListener("click", closeOptOutModal);
    document.getElementById("ooSave").addEventListener("click", saveOptOut);
    document.getElementById("optOutModal").addEventListener("click", function (e) {
      if (e.target.id === "optOutModal") closeOptOutModal();
    });

    document.getElementById("campaignsList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]"); if (!btn) return;
      var id = parseInt(btn.getAttribute("data-id"), 10);
      var c  = state.campaigns.find(function (x) { return x.id === id; });
      var action = btn.getAttribute("data-action");
      if (action === "edit"  && c) openCampaignModal(c);
      if (action === "cancel") {
        api("POST", API + "/campaigns/" + id + "/cancel")
          .then(function () { toast("Paused."); return loadCampaigns(); })
          .catch(function (e) { toast(e.message, true); });
      }
      if (action === "delete") {
        if (!confirm("Delete this campaign?")) return;
        api("DELETE", API + "/campaigns/" + id)
          .then(function () { toast("Deleted."); return loadCampaigns(); })
          .catch(function (e) { toast(e.message, true); });
      }
    });

    document.getElementById("optOutsList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-resub]"); if (!btn) return;
      if (!confirm("Re-subscribe this number to SMS? Use only with explicit consent.")) return;
      var id = btn.getAttribute("data-resub");
      api("DELETE", API + "/opt-outs/" + id)
        .then(function () { toast("Re-subscribed."); return loadOptOuts(); })
        .catch(function (e) { toast(e.message, true); });
    });

    loadCampaigns();
  });
})();
