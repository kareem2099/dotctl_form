// Service Worker for Referral Push Notifications

const CACHE_NAME = 'dotctl-referral-v1';

// Install event - cache essential resources
self.addEventListener('install', () => {
  console.log('Service Worker: Install event');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('Push notification data:', data);

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: data.image || undefined,
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'referral-notification',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click', event);
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Handle different actions
  if (action === 'view-referrals') {
    event.waitUntil(
      // For client-side routing, we'll send a message to the client
      // The client will handle navigation
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            action: 'navigate',
            path: data.path || '/#referrals'
          });
        });

        // If no clients open, open new window
        if (clients.length === 0) {
          return self.clients.openWindow('/');
        }

        // Focus existing window
        if (clients[0] && clients[0].focused) {
          return clients[0].focus();
        }
        return clients[0].focus();
      })
    );
  } else if (action === 'dismiss') {
    // Just dismiss, no action needed
    return;
  } else {
    // Default action: navigate to referral dashboard
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length === 0) {
          return self.clients.openWindow('/');
        }
        return clients[0].focus();
      })
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for failed requests (if needed)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);

  if (event.tag === 'referral-notification-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  // Could implement retry logic for failed notification sends
  console.log('Performing background sync for notifications');
}
