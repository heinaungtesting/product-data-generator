/**
 * Service Worker for MyApp PWA
 * Workbox-based offline caching strategy with smart image caching
 */

const CACHE_NAME = 'myapp-v2';
const RUNTIME_CACHE = 'myapp-runtime';
const IMAGE_CACHE = 'myapp-images-v1';

// Cache size limits
const MAX_IMAGE_CACHE_SIZE = 100; // Maximum number of images to cache

const PRECACHE_URLS = [
  '/',
  '/offline',
];

// Image URL patterns to cache
const IMAGE_PATTERNS = [
  /\/images\//i,                                    // Local /images/ directory
  /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)(\?.*)?$/i, // Image file extensions
  /supabase\.co.*\/storage\/.*\/(images|thumbnails|products)/i, // Supabase storage images
  /cloudinary\.com/i,                              // Cloudinary CDN
  /imgix\.net/i,                                   // Imgix CDN
  /res\.cloudinary\.com/i,                         // Cloudinary alternate
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches not in the current version list
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Check if a URL matches image patterns
 */
function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Trim cache to max size (FIFO - removes oldest entries)
 */
async function trimCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    const deleteCount = keys.length - maxSize;
    console.log(`[SW] Trimming ${deleteCount} old entries from ${cacheName}`);

    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * StaleWhileRevalidate strategy for images
 * - Returns cached version immediately (stale)
 * - Fetches fresh version in background (revalidate)
 * - Updates cache with fresh version
 * - Falls back to network if not cached
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  // Start fetching fresh version in background
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      // Only cache successful responses
      if (networkResponse.ok) {
        // Clone before caching
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);

        // Trim cache if needed (async, don't block)
        trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE).catch(console.error);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network fetch failed for image:', request.url, error);
      // If we have a cached version, we've already returned it
      // If not, return undefined to trigger the fallback
      return undefined;
    });

  // Return cached response immediately, or wait for network
  if (cachedResponse) {
    console.log('[SW] Returning cached image:', request.url);
    // Don't await fetchPromise - let it update cache in background
    fetchPromise.catch(() => {}); // Suppress unhandled rejection
    return cachedResponse;
  }

  // No cache, wait for network
  console.log('[SW] Fetching image from network:', request.url);
  const networkResponse = await fetchPromise;

  if (networkResponse) {
    return networkResponse;
  }

  // Network failed and no cache - return a placeholder or error response
  return new Response('Image not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Fetch event - smart caching with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other schemes
  if (!url.startsWith('http')) {
    return;
  }

  // StaleWhileRevalidate for images - ensures offline availability
  if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Network first for API calls and bundle
  if (url.includes('/api/') || url.includes('bundle.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // Cache first for static assets (HTML, JS, CSS)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache if not successful or cross-origin
        if (!response || response.status !== 200) {
          return response;
        }

        // Allow caching of cross-origin responses (opaque) for CDN assets
        const shouldCache = response.type === 'basic' || response.type === 'cors';

        if (shouldCache) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      });
    })
  );
});

// Background sync for future implementation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-products') {
    event.waitUntil(syncProducts());
  }
});

async function syncProducts() {
  // Future implementation: background sync
  console.log('Background sync triggered');
}

// Push notifications (future)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'MyApp Update';
  const options = {
    body: data.body || 'New products available',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
