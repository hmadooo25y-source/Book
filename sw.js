const V = 'mulhim-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.allSettled(SHELL.map((u) => c.add(u)));
    await Promise.allSettled([PDFJS + 'pdf.min.js', PDFJS + 'pdf.worker.min.js'].map((u) => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Cache-first for offline speed; same-origin files refresh in the background.
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(r, { ignoreSearch: true });
    if (hit) {
      if (new URL(r.url).origin === location.origin) e.waitUntil(c.add(r).catch(() => {}));
      return hit;
    }
    try {
      const res = await fetch(r);
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) c.put(r, res.clone());
      return res;
    } catch {
      return r.mode === 'navigate' ? c.match('./index.html') : Response.error();
    }
  })());
});
