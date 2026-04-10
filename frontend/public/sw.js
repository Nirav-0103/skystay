self.addEventListener('push', function(event) {
  let payload = { title: 'SkyStay', message: 'You have a new update!', url: '/' };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch(e) {
      payload.message = event.data.text();
    }
  }

  const options = {
    body: payload.message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/' },
    actions: [
      { action: 'open', title: '✈️ Open SkyStay' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: false,
    tag: 'skystay-notification', // Replace previous notification of same type
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // App not open — open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Keep service worker alive
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
