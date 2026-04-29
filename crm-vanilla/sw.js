/* NetWebMedia CRM service worker — handles web push notifications.
   Must be served from the CRM root with scope "/crm-vanilla/" or "/" depending
   on deployment. The widget registers it from /crm-vanilla/sw.js.
*/
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var payload = { title: 'NetWebMedia CRM', body: '' };
  try {
    if (event.data) {
      var text = event.data.text();
      try { payload = Object.assign(payload, JSON.parse(text)); }
      catch (_) { payload.body = text; }
    }
  } catch (_) {}

  var opts = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: { link: payload.link || '/' },
    tag: payload.tag || 'nwm-default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'NetWebMedia CRM', opts));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var link = (event.notification && event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if ('focus' in c) { c.focus(); if ('navigate' in c) c.navigate(link); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    })
  );
});
