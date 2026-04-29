/* Predictions widget — predicted close-probability for a single contact.
   Mountable: NWMPredictions.mount('#el', { contactId: 42 }).
   Backed by /api/predictions (api-php/routes/predictions.php).
*/
(function (w) {
  "use strict";

  function api(method, path) {
    var headers = { "Accept": "application/json" };
    try {
      var tok = localStorage.getItem("nwm_token");
      if (tok) headers["X-Auth-Token"] = tok;
    } catch (_) {}
    return fetch(path, { method: method, headers: headers, credentials: "include" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); });
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; });
  }

  function ensureCss() {
    if (document.getElementById("nwm-pred-css")) return;
    var s = document.createElement("style");
    s.id = "nwm-pred-css";
    s.textContent = [
      ".nwm-pred{font:500 13px Inter,system-ui,sans-serif;color:#1a1a2e}",
      ".nwm-pred h4{margin:0 0 8px;font:700 14px Inter;color:#010F3B;letter-spacing:.3px}",
      ".nwm-pred-bar{position:relative;height:8px;border-radius:4px;background:#f2f3f8;overflow:hidden;margin:6px 0}",
      ".nwm-pred-bar .fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#FF671F,#10b981);transition:width .4s}",
      ".nwm-pred-score{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}",
      ".nwm-pred-score .pct{font:800 22px Inter;color:#010F3B}",
      ".nwm-pred-score .baseline{font:600 11px Inter;color:#94a3b8}",
      ".nwm-pred-conf{font:600 10px Inter;text-transform:uppercase;letter-spacing:.5px;padding:2px 7px;border-radius:999px;display:inline-block}",
      ".nwm-pred-conf.high{background:#dcfce7;color:#166534}",
      ".nwm-pred-conf.medium{background:#fef3c7;color:#92400e}",
      ".nwm-pred-conf.low{background:#fee2e2;color:#b91c1c}",
      ".nwm-pred-conf.no_model,.nwm-pred-conf.no_positives,.nwm-pred-conf.baseline_only{background:#f2f3f8;color:#64748b}",
      ".nwm-pred-reasons{margin-top:8px;font-size:12px;color:#64748b}",
      ".nwm-pred-reasons li{margin:2px 0}",
      ".nwm-pred-reasons .lift-up{color:#10b981;font-weight:700}",
      ".nwm-pred-reasons .lift-down{color:#b91c1c;font-weight:700}",
      ".nwm-pred-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:8px;border-radius:8px;font-size:12px}",
      ".nwm-pred-empty{color:#94a3b8;font-size:12px;text-align:center;padding:14px 8px}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function mount(containerSelector, opts) {
    ensureCss();
    var el = typeof containerSelector === "string" ? document.querySelector(containerSelector) : containerSelector;
    if (!el || !opts || !opts.contactId) return null;

    el.classList.add("nwm-pred");
    el.innerHTML = '<h4>' + esc(opts.title || 'Predicted close probability') + '</h4>' +
                   '<div class="nwm-pred-empty">Computing…</div>';

    api("GET", "/api/predictions/contact/" + encodeURIComponent(opts.contactId)).then(function (r) {
      var p = r.prediction || {};
      var pct = (p.probability || 0);
      var baseline = (p.baseline || 0);
      var conf = p.confidence || 'low';
      var matches = p.matches || [];

      var reasonHtml = "";
      if (matches.length) {
        reasonHtml = '<div class="nwm-pred-reasons"><strong style="color:#1a1a2e">Top reasons:</strong><ul style="margin:3px 0 0;padding-left:18px">' +
          matches.map(function (m) {
            var liftPct = ((m.lift - 1) * 100);
            var cls = liftPct >= 0 ? 'lift-up' : 'lift-down';
            var sign = liftPct >= 0 ? '+' : '';
            return '<li><strong>' + esc(m.feature) + '=' + esc(m.value) + '</strong> · ' +
                   '<span class="' + cls + '">' + sign + liftPct.toFixed(0) + '% vs baseline</span> ' +
                   '<span style="color:#94a3b8">(' + m.sample + ' historical)</span></li>';
          }).join("") + '</ul></div>';
      }

      el.innerHTML =
        '<h4>' + esc(opts.title || 'Predicted close probability') + '</h4>' +
        '<div class="nwm-pred-score">' +
          '<span class="pct">' + pct.toFixed(1) + '%</span>' +
          '<span class="nwm-pred-conf ' + esc(conf) + '">' + esc(conf.replace(/_/g, ' ')) + '</span>' +
        '</div>' +
        '<div class="nwm-pred-bar"><div class="fill" style="width:' + Math.min(100, pct) + '%"></div></div>' +
        '<div class="baseline" style="font:600 11px Inter;color:#94a3b8;margin-top:2px">Baseline conversion: ' + baseline.toFixed(1) + '%</div>' +
        reasonHtml;
    }).catch(function (e) {
      el.innerHTML = '<h4>' + esc(opts.title || 'Predicted close probability') + '</h4>' +
                     '<div class="nwm-pred-error">Could not load prediction.<br><small>' +
                     esc((e && e.statusText) || 'API error — backend at /api/predictions must be deployed.') + '</small></div>';
    });

    return { element: el };
  }

  w.NWMPredictions = { mount: mount };
})(window);
