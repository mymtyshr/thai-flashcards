const CACHE = 'thai-phrases-v11';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  // cache: 'reload' … ブラウザの一時キャッシュ（GitHub Pagesは約10分）を使わず、必ず最新を取る
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットワーク優先：つながれば常に最新を表示し、取れたらキャッシュを更新する。
// 圏外・通信が遅い（4秒超）ときはキャッシュで起動する（旅行先でもオフラインで使える）
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const net = fetch(e.request, { cache: 'no-cache' }).then((res) => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
      if (!cached) return net;
      const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), 4000));
      return Promise.race([net.catch(() => cached), timeout]);
    })
  );
});
