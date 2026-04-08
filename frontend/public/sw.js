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
    icon: '/logo.png', // Assuming there's a logo.png in public folder
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/' },
    actions: [
      { action: 'open', title: 'Open SkyStay' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) { client = clientList[i]; break; }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
