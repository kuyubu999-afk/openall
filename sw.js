/* Service Worker:首次联网访问后,把全部文件缓存到本地,之后离线也能打开 */
const CACHE = 'travel-guide-v1';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'art.js',
  'app.js',
  'data-asia.js',
  'data-europe.js',
  'data-world.js',
  'manifest.webmanifest',
  'icon.svg'
  // 如果你在 images/ 里放了自己的照片,请把路径也加到这里,例如 'images/japan-1.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 外部视频链接等不处理

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return hit || net;
    })
  );
});
