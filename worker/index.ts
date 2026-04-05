/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope & { __WB_DISABLE_DEV_LOGS: boolean };

// Allow disable via flags
sw.__WB_DISABLE_DEV_LOGS = true;

// Listen to push events
sw.addEventListener('push', (event: any) => {
  const data = JSON.parse(event.data?.text() || '{}');
  
  event.waitUntil(
    sw.registration.showNotification(data.title || 'New Daily Pawzzle! 🐶', {
      body: data.body || 'Can you beat today\'s challenge?',
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/daily',
      },
    } as any)
  );
});

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/daily';

  event.waitUntil(
    sw.clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(urlToOpen);
      }
    })
  );
});
