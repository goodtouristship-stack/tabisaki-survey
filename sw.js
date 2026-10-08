// 旅先クイズ会 — オフライン起動用 Service Worker
// 通信できるときは最新版を取りに行き、取れないとき（圏外・電波が弱い）は保存済みの版を使う
const CACHE = 'tqk-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    new Promise((resolve, reject) => {
      const timer = setTimeout(reject, 3000); // 3秒で応答がなければ保存済みの版へ
      fetch(req).then(res => {
        clearTimeout(timer);
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        resolve(res);
      }).catch(err => { clearTimeout(timer); reject(err); });
    }).catch(() =>
      caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match('./index.html'))
    )
  );
});
