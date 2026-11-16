/* Cache only versioned public application assets. Vault data and imported files never enter this cache. */
const BUILD_ID = '__BUILD_ID__';
const CACHE_PREFIX = `classrup-public-v1:${encodeURIComponent(self.registration.scope)}:`;
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const ASSETS = ['./', './index.html', './app.js', './styles.css', './manifest.webmanifest', './icon.svg']
  .map(asset => new URL(asset, self.registration.scope).href);
const ALLOWED = new Set(ASSETS);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(ASSETS.map(url => new Request(url, { credentials: 'omit', cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // A newer worker waits until old tabs close; do not replace an active app mid-session.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !ALLOWED.has(request.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request.url);
    // Never expand the allowlist or put network/runtime responses into the cache.
    return cached ?? fetch(request);
  })());
});
