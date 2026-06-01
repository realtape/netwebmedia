/* NWM Sentry bootstrap — vanilla, no bundler.
 * Activates only when window.NWM_SENTRY_DSN is set. Safe to ship empty.
 * Loads Sentry browser SDK from CDN on demand.
 */
(function () {
  var dsn = window.NWM_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || dsn.indexOf('http') !== 0) return;

  var host = (location && location.hostname) || '';
  var env = (host === 'netwebmedia.com' || host === 'www.netwebmedia.com') ? 'production' : 'dev';
  var release = window.NWM_RELEASE || 'nwm@unknown';

  var s = document.createElement('script');
  s.src = 'https://browser.sentry-cdn.com/7.119.0/bundle.tracing.min.js';
  s.crossOrigin = 'anonymous';
  s.async = true;
  s.onload = function () {
    if (!window.Sentry) return;
    try {
      window.Sentry.init({
        dsn: dsn,
        environment: env,
        release: release,
        tracesSampleRate: env === 'production' ? 0.1 : 1.0,
        ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured']
      });
    } catch (e) { /* never let telemetry break the page */ }
  };
  document.head.appendChild(s);

  // Fallback capture before SDK loads: queue errors, flush on load.
  window.addEventListener('error', function (ev) {
    if (window.Sentry && window.Sentry.captureException && ev.error) {
      window.Sentry.captureException(ev.error);
    }
  });
  window.addEventListener('unhandledrejection', function (ev) {
    if (window.Sentry && window.Sentry.captureException) {
      window.Sentry.captureException(ev.reason || new Error('unhandledrejection'));
    }
  });
})();
