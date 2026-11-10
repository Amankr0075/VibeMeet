// ═══════════════════════════════════════════════════════════
// VibeMeet Service Worker
// Strategy:
//   - App shell (HTML/JS/CSS)  → CacheFirst  (versioned)
//   - Fonts & images           → CacheFirst  (long TTL)
//   - API calls                → NetworkFirst with cache fallback
//   - Socket.IO / WebRTC       → Network only (never cached)
// ═══════════════════════════════════════════════════════════

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `vibemeet-shell-${CACHE_VERSION}`;
const ASSET_CACHE   = `vibemeet-assets-${CACHE_VERSION}`;
const API_CACHE     = `vibemeet-api-${CACHE_VERSION}`;

// App shell URLs to pre-cache on install
const SHELL_URLS = [
  '/',
  '/offline.html',
];

// ── Install: pre-cache offline shell ───────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_URLS).catch(() => {
        // Non-fatal: offline.html may not exist yet during first build
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ──────────────────────────
self.addEventListener('activate', (event) => {
  const knownCaches = [SHELL_CACHE, ASSET_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !knownCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache: Socket.IO, WebRTC, non-GET, cross-origin API
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.startsWith('/api/auth') ||      // auth always fresh
    url.pathname.startsWith('/api/admin') ||
    url.hostname !== self.location.hostname &&    // allow only same-origin or CDN fonts
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')
  ) {
    return; // let browser handle it normally
  }

  // 2. Font / image assets → CacheFirst (long lived)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // 3. JS / CSS / built assets → CacheFirst (content-hashed filenames)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE, 30 * 24 * 60 * 60));
    return;
  }

  // 4. Cacheable API endpoints → NetworkFirst with 5-min stale fallback
  if (
    url.pathname.startsWith('/api/health') ||
    url.pathname.startsWith('/api/users/profile')
  ) {
    event.respondWith(networkFirst(request, API_CACHE, 5 * 60));
    return;
  }

  // 5. HTML navigation → NetworkFirst, fallback to cached shell
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      networkFirst(request, SHELL_CACHE, 60).catch(() =>
        caches.match('/').then((r) => r || fetch(request))
      )
    );
    return;
  }

  // 6. Everything else → NetworkFirst
  event.respondWith(networkFirst(request, API_CACHE, 60));
});

// ── Cache helpers ───────────────────────────────────────────

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const age = cachedAgeSeconds(cached);
    if (age < maxAgeSeconds) return cached;
  }
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    if (cached) return cached;
    throw new Error('Network error and no cache available');
  }
}

async function networkFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request, { signal: AbortSignal.timeout(8000) });
    if (fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const age = cachedAgeSeconds(cached);
      if (age < maxAgeSeconds) return cached;
    }
    throw new Error('Network error and no cache available');
  }
}

function cachedAgeSeconds(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return 0;
  return (Date.now() - new Date(dateHeader).getTime()) / 1000;
}

// ── Background Sync: retry failed queue requests ───────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-queue') {
    event.waitUntil(retryPendingQueue());
  }
});

async function retryPendingQueue() {
  // Clients can post messages to retry socket reconnection etc.
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage({ type: 'SYNC_RETRY' }));
}

// ── Push Notifications (groundwork) ────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'VibeMeet', {
      body: data.body || 'You have a new notification.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      data: data,
      vibrate: [200, 100, 200],
      tag: 'vibemeet-notification',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

