/* NetWebMedia page-visit pixel.
 *
 * Drop on any page:
 *   <script src="/assets/nwm-track.js" defer></script>
 *
 * Behavior:
 *   - Sends a single beacon to /api/public/track-visit per pageview.
 *   - Carries email if the user has logged in (nwm_user in localStorage) or
 *     was identified by a form/campaign link with ?email= in the URL.
 *   - Persists a session id in localStorage (nwm_track_sid) so anonymous
 *     visit-count thresholds (e.g. 3 visits to /pricing) work across sessions.
 *   - Honors Do Not Track and ?nwm_no_track=1 in URL for opt-out.
 */
(function () {
  if (typeof window === 'undefined') return;

  /* Opt-outs */
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;
  try {
    var u = new URL(window.location.href);
    if (u.searchParams.get('nwm_no_track') === '1') return;
  } catch (e) {}

  function getOrMakeSid() {
    var k = 'nwm_track_sid';
    var s;
    try { s = localStorage.getItem(k); } catch (e) {}
    if (s && /^[a-z0-9_\-]{6,64}$/i.test(s)) return s;
    s = 'nwm_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    try { localStorage.setItem(k, s); } catch (e) {}
    return s;
  }

  function getKnownEmail() {
    /* 1) URL param ?email=  (campaign click-through) */
    try {
      var p = new URL(window.location.href).searchParams.get('email');
      if (p && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)) {
        try { localStorage.setItem('nwm_track_email', p.toLowerCase()); } catch (e) {}
        return p.toLowerCase();
      }
    } catch (e) {}
    /* 2) Existing logged-in CRM user */
    try {
      var u = JSON.parse(localStorage.getItem('nwm_user') || 'null');
      if (u && u.email) return String(u.email).toLowerCase();
    } catch (e) {}
    /* 3) Previously identified visitor */
    try {
      var t = localStorage.getItem('nwm_track_email');
      if (t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return t;
    } catch (e) {}
    return null;
  }

  var payload = {
    page_url: window.location.href,
    session_id: getOrMakeSid(),
    email: getKnownEmail()
  };

  /* Send via sendBeacon when available so it survives unloads cleanly */
  function send() {
    var url = '/api/public/track-visit';
    var json = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([json], { type: 'application/json' });
        if (navigator.sendBeacon(url, blob)) return;
      }
    } catch (e) {}
    /* Fallback: fire-and-forget fetch */
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {});
    } catch (e) {}
  }

  /* Defer slightly so we don't compete with critical-path requests */
  if (document.readyState === 'complete') {
    setTimeout(send, 600);
  } else {
    window.addEventListener('load', function () { setTimeout(send, 600); });
  }
})();
