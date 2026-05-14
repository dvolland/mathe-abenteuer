/* ══════════════════════════════════════════
   Mathe-Abenteuer – Service Worker
   Offline-Cache: alle App-Dateien werden
   beim ersten Besuch gecacht und danach
   auch ohne Netz geladen.
══════════════════════════════════════════ */

const CACHE  = 'mathe-abenteuer-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

/* ── INSTALL: alle Dateien voraus-cachen ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())   // sofort aktiv werden
  );
});

/* ── ACTIVATE: alte Caches aufräumen ───── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE)
          .map(k  => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // alle offenen Tabs übernehmen
  );
});

/* ── FETCH: Cache-first, Netz als Fallback */
self.addEventListener('fetch', event => {
  // Nur GET-Anfragen cachen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Nur gültige Antworten cachen
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => {
        // Offline und nicht im Cache → leere Antwort
        return new Response('Offline – bitte öffne zuerst die App mit Netz.', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
