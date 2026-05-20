/* Reputation admin — real review tracking + request flow + connector setup.
   Backed by /api/reputation/* (api-php/routes/reputation.php).
*/
(function () {
  "use strict";
  var API = "/api/reputation";

  var state = {
    stats: null,
    reviews: [],
    requests: [],
    connectors: [],
    available: [],
    docs: {},
    activeTab: 'reviews',
  };

  function api(method, path, body) {
    var headers = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, { method: method, headers: headers, credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      var ct = r.headers.get("content-type") || "";
      var p = ct.indexOf("application/json") !== -1 ? r.json() : r.text();
      return p.then(function (d) {
        if (!r.ok) { var e = new Error((d && d.error) || ("HTTP " + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function toast(msg, isError) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;bottom:24px;right:24px;background:" + (isError ? "#b91c1c" : "#10b981") +
      ";color:#fff;padding:10px 16px;border-radius:8px;font:600 13px Inter;z-index:1100;box-shadow:0 4px 14px rgba(0,0,0,.15)";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  function relTime(iso) {
    if (!iso) return "";
    var d = new Date(String(iso).replace(" ", "T"));
    if (isNaN(d.getTime())) return iso;
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString();
  }

  function stars(n) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆';
    return '<span style="color:#FF671F;letter-spacing:1px">' + s + '</span>';
  }

  function ensureCss() {
    if (document.getElementById('rep-css')) return;
    var s = document.createElement('style'); s.id = 'rep-css';
    s.textContent = [
      '.rep-tabs{display:flex;gap:4px;border-bottom:1px solid #e3e5ee;margin:0 0 18px}',
      '.rep-tab{padding:10px 18px;border:none;background:transparent;color:#64748b;font:600 13px Inter;cursor:pointer;border-bottom:2px solid transparent}',
      '.rep-tab.active{color:#010F3B;border-bottom-color:#FF671F}',
      '.rep-panel{display:none}',
      '.rep-panel.active{display:block}',
      '.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:18px}',
      '.kpi{background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:12px}',
      '.kpi .lbl{color:#64748b;font:600 11px Inter;text-transform:uppercase;letter-spacing:.4px}',
      '.kpi .val{color:#010F3B;font:700 22px Inter;margin-top:4px}',
      '.kpi .val.warn{color:#FF671F}',
      '.review-card{background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:14px;margin-bottom:8px}',
      '.review-card .head{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px}',
      '.review-card h4{margin:0;color:#010F3B;font:700 14px Inter}',
      '.review-card .meta{color:#94a3b8;font:600 11px Inter;text-transform:uppercase;letter-spacing:.4px}',
      '.review-card .body{color:#1a1a2e;font:500 13px Inter;line-height:1.5;margin-top:6px;white-space:pre-wrap}',
      '.review-card .resp{background:#f8fafc;border-left:3px solid #FF671F;padding:8px 12px;border-radius:4px;margin-top:10px;font:500 13px Inter;color:#1a1a2e}',
      '.review-card .platform{display:inline-block;font:700 10px Inter;text-transform:uppercase;letter-spacing:.5px;padding:2px 7px;border-radius:4px;background:#f2f3f8;color:#64748b}',
      '.req-row{background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:12px;margin-bottom:6px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;font:500 13px Inter}',
      '.req-status{font:700 11px Inter;text-transform:uppercase;letter-spacing:.4px;padding:2px 8px;border-radius:6px}',
      '.req-status.sent{background:#f2f3f8;color:#64748b}',
      '.req-status.opened{background:#dbeafe;color:#1e40af}',
      '.req-status.submitted{background:#dcfce7;color:#166534}',
      '.connector-card{background:#fff;border:1px solid #e3e5ee;border-radius:10px;padding:14px;margin-bottom:8px}',
      '.connector-card.active{border-color:#10b981;background:linear-gradient(180deg,#f0fdf4,#fff)}',
      '.connector-card .head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}',
      '.connector-card .docs{color:#64748b;font:500 12px Inter;margin-top:6px;line-height:1.5}',
      '.modal-bd{position:fixed;inset:0;background:rgba(2,8,23,.55);z-index:1000;display:none;align-items:center;justify-content:center}',
      '.modal-bd.open{display:flex}',
      '.modal-bx{background:#fff;border-radius:14px;padding:22px;width:540px;max-width:92vw;max-height:88vh;overflow:auto;box-shadow:0 20px 50px rgba(0,0,0,.25)}',
      '.modal-bx h3{margin:0 0 14px;color:#010F3B}',
      '.modal-bx label{display:block;color:#1a1a2e;font:600 12px Inter;margin:10px 0 4px;text-transform:uppercase;letter-spacing:.4px}',
      '.modal-bx input,.modal-bx textarea,.modal-bx select{width:100%;padding:9px 10px;border:1px solid #e3e5ee;border-radius:8px;font:400 14px Inter;box-sizing:border-box}',
      '.modal-bx textarea{min-height:70px;resize:vertical}',
      '.modal-bx .acts{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}',
      '.empty-state{color:#94a3b8;text-align:center;padding:40px 20px;font:500 14px Inter}',
    ].join('\n');
    document.head.appendChild(s);
  }

  function renderShell() {
    ensureCss();
    var body = document.getElementById('reputationBody');
    body.innerHTML =
      '<div class="rep-tabs">' +
        '<button class="rep-tab active" data-tab="reviews">Reviews</button>' +
        '<button class="rep-tab" data-tab="requests">Review Requests</button>' +
        '<button class="rep-tab" data-tab="connectors">Connectors</button>' +
      '</div>' +
      '<div class="rep-panel active" id="rep-reviews">' +
        '<div id="repKpis" class="kpi-grid"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
            '<select id="filterPlatform" style="padding:7px 12px;border:1px solid #e3e5ee;border-radius:8px;font:500 13px Inter"><option value="">All platforms</option></select>' +
            '<select id="filterStars" style="padding:7px 12px;border:1px solid #e3e5ee;border-radius:8px;font:500 13px Inter"><option value="">All ratings</option><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option><option value="2">2 ★</option><option value="1">1 ★</option></select>' +
            '<select id="filterResponded" style="padding:7px 12px;border:1px solid #e3e5ee;border-radius:8px;font:500 13px Inter"><option value="">Responded?</option><option value="1">Yes</option><option value="0">No</option></select>' +
          '</div>' +
          '<button class="btn btn-primary" id="newReviewBtn">+ Log Review</button>' +
        '</div>' +
        '<div id="reviewsList"></div>' +
      '</div>' +
      '<div class="rep-panel" id="rep-requests">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<p style="margin:0;color:#64748b;font:500 13px Inter">Send a review request via email or SMS. The contact gets a unique tracking link.</p>' +
          '<button class="btn btn-primary" id="newRequestBtn">+ Request Review</button>' +
        '</div>' +
        '<div id="requestsList"></div>' +
      '</div>' +
      '<div class="rep-panel" id="rep-connectors">' +
        '<p style="margin:0 0 14px;color:#64748b;font:500 13px Inter">Connect external review platforms to import reviews automatically. Each connector\'s OAuth/API setup steps are documented below; once tokens are in place, sync runs on demand.</p>' +
        '<div id="connectorsList"></div>' +
      '</div>';

    body.querySelectorAll('.rep-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        body.querySelectorAll('.rep-tab').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        body.querySelectorAll('.rep-panel').forEach(function (p) { p.classList.remove('active'); });
        var key = t.getAttribute('data-tab');
        document.getElementById('rep-' + key).classList.add('active');
        state.activeTab = key;
        if (key === 'requests'   && !state.reqLoaded)  loadRequests();
        if (key === 'connectors' && !state.connLoaded) loadConnectors();
      });
    });

    body.querySelector('#newReviewBtn').addEventListener('click', openReviewModal);
    body.querySelector('#newRequestBtn').addEventListener('click', openRequestModal);
    ['filterPlatform','filterStars','filterResponded'].forEach(function (id) {
      body.querySelector('#' + id).addEventListener('change', loadReviews);
    });
  }

  /* ── REVIEWS / STATS ── */
  function loadStats() {
    return api('GET', API + '/stats').then(function (s) {
      state.stats = s;
      var k = document.getElementById('repKpis');
      if (!k) return;
      k.innerHTML = [
        kpi('Avg Rating', (s.avg_stars || 0).toFixed(2) + ' / 5'),
        kpi('Total Reviews', s.total),
        kpi('This Month', s.this_month),
        kpi('Response Rate', (s.response_rate || 0) + '%', s.response_rate < 50),
        kpi('Requests Sent', s.requests_sent),
        kpi('Request Conv.', (s.request_conv_rate || 0) + '%'),
      ].join('');
    });
  }
  function kpi(label, value, warn) {
    return '<div class="kpi"><div class="lbl">' + esc(label) + '</div><div class="val' + (warn ? ' warn' : '') + '">' + esc(String(value)) + '</div></div>';
  }

  function loadReviews() {
    var p = document.getElementById('filterPlatform').value;
    var s = document.getElementById('filterStars').value;
    var r = document.getElementById('filterResponded').value;
    var qs = ['limit=200'];
    if (p) qs.push('platform=' + encodeURIComponent(p));
    if (s) qs.push('stars=' + encodeURIComponent(s));
    if (r !== '') qs.push('responded=' + encodeURIComponent(r));
    return api('GET', API + '/reviews?' + qs.join('&')).then(function (r) {
      state.reviews = r.reviews || [];
      // Populate platform filter dropdown
      var plats = {};
      state.reviews.forEach(function (rv) { plats[rv.platform] = true; });
      var sel = document.getElementById('filterPlatform');
      var keep = sel.value;
      sel.innerHTML = '<option value="">All platforms</option>' +
        Object.keys(plats).map(function (k) { return '<option value="' + esc(k) + '"' + (k === keep ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('');
      renderReviews();
    }).catch(function (e) {
      document.getElementById('reviewsList').innerHTML = '<div class="empty-state">Could not load reviews: ' + esc(e.message) + '</div>';
    });
  }

  function renderReviews() {
    var l = document.getElementById('reviewsList');
    if (!state.reviews.length) {
      l.innerHTML = '<div class="empty-state">No reviews match. Click <strong>+ Log Review</strong> or set up a connector to import.</div>';
      return;
    }
    l.innerHTML = state.reviews.map(function (rv) {
      return '<div class="review-card" data-id="' + rv.id + '">' +
               '<div class="head">' +
                 '<div>' +
                   '<h4>' + esc(rv.reviewer_name || 'Anonymous') + ' ' + stars(rv.stars) + '</h4>' +
                   '<div class="meta">' +
                     '<span class="platform">' + esc(rv.platform) + '</span> · ' +
                     esc(relTime(rv.posted_at || rv.created_at)) +
                   '</div>' +
                 '</div>' +
                 '<div style="display:flex;gap:6px">' +
                   (rv.response ? '' : '<button class="btn btn-primary" data-respond="' + rv.id + '">Respond</button>') +
                   '<button class="btn btn-secondary" data-edit="' + rv.id + '">Edit</button>' +
                 '</div>' +
               '</div>' +
               (rv.title ? '<div style="color:#010F3B;font:700 13px Inter;margin-top:6px">' + esc(rv.title) + '</div>' : '') +
               '<div class="body">' + esc(rv.body || '(no review text)') + '</div>' +
               (rv.response ? '<div class="resp"><strong>Your response:</strong><br>' + esc(rv.response) + '</div>' : '') +
             '</div>';
    }).join('');

    l.querySelectorAll('[data-respond]').forEach(function (b) {
      b.addEventListener('click', function () { openRespondModal(parseInt(b.getAttribute('data-respond'), 10)); });
    });
    l.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-edit'), 10);
        var rv = state.reviews.find(function (x) { return x.id === id; });
        if (rv) openReviewModal(rv);
      });
    });
  }

  function openReviewModal(rv) {
    showModal('Log Review',
      '<input type="hidden" id="rvId" value="' + (rv ? rv.id : '') + '">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        '<div><label>Platform</label><select id="rvPlatform">' + (state.available || ['google','facebook','manual']).map(function (p) {
          return '<option value="' + esc(p) + '"' + (rv && rv.platform === p ? ' selected' : '') + '>' + esc(p) + '</option>';
        }).join('') + '</select></div>' +
        '<div><label>Stars</label><select id="rvStars">' + [5,4,3,2,1].map(function (s) {
          return '<option value="' + s + '"' + (rv && rv.stars === s ? ' selected' : '') + '>' + s + ' ★</option>';
        }).join('') + '</select></div>' +
      '</div>' +
      '<label>Reviewer name</label><input id="rvName" value="' + esc(rv ? rv.reviewer_name || '' : '') + '">' +
      '<label>Reviewer email (optional)</label><input id="rvEmail" type="email" value="' + esc(rv ? rv.reviewer_email || '' : '') + '">' +
      '<label>Title (optional)</label><input id="rvTitle" value="' + esc(rv ? rv.title || '' : '') + '">' +
      '<label>Review body</label><textarea id="rvBody" rows="3">' + esc(rv ? rv.body || '' : '') + '</textarea>',
      function () {
        var id = document.getElementById('rvId').value;
        var data = {
          platform: document.getElementById('rvPlatform').value,
          stars: parseInt(document.getElementById('rvStars').value, 10),
          reviewer_name: document.getElementById('rvName').value.trim(),
          reviewer_email: document.getElementById('rvEmail').value.trim(),
          title: document.getElementById('rvTitle').value.trim(),
          body: document.getElementById('rvBody').value.trim(),
        };
        var p = id ? api('PUT', API + '/reviews/' + id, data) : api('POST', API + '/reviews', data);
        return p.then(function () { toast(id ? 'Updated.' : 'Logged.'); loadReviews(); loadStats(); });
      },
      rv && rv.id ? function () {
        if (!confirm('Delete this review?')) return Promise.reject();
        return api('DELETE', API + '/reviews/' + rv.id).then(function () { toast('Deleted.'); loadReviews(); loadStats(); });
      } : null
    );
  }

  function openRespondModal(id) {
    var rv = state.reviews.find(function (x) { return x.id === id; });
    if (!rv) return;
    showModal('Respond to ' + (rv.reviewer_name || 'review'),
      '<div style="background:#f8fafc;padding:8px 12px;border-radius:6px;margin-bottom:10px;font:500 13px Inter;color:#1a1a2e">' + stars(rv.stars) + ' — ' + esc(rv.body || '') + '</div>' +
      '<label>Your response</label>' +
      '<textarea id="rvResp" rows="5" placeholder="Thank the reviewer; address concerns; keep it short and professional."></textarea>',
      function () {
        var resp = document.getElementById('rvResp').value.trim();
        if (!resp) { toast('Response required.', true); return Promise.reject(); }
        return api('POST', API + '/reviews/' + id + '/respond', { response: resp })
          .then(function () { toast('Response saved.'); loadReviews(); loadStats(); });
      }
    );
  }

  /* ── REQUESTS ── */
  function loadRequests() {
    state.reqLoaded = true;
    return api('GET', API + '/requests').then(function (r) {
      state.requests = r.requests || [];
      renderRequests();
    }).catch(function (e) {
      document.getElementById('requestsList').innerHTML = '<div class="empty-state">Could not load: ' + esc(e.message) + '</div>';
    });
  }

  function renderRequests() {
    var l = document.getElementById('requestsList');
    if (!state.requests.length) {
      l.innerHTML = '<div class="empty-state">No review requests sent yet.</div>';
      return;
    }
    l.innerHTML = state.requests.map(function (q) {
      return '<div class="req-row">' +
               '<div style="flex:1;min-width:200px"><strong style="color:#010F3B">Contact #' + q.contact_id + '</strong> via <strong>' + esc(q.channel) + '</strong>' +
                 (q.contact_email ? '<br><span style="color:#64748b;font-size:12px">' + esc(q.contact_email) + '</span>' : '') +
                 (q.contact_phone ? '<br><span style="color:#64748b;font-size:12px">' + esc(q.contact_phone) + '</span>' : '') +
               '</div>' +
               '<div style="color:#94a3b8;font:600 11px Inter">' + esc(relTime(q.sent_at)) + '</div>' +
               '<span class="req-status ' + esc(q.status) + '">' + esc(q.status) + '</span>' +
             '</div>';
    }).join('');
  }

  function openRequestModal() {
    showModal('Request a review',
      '<label>Contact ID</label><input id="reqContactId" type="number" placeholder="42">' +
      '<label>Channel</label><select id="reqChannel"><option value="email">Email</option><option value="sms">SMS</option></select>' +
      '<label>Custom message (optional, supports {{first_name}} and {{review_link}})</label>' +
      '<textarea id="reqTpl" rows="3" placeholder="Hi {{first_name}}, would you mind leaving a quick review? {{review_link}}"></textarea>',
      function () {
        var data = {
          contact_id: parseInt(document.getElementById('reqContactId').value, 10),
          channel: document.getElementById('reqChannel').value,
          template: document.getElementById('reqTpl').value.trim() || undefined,
        };
        if (!data.contact_id) { toast('Contact ID required.', true); return Promise.reject(); }
        return api('POST', API + '/requests', data).then(function (r) {
          toast(r.delivery && r.delivery.ok ? 'Request sent.' : 'Saved (delivery: ' + ((r.delivery && r.delivery.reason) || 'pending') + ')');
          state.reqLoaded = false; loadRequests(); loadStats();
        });
      }
    );
  }

  /* ── CONNECTORS ── */
  function loadConnectors() {
    state.connLoaded = true;
    return api('GET', API + '/connectors').then(function (r) {
      state.connectors = r.connectors || [];
      state.available  = r.available || [];
      state.docs       = r.docs || {};
      renderConnectors();
    }).catch(function (e) {
      document.getElementById('connectorsList').innerHTML = '<div class="empty-state">Could not load: ' + esc(e.message) + '</div>';
    });
  }

  function renderConnectors() {
    var l = document.getElementById('connectorsList');
    var byPlat = {};
    state.connectors.forEach(function (c) { byPlat[c.platform] = c; });
    var rows = (state.available || []).map(function (p) {
      var c = byPlat[p];
      var active = !!c;
      return '<div class="connector-card' + (active ? ' active' : '') + '">' +
               '<div class="head">' +
                 '<div>' +
                   '<strong style="color:#010F3B;font:700 14px Inter;text-transform:uppercase;letter-spacing:.4px">' + esc(p) + '</strong>' +
                   (active ? ' <span style="color:#10b981;font:700 11px Inter">CONNECTED</span>' : ' <span style="color:#94a3b8;font:600 11px Inter">NOT CONNECTED</span>') +
                   (c && c.last_sync ? ' · last sync: ' + esc(relTime(c.last_sync)) : '') +
                 '</div>' +
                 '<div style="display:flex;gap:6px">' +
                   (active ? '<button class="btn btn-secondary" data-sync="' + c.id + '">Sync now</button>' : '') +
                   '<button class="btn btn-primary" data-config="' + esc(p) + '">' + (active ? 'Edit' : 'Connect') + '</button>' +
                   (active ? '<button class="btn btn-danger" data-disconn="' + c.id + '">Disconnect</button>' : '') +
                 '</div>' +
               '</div>' +
               (state.docs[p] ? '<div class="docs">' + esc(state.docs[p]) + '</div>' : '') +
             '</div>';
    }).join('');
    l.innerHTML = rows || '<div class="empty-state">No platforms available.</div>';

    l.querySelectorAll('[data-config]').forEach(function (b) {
      b.addEventListener('click', function () { openConnectorModal(b.getAttribute('data-config'), byPlat[b.getAttribute('data-config')]); });
    });
    l.querySelectorAll('[data-sync]').forEach(function (b) {
      b.addEventListener('click', function () {
        api('POST', API + '/connectors/' + b.getAttribute('data-sync') + '/sync')
          .then(function (r) { toast('Sync: ' + (r.note ? 'storage ready, awaiting API client' : ('imported ' + r.synced))); loadConnectors(); })
          .catch(function (e) { toast(e.message, true); });
      });
    });
    l.querySelectorAll('[data-disconn]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Disconnect this platform?')) return;
        api('DELETE', API + '/connectors/' + b.getAttribute('data-disconn'))
          .then(function () { toast('Disconnected.'); loadConnectors(); })
          .catch(function (e) { toast(e.message, true); });
      });
    });
  }

  function openConnectorModal(platform, existing) {
    var doc = state.docs[platform] || '';
    var cfg = (existing && existing.config) || {};
    showModal('Connect: ' + platform,
      (doc ? '<div style="background:#fff8eb;border:1px solid #fbbf24;padding:8px 12px;border-radius:8px;color:#92400e;font:500 12px Inter;margin-bottom:10px">' + esc(doc) + '</div>' : '') +
      '<label>Business / Page ID</label><input id="cnId" value="' + esc(cfg.business_id || cfg.page_id || cfg.business_unit_id || '') + '">' +
      '<label>API key / access token</label><input id="cnKey" placeholder="••••••••">' +
      '<label>Refresh token (Google)</label><input id="cnRefresh" placeholder="optional">',
      function () {
        var data = { platform: platform, config: {
          business_id: document.getElementById('cnId').value.trim(),
          api_key:     document.getElementById('cnKey').value.trim() || undefined,
          refresh_token: document.getElementById('cnRefresh').value.trim() || undefined,
        }};
        return api('POST', API + '/connectors', data).then(function () { toast('Saved.'); loadConnectors(); });
      }
    );
  }

  /* ── modal helper ── */
  function showModal(title, bodyHtml, onSave, onDelete) {
    var existing = document.getElementById('repModalRoot');
    if (existing) existing.remove();
    var bd = document.createElement('div');
    bd.id = 'repModalRoot';
    bd.className = 'modal-bd open';
    bd.innerHTML = '<div class="modal-bx"><h3>' + esc(title) + '</h3>' + bodyHtml +
      '<div class="acts">' +
        '<button class="btn btn-secondary" data-cancel>Cancel</button>' +
        (onDelete ? '<button class="btn btn-danger" data-delete>Delete</button>' : '') +
        '<button class="btn btn-primary" data-save>Save</button>' +
      '</div></div>';
    document.body.appendChild(bd);
    bd.addEventListener('click', function (e) { if (e.target === bd) bd.remove(); });
    bd.querySelector('[data-cancel]').addEventListener('click', function () { bd.remove(); });
    bd.querySelector('[data-save]').addEventListener('click', function () {
      var p = onSave();
      if (p && p.then) p.then(function () { bd.remove(); }, function () { /* keep open on validation reject */ });
      else if (p !== false) bd.remove();
    });
    if (onDelete) bd.querySelector('[data-delete]').addEventListener('click', function () {
      var p = onDelete();
      if (p && p.then) p.then(function () { bd.remove(); });
    });
  }

  /* ── boot ── */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.CRM_APP && CRM_APP.buildHeader) CRM_APP.buildHeader('Reputation', '');
    renderShell();
    loadStats();
    loadReviews();
  });
})();
